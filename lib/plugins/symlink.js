var dirname = require('path').dirname;
var join = require('path').join;
var mkdirp = require('mkdirp');
var fs = require('graceful-fs');

var utils = require('../utils');

module.exports = function () {
  return function* symlink(file) {
    yield* utils.exists(file.filename);
    var out = join(this.dest, utils.repo(file.branch), file.path);
    yield mkdirp.bind(null, dirname(out));
    yield* utils.unlink(out);
    yield fs.symlink.bind(null, file.filename, out);
  }
}