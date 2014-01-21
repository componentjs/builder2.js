## var builder = new Builder(nodes, [options])

Creates a new builder with `nodes`. `builder` is a `Readable Stream`.

`options`:

- `concurrency` <16> - this is how many files the builder will process at a time. In general, a limit at all is only necessary for `EMFILE` errors, but since this builder uses `graceful-fs`, setting `Infinity` should be fine for most build.
- `dev` - Include files in local components' development fields.
- `out` <'components'> - folder where all the components are saved.

### builder.toStr([callback])

Returns the entire build as a single string.

### builder.toFile(filename, [callback])

Save the build to a file. Will create the file even if nothing is included in the build.

## Plugins

### Using Plugins

Plugins are of the form:

```js
.use(field, plugin(options))

// example
.use('scripts', builder.plugins.js())
```

Thus, plugins are registered on a per-field, allowing the builder to know which `fields` to unglob. You __must__ register your plugins on the same tick you initiate your builder. The build process beings on the next tick.

Included plugins are stored in `require('component-builder2').plugins`. Please see the documentation on each builder for the included, relevant plugins.

### Creating Plugins

Plugins can be defined in one of the following three forms:

```js
// synchronous
function plugin(options) {
  return function plugin(file) {

  }
}

// asynchronous
function plugin(options) {
  return function plugin(file, callback) {

  }
}

// generator function (asynchronous)
function plugin(options) {
  return function* plugin(file) {

  }
}
```

When creating a plugin, you __should__ wrap the actual plugin with another function even if there are no options. This creates a consistent API among all plugins.

`file` has the following properties:

- `path` - the `path` of the file as defined in the component, ex. `index.js`.
- `filename` - the absolute `path` of where this file is located, ex. `/Users/jong/app/index.js`.
- `extension` - the `extension` of this file, example `.js`.
- `component` - the `component.json`
- `branch` - the resolved branch based on the resolver.
- `obj` - a resolved "builder" object - look at the source code for more details.

There is a convenience method called `file.read`. This allows you to read the current file as a `utf-8` string, which is saved as `file.string`. This would obviously only work with asynchronous plugins. For the `scripts` and `styles` builder, if `file.string` is never populated, the file will not be included in the build.

```js
// only includes `.js` files in the build
function plugin(file, done) {
  if (file.extension === 'js') return done();
  // automatically sets `file.string =`, so this is all you need to do.
  file.read(done);
}

// same as above
function* plugin(file) {
  if (file.extension !== 'js') return;
  yield file.read;
}

// read and autoprefix css
var autoprefixer = require('autoprefixer');

function plugin(file, done) {
  if (file.extension !== 'css') return done();
  file.read(function (err, string) {
    if (err) return done(err);
    file.string = autoprefixer.process(string).css;
    done();
  })
}

// same as above
function* plugin(file) {
  if (file.extension !== 'css') return;
  var string = yield file.read;
  file.string = autoprefixer.process(string).css;
}
```