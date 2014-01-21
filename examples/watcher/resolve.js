var path = require('path');
var mkdirp = require('mkdirp');
var Resolver = require('component-resolver');

var scripts = require('./scripts');
var styles = require('./styles');

var root = process.cwd();
mkdirp.sync(path.join(root, 'build'));

var inprogress = false;
var queue = false;

module.exports = function* resolve() {
  if (inprogress) return queue = true;

  inprogress = false;

  var start = Date.now();
  console.log('\033[90m --> resolving...\033[0m');

  var resolver = new Resolver(root, {
    install: true,
  });

  var tree = yield* resolver.tree();
  console.log('\033[90m <-- \033[96mresolved\033[0m \033[90min \033[33m%sms\033[0m', Date.now() - start);

  var branches = resolver.flatten(tree);

  yield [
    scripts(branches),
    styles(branches),
  ];

  inprogress = false;

  if (queue) {
    queue = false;
    yield* resolve();
  }
}