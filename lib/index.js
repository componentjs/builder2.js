exports.scripts = require('./builders/scripts')
exports.styles = require('./builders/styles')
exports.files = require('./builders/files')
exports.builder = require('./builders/builder')

exports.plugin =
exports.plugins = {
  js: require('./plugins/js'),
  css: require('./plugins/css'),
  json: require('./plugins/json'),
  string: require('./plugins/string'),
  copy: require('./plugins/copy'),
  symlink: require('./plugins/symlink'),
  urlRewriter: require('./plugins/url-rewriter')
}