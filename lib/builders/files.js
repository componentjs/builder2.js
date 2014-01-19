var co = require('co');

var Builder = require('./builder');

module.exports = Files;

// Files inherits the Builder's prototype methods,
// but it only uses a subset of them.
Builder.extend(Files);

function Files(branches, options) {
  if (!(this instanceof Files)) return new Files(branches, options);

  options = options || {};
  this.initialize(branches, options);
  // channel does not return anything
  this.channel.discard = true;
  this.engine();
}

/**
 * Type: external control flow.
 *
 * Callback for when this builder is done.
 *
 * @api public
 */

Files.prototype.end = function (done) {
  var self = this
  this.on('error', cb)
  this.on('end', cb)

  return function (fn) {
    done = fn
  }

  function cb(err) {
    cleanup()
    done(err)
  }

  function cleanup() {
    self.removeListener('error', cb)
    self.removeListener('end', cb)
  }
}

/**
 * Type: internal control flow.
 *
 * Unlike the other builders, we want to emit `end`.
 *
 * @api private
 */

Files.prototype.reader = co(function* () {
  var ch = this.channel;
  while (ch.readable) this.push(yield* ch.read());
  this.emit('end');
})

/**
 * There is no special append function here!
 *
 * @param {Object} field
 * @param {Object} file
 * @api private
 */

Files.prototype.append = Files.prototype.transform;