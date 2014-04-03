## var files = build.files(nodes, [options])

This is the simplest builder. This just iterates through all the files you choose and allows you to do whatever you wish with them. `.end()`'s callback doesn't return anything.

Known limitiations:

- This builder does __not__ handle symlinks. 

## Plugins

Note that these two following plugins are unnecessary in development if you serve from both "components/" and ".". These plugins simply rewrite files to `build/` based on your apps directories.

For example, doing the following in development would make the file builder unnecessary:

```js
var app = require('express')();
var static = require('serve-static');

// serve your dependencies
app.use(static(__dirname + '/components'));

// serve your entire app
app.use(static(__dirname));
```

### copy()

Copies each file to the destination with the directory `<user>/<repo>/<version>`. You probably want to use this when creating a production build.

```js
build.files()
  .use('images', builder.plugins.copy())
```

### symlink()

Very similar to `copy()`, but symlinks (or "creates shortcuts") instead. This is faster during development. Note that this will only work on UNIX-like systems.

```js
build.files()
  .use('images', builder.plugins.symlink())
```
