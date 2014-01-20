exports.scripts = require('./builders/scripts')
exports.styles = require('./builders/styles')
exports.files = require('./builders/files')
exports.builder = require('./builders/builder')

exports.plugins = {
  js: require('./plugins/js'),
  css: require('./plugins/css'),
  json: require('./plugins/json'),
  string: require('./plugins/string'),
  copy: require('./plugins/copy'),
  symlink: require('./plugins/symlink')
}

exports.commonjs = {
  require: require('./commonjs/require')
}