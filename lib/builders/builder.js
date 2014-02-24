var co = require('co');
var chanel = require('chanel');
var unglob = require('unglob');
var join = require('path').join;
var resolve = require('path').resolve;
var extname = require('path').extname;
var inherits = require('util').inherits;

var utils = require('../utils');

module.exports = Builder;

/**
 * Easier than doing util.inherits.
 *
 * @param {Function} construct
 * @return {Function} construct
 * @api private
 */

Builder.extend = function (construct) {
  inherits(construct, this);
  return construct;
}

/**
 * The script and styles builder inherits from this.
 */

function Builder() {}

/**
 * Initialize the builder. Split because `Files` uses this stuff
 * but not the other stuff.
 *
 * @param {Array} branches
 * @param {Object} options
 * @api private
 */


Builder.prototype.initialize = function (branches, options) {
  // middleware
  this.branches = branches;
  // in all builders, dev mode includes `.development` fields
  // in local components. `.development` fields are
  // always ignored in remote components.
  this.dev = !!(options.development || options.dev);
  // where the components are installed
  // bad name, but it's the same option name as resolver.js
  this.dir = resolve(options.dir || options.out || 'components');
  this.root = resolve(options.root || process.cwd());
  this.channel = chanel({
    // concurrency is pretty unnecessary here
    // thanks to graceful-fs
    concurrency: options.concurrency || 16
  });
}

/**
 * Generator function the runs everything.
 * Returns the final build as a single string.
 *
 * @return {String}
 * @api private
 */

Builder.prototype.engine = function* () {
  // wait for the user to attach middleware
  yield setImmediate;

  // to avoid doing this all the time,
  // we allocate the fields array
  this.fields = Object.keys(this.fns);

  var branches = this.branches;
  for (var i = 0; i < branches.length; i++) {
    var branch = branches[i];
    // resolve the component
    // the only async function here is really
    // unglobbing
    var manifest = yield* this.resolve(branch);
    // dispatch all the files in parallel
    this.dispatch(manifest.files);
  }

  return yield* this.channel(true);
}

/**
 * Go through all the branches, resolve some stuff,
 * make file objects suitable for middleware.
 * This is the default resolver.
 *
 * @param {Object} branch
 * @return {Object} manifest
 * @api private
 */

Builder.prototype.resolve = function* (branch) {
  return yield* this.manifest(branch);
}

/**
 * Create a manifest object.
 *
 * @param {Object} branch
 * @return {Object} manifest
 * @api private
 */

Builder.prototype.manifest = function* (branch) {
  var manifest = {
    branch: branch,
    node: branch.node,
    path: branch.path
  };

  yield* this.unglob(manifest);
  this.createFiles(manifest);
  return manifest;
}

/**
 * Unglob a component's fields.
 * This should only be necessary for local components.
 * This is the only "asynchronous" step in `.resolve()`.
 *
 * @param {Object} manifest
 * @api private
 */

Builder.prototype.unglob = function* (manifest) {
  var node = manifest.node;
  var branch = manifest.branch;
  // dev stuff is only relevant to local components
  var dev = (this.dev
    && branch.type === 'local'
    && node.development)
    || {};

  var fields = {};
  this.fields.forEach(function (field) {
    var paths = [];
    if (node[field]) paths = paths.concat(node[field]);
    if (dev[field]) paths = paths.concat(dev[field]);
    fields[field] = unglob.directory(paths, branch.path);
  });
  // note: field{} does not have its keys in the correct order.
  // use this.fields[]
  manifest.field = yield fields;
}

/**
 * Create file objects to pass to plugins.
 * Also create manifest.files;
 *
 * @param {Object} manifest
 * @api private
 */

Builder.prototype.createFiles = function (manifest) {
  var fields = manifest.field;
  var files = [];

  this.fields.forEach(function (field) {
    var objs = fields[field] = fields[field].map(toFileObject, this);
    files = files.concat(objs);
  }, this);

  manifest.files = files;

  function toFileObject(path) {
    var file = {
      path: path, // path according to component.json
      manifest: manifest,
      branch: manifest.branch,
      node: manifest.node,
      filename: join(manifest.path, path),
      extension: extname(path),
    };

    file.read = utils.read(file);

    return file;
  }
}

/**
 * Push a function to the middleware based on `field`.
 * `fn` can either by a synchronous function,
 * an asynchronous function with callback,
 * or a generator function.
 *
 * synchronous and generator functions will be called with
 *
 *   fn.call(this, file)
 *
 * asynchronous will be called with
 *
 *   fn.call(this, file, function (err) {})
 *
 * @param {String} field
 * @param {Function} fn
 * @api public
 */

Builder.prototype.use = function (field, fn) {
  // handle multiple middleware at once like express
  if (arguments.length > 2) {
    [].slice.call(arguments, 1).forEach(function (fn) {
      this.use(field, fn);
    }, this);
    return this;
  }

  var stacks = this.fns;
  var stack = stacks[field] = stacks[field] || [];
  stack.push(fn);
  return this;
}

/**
 * Runs all of `field`'s middleware on a file.
 *
 * @param {String} field
 * @param {Object} file
 * @api private
 */

Builder.prototype.transform = function* (field, file) {
  var fns = this.fns[field];
  for (var i = 0; i < fns.length; i++) {
    var fn = fns[i];
    // generator function
    if (isGeneratorFunction(fn)) yield* fn.call(this, file);
    // async function
    else if (fn.length === 2) yield fn.bind(this, file);
    // sync function
    else fn.call(this, file);
  }
}

/**
 * Push all the files of `files` split by fields's transforms to the channel.
 *
 * @param {Object} manifest
 * @api private
 */

Builder.prototype.dispatch = function (manifest) {
  var ch = this.channel;
  var fields = this.fields;
  var append = co(this.append);
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var files = manifest.field[field];
    for (var j = 0; j < files.length; j++) {
      ch.push(append.bind(this, field, files[j]));
    }
  }
}

/**
 * Check if an object is a Generator Function.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isGeneratorFunction(obj) {
  return obj
    && obj.constructor
    && 'GeneratorFunction' === obj.constructor.name;
}