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
 * Check if a file exists. Throws if it does not.
 * Mostly just for a nicer error message.
 *
 * @param {String} filename
 * @return {Object}
 * @api public
 */

exports.exists = function* (filename) {
  try {
    return yield fs.stat.bind(null, filename);
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('file "' + filename + '" does not exist.');
    throw err;
  }
}

/**
 * Unlink a file. Ignores errors incase it doesn't exist.
 *
 * @param {String} filename
 * @api public
 */

exports.unlink = function* (filename) {
  try {
    yield fs.unlink.bind(null, filename);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
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
 * @api public
 */

exports.name = function (branch) {
  if (branch.type === 'local') return branch.name;
  return branch.name + '@' + branch.ref;
}

/**
 * This is how the url rewriter will prefix remotes.
 * Instead of the local folder name of `-`,
 * this will create names like github's with `/`s.
 * i.e. fortawesome/fontawesome/v4.0.3/fonts/font.woff
 *
 * @param {Object} branch
 * @return {String}
 * @api public
 */

exports.repo = function (branch) {
  if (branch.type === 'local') return branch.name;
  return branch.name + '/' + branch.ref;
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
 * @api public
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
 * @api public
 */

exports.isData = function (url) {
  return 0 == url.indexOf('data:');
}

/**
 * Check if a URL is an absolute url.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isAbsolute = function (url) {
  return ~url.indexOf('://')
    || '/' == url[0];
}