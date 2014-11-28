
module.exports = lookup;

var url = require('url');
var path = require('path');
var debug = require('debug')('component-builder:scripts:lookup');

// default extensions to look up
var extensions = [
  '',
  '.js',
  '.json',
  '/index.js',
];

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
 */

function* lookup (file, target, opts) {
  target = target.toLowerCase();

  var currentDir = target.slice(0, 2) === './';
  var parentDir = target.slice(0, 3) === '../';
  if (currentDir || parentDir ) {
    var lookup_ = lookupRelative(file, target);
    if (lookup_ != null) return lookup_;
    return target;
  } else {
    return yield* lookupDependency(file, target, opts);
  }
}


/**
 * Lookup a relative file.
 *
 * @param {Object} file
 * @param {String} target
 * @return {String} name
 * @api private
 */

function lookupRelative (file, target) {
  var path_ = url.resolve(file.path, target);
  var files = file.manifest.files;

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    // we need this fallback to check relatives from a foreign local
    var name = f.name || path.join(f.manifest.name, path.relative(f.manifest.path, f.filename));
    for (var j = 0; j < extensions.length; j++) {
      // check by adding extensions
      if (f.path.toLowerCase() === path_ + extensions[j]) return name;
    }
    // check by removing extensions
    if (f.path.replace(/\.\w+$/, '').toLowerCase() === path_) return name;
  }

  var message = 'ignore "' + target + '" , could not resolve from "' + file.branch.name + '"\'s file "' + file.path + '"';
  debug(message);
  return null;
}


/**
 * Look up a remote dependency.
 * Valid references:
 *
 *   <repo>
 *   <user>-<repo>
 *   <user>~<repo>
 *
 * or:
 *
 *   <reference>/<filename>
 *
 * @param {Object} component
 * @param {Object} file
 * @param {String} target
 * @return {String} name
 * @api private
 */

function* lookupDependency (file, target, opts) {
  var frags = target.split('/');
  var reference = frags[0];
  var tail = frags.length > 1
    ? ('/' + frags.slice(1).join('/'))
    : ''

  var branch = file.branch;
  var deps = branch.dependencies;
  var names = Object.keys(deps);

  // <user>~<repo>
  if (~reference.indexOf('~')) {
    var name = reference.replace('~', '/');
    if (deps[name]) return deps[name].canonical + tail;
  }

  // <user>-<repo>
  if (~reference.indexOf('-')) {
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (reference === name.replace('/', '-')) {
        return deps[name].canonical + tail;
      }
    }
  }

  // local
  var localDeps = Object.keys(branch.locals);
  for (var i = 0; i < localDeps.length; i++) {
    // Find a local dependency that matches as a prefix of the target
    // or the whole target, and return the canonical path.
    var re = new RegExp("^("+localDeps[i]+")(/.*)?$");
    if (m = re.exec(target)) {
      var dep = m[1];
      var tail = m[2] || '';
      if (tail !== '') {
        var relativeFile = '.' + tail;
        var resolvedTail = yield* lookupRelativeForLocal(branch.locals[dep], relativeFile, opts);
        if (resolvedTail != null) {
          debug('resolved relative file for local "' + dep + '/' + resolvedTail + '"');
          return branch.locals[dep].canonical + '/' + resolvedTail;
        }
      } 
      return branch.locals[dep].canonical + tail;

    }
  }

  // <repo>
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var repo = name.split('/')[1];
    if (repo === reference) {
      return deps[name].canonical + tail;
    }
  }

  // component.json name, if different than repo
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var dep = deps[name];
    if (dep.node.name.toLowerCase() === reference) {
      return dep.canonical + tail;
    }
  }

  // to do: look up stuff outside the dependencies
  debug('could not resolve "%s" from "%s"', target, file.name)
  return target
}

function* lookupRelativeForLocal (localBranch, relativeTarget, opts) {
  var createManifest = require('component-manifest');
  
  var manifestGenerator = createManifest(opts);
  var manifest = yield* manifestGenerator(localBranch);
  
  var obj = {
    path: '', // it should simulate a url-relative path
    manifest: manifest,
    branch: localBranch
  }
  // resolve the file (if extension is not provided)
  var resolved = lookupRelative(obj, relativeTarget);
  if (resolved == null) return null;

  var relative = path.relative(manifest.name, resolved);

  return relative;
}
