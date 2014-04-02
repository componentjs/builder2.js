## var builder = build(nodes, [options])

Creates a new builder with `nodes`. `nodes` can either be a `tree` returned from `component-resolver`, or a tree flattened by `component-flatten`.

`options`:

- `concurrency` <16> - this is how many files the builder will process at a time. In general, a limit at all is only necessary for `EMFILE` errors, but since this builder uses `graceful-fs`, setting `Infinity` should be fine for most build.
- `development` - Include files in local components' development fields.
- `out` <'components'> - folder where all the components are saved.
- `root` <process.cwd()> - root folder

### builder.end([callback])

Returns the entire build as a single string (if applicable).
Nothing is executed until you execute `.end()`.
Aliased as `.build()`.

## Plugins

### Using Plugins

Plugins are of the form:

```js
.use(field, plugin(options), plugin(options))

// example
.use('scripts', build.plugins.js())
```

Thus, plugins are registered on a per-field, allowing the builder to know which `fields` to unglob.

Included plugins are stored in `require('component-builder').plugins`. Please see the documentation on each builder for the included, relevant plugins.

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
  return function plugin(file, done) {

  }
}
```

When creating a plugin, you __should__ wrap the actual plugin with another function even if there are no options. This creates a consistent API among all plugins.

`file` is created using [manifest](https://github.com/component/manifest.js) and has the following properties:

- `path` - the `path` of the file as defined in the component, ex. `index.js`.
- `filename` - the absolute `path` of where this file is located, ex. `/Users/jong/app/index.js`.
- `extension` - the `extension` of this file, example `js`. This tells plugins how to treat each file.
- `node` - the `component.json`
- `branch` - the resolved branch based on the resolver.
- `manifest` - a resolved "builder" object - look at the source code for more details.

There is a convenience method called `file.read`. This allows you to read the current file as a `utf-8` string, which is saved as `file.string`. This would obviously only work with asynchronous plugins. For the `scripts` and `styles` builder, if `file.string` is never populated, the file will not be included in the build.

```js
// only includes `.js` files in the build
function plugin(file) {
  if (file.extension === 'js') return;
  // `file.string = true` is a shortcut to include the string
  file.string = true;
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
```
