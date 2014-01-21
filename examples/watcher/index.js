var gaze = require('gaze');
var co = require('co');

exports.resolve = require('./resolve');
exports.scripts = require('./scripts');
exports.styles = require('./styles');

var resolve = co(exports.resolve);
var scripts = co(exports.scripts);
var styles = co(exports.styles);

resolve(onerror);

// supply `--kill` in your arguments to automatically kill the process
// i.e. if you just want to build once instead of continuously build
if (~process.argv.indexOf('--kill')) return;

// here, we assume all your components is in `client/`

// execute resolver
gaze([
  'client/**/component.json',
  'components/**/*',
])
.on('error', onerror)
.on('all', function () {
  resolve(onerror);
});

// execute scripts builder
gaze([
  'client/**/*.js',
  'client/**/*.json',
  'client/**/*.html',
])
.on('error', onerror)
.on('all', function () {
  scripts(onerror);
});

// execute styles builder
gaze('client/**/*.css')
.on('error', onerror)
.on('all', function () {
  styles(onerror);
});

function onerror(err) {
  if (err) console.error(err.stack);
}