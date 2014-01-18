var fs = require('graceful-fs')

/**
 * Populate `file.string` asynchronously by doing `yield file.read`.
 *
 * @param {Object} file
 * @api public
 */

exports.read = function read(file) {
  return function (done) {
    if (typeof file.string === 'string') return done(null, file.string)
    fs.readFile(file.filename, 'utf8', function (err, str) {
      if (err)
        return done(new Error('failed to read "'
          + file.obj.name
          + '"\'s file "'
          + file.path
          + '"'))

      done(null, file.string = str)
    })
  }
}