## var scripts = build.scripts(nodes, [options])

`options` (in addition to [builder](./builders.md) options):

- `require` <true> - include the `require` implementation in the build. Set this to `false` for separate builds.
- `sourceMap` <false> - enable source maps. Disabled by default. Not really working yet!
- `sourceURL` <false> - enable source URLs. Defaults to `development`.
- `alias` <false> - alias components with their shortnames. Allows you to `require()` components outside the build without worrying about versions. Defaults to `development`.

## Plugins

The script builder's `file` objects have the following additional properties:

- `resolvePath` - `.path` relative to the component's `.main`.
- `name` - the name of this file will be registered as in the `require` build.

Note: `file.string` must be populated for a file to be included in the build.

### es6modules()

Transpiles ES6 modules to CJS. This uses [builder-es6-module-to-cjs](https://github.com/component/builder-es6-module-to-cjs).

```js
build.scripts()
  .use('scripts', builder.plugins.es6modules());
```

### js()

Includes a file as regular Javascript.
Checks syntax errors as well.

```js
build.scripts()
  .use('scripts', builder.plugins.js());
```

### json()

Includes a file as JSON. Will throw on invalid JSON.

```js
build.scripts()
  .use('json', builder.plugins.json());
```

### string()

Includes a file as a string.

```js
build.scripts()
  .use('templates', builder.plugins.string());
```

### Other

- [html-minifier](https://github.com/component/builder-html-minifier) - minifies your HTML templates
- [jade](https://github.com/component/builder-jade)
- [regenerator](https://github.com/component/builder-regenerator) - compiles generators to ES5
- [coffee](https://github.com/component/builder-coffee)
