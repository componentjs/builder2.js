var resolver = require('component-resolver');
var builder = require('component-builder');
var fs = require('co-fs');

/**
 * @param {Object} `opts`:
 * * @param {String} `out` output directory
 * * @param {Object} `resolver` resolver options
 */

module.exports = function (opts) {
  var style, script = builder.scripts.require;

  return function* builder(next) {
    if (!/build\.(js|css)/.test(this.url)) return;

    // resolve components
    var tree = yield resolver(process.cwd(), opts.resolver);

    // compile with plugins
    style = yield styles(tree);
    script += yield scripts(tree);

    // write to disk
    yield fs.writeFile(opts.out, style);
    yield fs.writeFile(opts.out, script);
    yield next;
  };
};

function styles (nodes) {
  return builder.styles(nodes)
    .use('styles', builder.plugins.css())
    .end();
}

function scripts (nodes) {
  return builder.scripts(nodes)
    .use('scripts', builder.plugins.js())
    .use('scripts', builder.plugins.json())
    .end();
}