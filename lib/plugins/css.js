var resolve = require('url').resolve

module.exports = function* (file) {
  if (file.string) return
  if (file.extension !== 'css') return
  yield file.read

  var prefix = this.urlPrefix
  var branch = file.obj.branch

  // rewrite URLs
  file.string = file.string.replace(/\burl *\(([^)]+)\)/g, function rewrite(_, uri) {
    var orig = 'url(' + uri + ')';
    uri = stripQuotes(uri);
    if (isData(uri)) return orig;
    if (isAbsolute(uri)) return orig;
    return 'url("' + resolve(prefix + folder(branch), uri) + '")'
  })
}

function isData(url) {
  return 0 === url.indexOf('data:');
}

function stripQuotes(str) {
  if ('"' === str[0] || "'" === str[0]) return str.slice(1, -1);
  return str;
}

function isAbsolute(url) {
  return ~url.indexOf('://') || url[0] === '/';
}

function folder(branch) {
  if (branch.type === 'local') return branch.name + '/'
  return branch.name + '/' + branch.ref + '/'
}