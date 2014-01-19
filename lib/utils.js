var fs = require('graceful-fs')

/**
 * Populate `file.string` asynchronously by doing `yield file.read`.
 * If you want to use a caching mechanism here or something
 * for reloads, you can overwrite this method.
 *
 * @param {Object} file
 * @api public
 */

exports.read = function (file) {
  return function (done) {
    // already read
    if (typeof file.string === 'string') return done(null, file.string);
    fs.readFile(file.filename, 'utf8', function (err, str) {
      if (err) {
        return done(new Error('failed to read "'
          + file.obj.name
          + '"\'s file "'
          + file.path
          + '"'));
      }

      done(null, file.string = str);
    })
  }
}

/**
 * For [].reduce(concat, []).
 *
 * @param {Array}
 * @param {Array}
 * @return {Array}
 * @api public
 */

exports.concat = function (a, b) {
  return a.concat(b);
}

/**
 * The name of the folder stored in the /components directory.
 * i.e. component-emitter-1.0.0
 *
 * @param {Object} branch
 * @return {String}
 * @api public
 */

exports.folder = function (branch) {
  return branch.name.split('/').join('-') + '-' + branch.ref;
}

/**
 * The `require` name of the module.
 * Locals are known just by their name.
 * Remotes are known by <user>/<repo>@<reference>.
 * Since locals are expected to be unique,
 * this won't handle conflicts.
 *
 * @param {Object} branch
 * @return {String}
 * @api private
 */

exports.name = function (branch) {
  if (branch.type === 'local') return branch.name;
  return branch.name + '@' + branch.ref;
}

/**
 * Strip leading `./` from filenames.
 *
 * @param {String} filename
 * @return {String}
 * @api public
 */

exports.stripLeading = function (x) {
  if (x.slice(0, 2) === './') return x.slice(2);
  return x;
}

/**
 * Strip surrounding quotes from a string.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.stripQuotes = function(str) {
  if ('"' == str[0] || "'" == str[0]) return str.slice(1, -1);
  return str;
};

/**
 * Check if a URL is a data url.
 *
 * @param {String} url
 * @return {Boolean}
 * @api private
 */

exports.isData = function (url) {
  return 0 == url.indexOf('data:');
}

/**
 * Check if a URL is an absolute url.
 *
 * @param {String} url
 * @return {Boolean}
 * @api private
 */

exports.isAbsolute = function (url) {
  return ~url.indexOf('://')
    || '/' == url[0];
}