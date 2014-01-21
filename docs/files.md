## var builder = new builder.files(nodes, [options])

This is the simplest builder. It isn't a stream unlike `scripts` or `styles` - this just iterates through all the files you choose and allows you to do whatever you wish with them.

## Plugins

### copy()

Copies each file to the destination with the directory `<user>/<repo>/<version>`. You probably want to use this when creating a production build.

```js
builder.files()
.use('images', builder.plugins.copy())
```

### symlink()

Very similar to `copy()`, but symlinks (or "creates shortcuts") instead. This is faster during development.

```js
builder.files()
.use('images', builder.plugins.symlink())
```