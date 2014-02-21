## var scripts = build.scripts(nodes, [options])

`options` (in addition to [builder](./builders.md) options):

- `require` <true> - include the `require` implementation in the build. Set this to `false` for separate builds.

## Plugins

The script builder's `file` objects have the following additional properties:

- `resolvePath` - `.path` relative to the component's `.main`.
- `name` - the name of this file will be registered as in the `require` build.

Note: `file.string` must be populated for a file to be included in the build.

### js()

Includes a file as regular Javascript.

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
