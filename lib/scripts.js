var co = require('co')
var fs = require('graceful-fs')
var parchan = require('parchan')
var requires = require('requires')
var Readable = require('stream').Readable
var inherits = require('util').inherits
var resolve = require('path').resolve
var join = require('path').join
var url = require('url')

var requirejs = fs.readFileSync(join(__dirname, 'require.js'), 'utf8')

// default extension to look up
var extensions = [
  '',
  '.js',
  '.json',
  '/index.js',
]

var transforms = {
  string: function (str) {
    // convert a string to JS
    // https://github.com/visionmedia/node-string-to-js/blob/master/index.js
    return JSON.stringify(str
      .replace(/'/g, "\\'")
      .replace(/\r\n|\r|\n/g, "\\n"))
  },
}

// default fields
var fields = [
  'scripts',
  'json',
  'templates',
]

module.exports = Builder

inherits(Builder, Readable)

require('./convenience')(Builder.prototype)

function Builder(branches, options) {
  if (!(this instanceof Builder))
    return new Builder(branches, options)

  options = options || {}
  Readable.call(this, options)

  this.concurrency = options.concurrency || 16
  this.dev = !!(options.development || options.dev)
  this.out = resolve(options.out || 'components')

  // to do: make it more usable
  this.fields = options.fields || fields
  this.transforms = options.transforms || transforms

  this.components = []

  branches.forEach(this.resolve, this)

  if (options.require !== false) this.push(requirejs + '\n\n')

  var self = this
  this.run(function (err) {
    if (err) self.emit('error', err)
  })
}

Builder.prototype._read = function () {}

/**
 * Go through all the branches, filter out the components,
 * then format it so we can proces them easier.
 *
 * @param {Object} branch
 * @api private
 */

Builder.prototype.resolve = function (branch) {
  var component = branch.node
  var dev = branch.type === 'local' && component.development || {}
  var obj = {
    branch: branch,
    component: component,
    // look up deps and locals easily
    dependencies: branch.dependencies,
    locals: branch.locals,
    files: []
  }

  var files = []
  var fields = this.fields
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i]
    if (component[field]) files = files.concat(component[field])
    if (this.dev && dev[field]) files = files.concat(dev[field])
  }
  if (!files.length) return

  obj.main = stripLeading(component.main || 'index.js')
  // main's folder prefix. we strip this when naming the component's files
  // i.e. lib/index.js -> lib/
  // so we name the file `lib/asdf.js` as `local/asdf.js`
  obj.prefix = obj.main.replace(/[^\/]*$/, '')
  // dependencies are named as
  // <user>/<repo>@<ref>
  obj.name = toSlug(branch)
  // path where all the files of this component are located
  obj.path = branch.path
    || join(this.out, branch.name.split('/').join('-') + '-' + branch.ref)
  files.forEach(pushFile)

  this.components.push(obj)

  // convert the file path to an object with
  // require.register path as well filename location
  function pushFile(path) {
    path = stripLeading(path)
    var resolvedPath = !path.indexOf(obj.prefix)
      ? path.slice(obj.prefix.length)
      : path

    var f = {
      path: path,
      // absolute path to the file
      filename: join(obj.path, path),
      // main === component/emitter@1.0.0
      // anything else === component/emitter@1.0.0/something.js
      name: obj.name + (path === obj.main
        ? ''
        : '/' + resolvedPath
      )
    }

    var m = /\w+$/.exec(path)
    if (!m) throw new Error('wtf a file without an extension?')
    switch (m[0]) {
      case 'js': break
      case 'json':
        f.define = true
        break
      default:
        f.transform = 'string'
        f.define = true
    }

    obj.files.push(f)
  }
}

/**
 * Actually run everything. Doesn't support backpressure.
 *
 * @api private
 */

Builder.prototype.run = co(function* () {
  yield setImmediate

  var ch = parchan({
    concurrency: this.concurrency
  })

  var components = this.components
  for (var i = 0; i < components.length; i++) {
    var component = components[i]
    var files = component.files
    for (var j = 0; j < files.length; j++) {
      ch.push(co(this.append(component, files[j])))
    }
  }

  while (ch.queue)
    this.push(yield* ch.read())

  this.push(null)
})

/**
 * Reads and transforms a file.
 *
 * @param {Object} component
 * @param {Object} file
 * @api private
 */

Builder.prototype.append = function* (component, file) {
  var js
  try {
    js = yield function (done) {
      fs.readFile(file.filename, 'utf8', done)
    }
  } catch (err) {
    throw new Error('failed to read "' + component.name + '"\'s file "' + file.path + '"')
  }

  var transform = file.transform
  if (transform) js = this.transforms[transform](js)

  return this[file.define ? 'define' : 'register']
    (component, file, js) + '\n\n'
}

/**
 * Register a file with the require.register(name, new Function()) stuff.
 *
 * To do:
 *
 *   - more aliases for dynamic requires. need to make sure only do one module per alias in case of duplicates.
 *   - define them all at once in one giant object? hahaha dm;gzip
 *
 * @param {Object} component
 * @param {Object} file
 * @param {String} javascript
 * @return {String}
 * @api private
 */

Builder.prototype.register = function (component, file, js) {
  var self = this

  // rewrite all the requires
  js = requires(js, function (require) {
    return 'require("'
      + self.lookup(component, file, require.path)
      + '")'
  })

  var name = file.name
  if (this.dev) {
    js = JSON.stringify(js + '//@ sourceURL=' + file.filename)
    js = js.replace(/\\n/g, '\\n\\\n')
    js = 'require.register("'
      + name
      + '", Function("exports, module",\n'
      + js
      + '\n));'
  } else {
    js = 'require.register("'
      + name
      + '", function (exports, module) {\n'
      + js
      + '\n});'
  }

  return js
}

/**
 * Define a module without the closure.
 * Specifically for JSON and strings.
 *
 * @param {Object} component
 * @param {Object} file
 * @param {String} javascript
 * @return {String}
 * @api private
 */

Builder.prototype.define = function (component, file, js) {
  return 'require.modules["'
    + file.name
    + '"] = { exports:\n'
    + js
    + '\n};'
}

/**
 * From a file, lookup another file within that dep.
 * For use within `require()`s.
 *
 * To do:
 *
 *   - people like @raynos will want to be able to do require('component/lib') or something but F that!
 *
 * @param {Object} component
 * @param {Object} source <file>
 * @param {String} target
 * @return {String} name
 * @api private
 */

Builder.prototype.lookup = function (component, source, target) {
  if (target.slice(0, 2) === './') return this.lookupRelative(component, source, target)
  else return this.lookupDependency(component, source, target)
}

/**
 * Lookup a relative file.
 *
 * @param {Object} component
 * @param {Object} source <file>
 * @param {String} target
 * @return {String} name
 * @api private
 */

Builder.prototype.lookupRelative = function (component, source, target) {
  var files = component.files
  var path = url.resolve(source.path, target)

  for (var i = 0; i < files.length; i++)
    for (var j = 0; j < extensions.length; j++)
      if (files[i].path === path + extensions[j])
        return files[i].name

  throw new Error('could not resolve "' + target + '" from "' + component.name + '"\'s file "' + source.path + '"')
}

/**
 * Look up a dependency.
 *
 * @param {Object} component
 * @param {Object} source <file>
 * @param {String} target
 * @return {String} name
 * @api private
 */

Builder.prototype.lookupDependency = function (component, source, target) {
  // assume the user, for whatever reason,
  // wrote the whole damn thing out.
  // we also assume that it's valid.
  // not going to bother to check.
  if (~target.indexOf('/') && ~target.indexOf('@')) return target

  var deps = component.dependencies
  var names = Object.keys(deps)

  // repo name
  for (var i = 0; i < names.length; i++)
    if (names[i].split('/')[1] === target)
      return toSlug(deps[names[i]])

  // <user>/<repo> for whatever reason
  if (deps[target]) return toSlug(deps[target])

  // local
  if (component.locals[target]) return target

  // assume it's <user>-<module>
  for (var i = 0; i < names.length; i++)
    if (names[i].split('/').join('-') === target)
      return toSlug(deps[names[i]])

  // to do: look up stuff outside the dependencies
  throw new Error('could not resolve "' + target + '" from component "' + component.name + '".')
}

function toSlug(branch) {
  if (branch.type === 'local') return branch.name
  return branch.name + '@' + branch.ref
}

function stripLeading(x) {
  if (x.slice(0, 2) === './') return x.slice(2)
  return x
}