var fs = require('fs');
var path = require('path');
var build = require('component-builder2');
var minify = require('builder-html-minifier');

var out = path.join(process.cwd(), '..', 'build', 'build.js');

var options = {
  concurrency: Infinity
};

var minifyoptions = {
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true
};

var inprogress = false;
var queue = false;
var branches;

module.exports = function* scripts(_branches) {
  branches = _branches || branches;

  if (inprogress) return queue = true;

  inprogress = true;

  var start = Date.now();
  console.log('\033[90m --> building scripts...\033[0m');

  var builder = build.scripts(branches, options)
    .use('scripts',
      build.plugins.js())
    .use('json',
      build.plugins.json())
    .use('templates',
      minify(minifyoptions),
      build.plugins.string());

  var writer = fs.createWriteStream(out);
  var done;

  builder
  .on('error', finish)
  .on('end', function () {
    // "autorequires" the build
    writer.write('require("boot");');
    writer.end();
  })
  .pipe(writer, {
    end: false
  })
  .on('error', finish)
  .on('finish', finish);

  yield function (fn) {
    done = fn;
  }

  inprogress = false;

  console.log('\033[90m <-- \033[96mscripts \033[90mbuilt in \033[33m%sms\033[0m', Date.now() - start);

  if (queue) {
    queue = false;
    yield* scripts();
  }

  function finish(err) {
    if (err) {
      // destroys the build on error
      // instead of writing a half-assed build
      writer.destroy();
      fs.unlinkSync(out);
    }

    builder.removeListener('error', finish);
    writer.removeListener('error', finish);
    writer.removeListener('finish', finish);

    done(err);
  }
}