var resolve = require('url').resolve;

var utils = require('../utils');

module.exports = function* (file) {
  if (file.extension !== 'css') return;
  yield file.read;

  var prefix = this.urlPrefix;
  var branch = file.branch;

  // rewrite URLs
  file.string = file.string.replace(/\burl *\(([^)]+)\)/g, function rewrite(_, uri) {
    var orig = 'url(' + uri + ')';
    uri = utils.stripQuotes(uri);
    if (utils.isData(uri)) return orig;
    if (utils.isAbsolute(uri)) return orig;
    uri = resolve(prefix + utils.name(branch) + '/', uri);
    return 'url("' + uri + '")';
  });
}