var co = require('co')
var fs = require('graceful-fs')
var parchan = require('parchan')
var Readable = require('stream').Readable
var inherits = require('util').inherits
var resolve = require('path').resolve
var join = require('path').join
var url = require('url')

module.exports = Builder

inherits(Builder, Readable)

require('./convenience')(Builder.prototype)

function Builder(branches, options) {
  if (!(this instanceof Builder))
    return new Builder(branches, options)

  options = options || {}
  Readable.call(this, options)

  this.concurrency = options.concurrency || 16
  this.dev = !!options.development
  this.out = resolve(options.out || 'components')
  this.urlPrefix = options.urlPrefix || ''

  this.components = []

  branches.forEach(this.resolve, this)

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
    files: []
  }

  var files = (component.styles || [])
  .concat(this.dev && dev.styles || [])
  if (!files.length) return

  obj.path = branch.path
    || join(this.out, branch.name.split('/').join('-') + '-' + branch.ref)

  obj.files = files.map(function (filename) {
    return resolve(obj.path, filename)
  })

  this.components.push(obj)
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

Builder.prototype.append = function* (component, filename) {
  var str
  try {
    str = yield function (done) {
      fs.readFile(filename, 'utf8', done)
    }
  } catch (err) {
    throw new Error('failed to read "' + component.name + '"\'s file "' + filename + '"')
  }

  return this.rewriteUrls(component, str) + '\n\n'
}

 /**
  * Rewrite `url()`s for the build.
  *
  * @param {Object} branch
  * @param {String} CSS
  * @return {String} CSS
  * @api private
  */

Builder.prototype.rewriteUrls = function (component, css) {
  var prefix = this.urlPrefix
  var branch = component.branch

  return css.replace(/\burl *\(([^)]+)\)/g, function rewrite(_, uri) {
    var orig = 'url(' + uri + ')';
    uri = stripQuotes(uri);
    if (isData(uri)) return orig;
    if (isAbsolute(uri)) return orig;
    return 'url("'
      + url.resolve(prefix + folder(branch), uri)
      + '")'
  });
}

function folder(branch) {
  if (branch.type === 'local') return branch.name + '/'
  return branch.name + '/' + branch.ref + '/'
}

function isAbsolute(url) {
  return ~url.indexOf('://') || url[0] === '/';
}

function isData(url) {
  return 0 === url.indexOf('data:');
}

function stripQuotes(str) {
  if ('"' === str[0] || "'" === str[0]) return str.slice(1, -1);
  return str;
}