exports.scripts = require('./builders/scripts')
exports.styles = require('./builders/styles')
exports.builder = require('./builders/builder')

exports.plugins = {
  js: require('./plugins/js'),
  css: require('./plugins/css'),
  json: require('./plugins/json'),
  string: require('./plugins/string')
}

exports.commonjs = {
  require: require('./commonjs/require')
}