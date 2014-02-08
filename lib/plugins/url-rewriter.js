var resolve = require('url').resolve;

var utils = require('../utils');

module.exports = function (prefix) {
  return function rewriteUrl(file, done) {
    if (file.extension !== 'css') return done();

    file.read(function (err, string) {
      if (err) return done(err);
      prefix = prefix || '';
      var branch = file.branch;

      // rewrite URLs
      file.string = string.replace(/\burl *\(([^)]+)\)/g, function rewrite(_, uri) {
        var orig = 'url(' + uri + ')';
        uri = utils.stripQuotes(uri);
        if (utils.isData(uri)) return orig;
        if (utils.isAbsolute(uri)) return orig;
        uri = resolve(file.path, uri);
        uri = resolve(prefix + utils.repo(branch) + '/', uri);
        return 'url("' + uri + '")';
      });

      done();
    })
  }
}