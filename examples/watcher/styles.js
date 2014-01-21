var fs = require('fs');
var path = require('path');
var rework = require('rework');
var build = require('component-builder2');
var autoprefixer = require('autoprefixer');

var root = process.cwd();
var out = path.join(root, 'build', 'build.css');

var options = {
  concurrency: Infinity
};

var inprogress = false;
var queue = false;
var branches;

module.exports = function* styles(_branches) {
  branches = _branches || branches;

  if (inprogress) return queue = true;

  inprogress = true;

  var start = Date.now();
  console.log('\033[90m --> building styles...\033[0m');

  var builder = build.styles(branches, options)
    .use('styles', build.plugins.css());

  var css = yield builder.toStr();

  css = rework(css)
    .use(rework.ease())
    .use(rework.extend())
    .use(rework.inline(path.join(root, 'public')))
    .toString();

  css = autoprefixer.process(css).css;

  yield fs.writeFile.bind(null, out, css);

  inprogress = false;

  console.log('\033[90m <-- \033[96mstyles \033[90mbuilt in \033[33m%sms\033[0m', Date.now() - start);

  if (queue) {
    queue = false;
    yield* styles();
  }
}