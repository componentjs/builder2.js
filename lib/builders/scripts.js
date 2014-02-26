var requires = require('requires');
var fs = require('graceful-fs');
var join = require('path').join;
var relative = require('path').relative;
var url = require('url');
var debug = require('debug')('builder:scripts');

var Builder = require('./builder');
var utils = require('../utils');

// requirejs implementation
var requirejs = fs.readFileSync(require.resolve('component-require2'), 'utf8');

// default extension to look up
var extensions = [
  '',
  '.js',
  '.json',
  '/index.js',
]

module.exports = Scripts

Builder.extend(Scripts)

function Scripts(branches, options) {
  if (!(this instanceof Scripts)) return new Scripts(branches, options);

  options = options || {};
  Builder.call(this, branches, options);

  // include the `require()` function by default.
  if (options.require !== false) this.push(requirejs + '\n\n');
}

/**
 * Go through all the branches, filter out the components,
 * then format it so we can proces them easier.
 *
 * @param {Object} branch
 * @api private
 */

Scripts.prototype.resolve = function* (branch) {
  var fields = this.fields;
  var component = branch.node;

  // object that nicely stores component info
  var obj = {
    branch: branch,
    component: component,
    // look up deps and locals easily
    dependencies: branch.dependencies,
    locals: branch.locals
  };

  // dependencies are named as
  // <user>/<repo>@<ref>
  obj.name = utils.name(branch);
  // path where all the files of this component are located
  obj.path = branch.path;

  var files = yield* this.unglob(obj);

  if (component.main) {
    obj.main = utils.stripLeading(component.main);
  } else {
    // if no obj.main, guess it by going down the fields
    top:
    for (var i = 0; i < fields.length; i++) {
      var paths = files[fields[i]];
      for (var j = 0; j < paths.length; j++) {
        if (/^index\.\w+/.test(paths[j])) {
          obj.main = paths[j];
          break top;
        }
      }
    }

    if (!obj.main) {
      // do some magic - select the first object in the first field
      top2:
      for (var i = 0; i < fields.length; i++) {
        var paths = files[fields[i]];
        if (paths.length) {
          obj.main = paths[0];
          break top2;
        }
      }
    }
  }

  if (!obj.main) return debug('no .main found for "%s"', branch.name);

  // main's folder prefix. we strip this when naming the component's files
  // i.e. lib/index.js -> lib/
  // so we name the file `lib/asdf.js` as `local/asdf.js`
  var prefix = obj.prefix = obj.main.replace(/[^\/]*$/, '');

  // convert every field into a `file` object suitable for the middleware
  fields.forEach(function (field) {
    files[field] = files[field].map(toFileObject);
  });

  // all files in a single array for easier relative lookups
  obj.all = fields.map(function (field) {
    return files[field];
  }).reduce(utils.concat, []);

  this.dispatch(files);

  // convert every path to a file object suitable for middleware
  function toFileObject(path) {
    var file = {
      // path relative to the folder
      path: path,
      obj: obj,
      branch: branch,
      component: component,
      filename: join(obj.path, path),
      extension: path.split('.').pop()
    };

    // read utility
    file.read = utils.read(file);
    // path relative to main
    file.resolvedPath = !path.indexOf(prefix)
      ? path.slice(prefix.length)
      : path;
    // commonjs registered name
    file.name = obj.name + (path === obj.main
      ? ''
      : '/' + file.resolvedPath);
    return file;
  }
}

/**
 * The last middleware of every field.
 * Checks to see if the file is "used",
 * then appends it if it is.
 *
 * @param {Object} field
 * @param {Object} file
 * @return {String}
 * @api private
 */

Scripts.prototype.append = function* (field, file) {
  yield* this.transform(field, file);
  // read file now if not already read
  if (file.string === true) yield file.read;
  // if no file.string, ignore this file
  if (typeof file.string !== 'string') return '';
  return this[file.define ? 'define' : 'register'](file) + '\n\n';
}

/**
 * Register a file with the require.register(name, new Function()) stuff.
 * This is added to the end of every middleware stack.
 *
 * To do:
 *
 *   - more aliases for dynamic requires. need to make sure only do one module per alias in case of duplicates.
 *   - define them all at once in one giant object? hahaha dm;gzip
 *
 * @param {Object} file
 * @return {String}
 * @api private
 */

Scripts.prototype.register = function (file) {
  var self = this;
  var js = file.string;

  // rewrite all the requires
  js = requires(js, function (require) {
    return 'require("'
      + self.lookup(file, require.path)
      + '")';
  });

  var name = file.name;
  if (this.dev) {
    if (file.sourceMap) {
      js += '\n//# sourceMappingURL='
        + 'data:application/json;charset=utf-8;base64,'
        + new Buffer(file.sourceMap).toString('base64');
    } else {
      js += '\n//# sourceURL=' + relative(this.root, file.filename);
    }
    js = JSON.stringify(js);
    js = js.replace(/\\n/g, '\\n\\\n');
    js = 'require.register("'
      + name
      + '", Function("exports, module",\n'
      + js
      + '\n));';
  } else {
    js = 'require.register("'
      + name
      + '", function (exports, module) {\n'
      + js
      + '\n});';
  }

  return js;
}

/**
 * Define a module without the closure.
 * Specifically for JSON and strings.
 *
 * @param {Object} file
 * @return {String}
 * @api private
 */

Scripts.prototype.define = function (file) {
  return 'require.define("' + file.name + '", ' + file.string + ');';
}

/**
 * From a file, lookup another file within that dep.
 * For use within `require()`s.
 *
 * To do:
 *
 *   - people like @raynos will want to be able to do require('component/lib') or something but F that!
 *
 * @param {Object} file
 * @param {String} target
 * @return {String} name
 * @api private
 */

Scripts.prototype.lookup = function (file, target) {
  return target.slice(0, 2) === './'
    ? this.lookupRelative(file, target)
    : this.lookupDependency(file, target);
}

/**
 * Lookup a relative file.
 *
 * @param {Object} file
 * @param {String} target
 * @return {String} name
 * @api private
 */

Scripts.prototype.lookupRelative = function (file, target) {
  var path = url.resolve(file.path, target);
  var files = file.obj.all;

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    for (var j = 0; j < extensions.length; j++) {
      // check by adding extensions
      if (f.path === path + extensions[j]) return f.name;
    }
    // check by removing extensions
    if (f.path.replace(/\.\w+$/, '') === path) return f.name;
  }

  var message = 'could not resolve "' + target + '" from "' + file.obj.name + '"\'s file "' + file.path + '"';
  if (file.branch.type === 'local') throw new Error(message);
  debug(message);
}

/**
 * Look up a dependency.
 *
 * @param {Object} component
 * @param {Object} file
 * @param {String} target
 * @return {String} name
 * @api private
 */

Scripts.prototype.lookupDependency = function (file, target) {
  // assume the user, for whatever reason,
  // wrote the whole damn thing out.
  // we also assume that it's valid.
  // not going to bother to check.
  if (~target.indexOf('/') && ~target.indexOf('@')) return target;

  var deps = file.obj.dependencies;
  var names = Object.keys(deps);

  // repo name
  for (var i = 0; i < names.length; i++)
    if (names[i].split('/')[1] === target)
      return utils.name(deps[names[i]]);

  // <user>/<repo> for whatever reason
  if (deps[target]) return utils.name(deps[target]);

  // local
  if (file.obj.locals[target]) return target;

  // assume it's <user>-<module>
  for (var i = 0; i < names.length; i++)
    if (names[i].split('/').join('-') === target)
      return utils.name(deps[names[i]]);

  // to do: look up stuff outside the dependencies
  debug('could not resolve "%s" from "%s"', target, file.obj.name)
  return target
}