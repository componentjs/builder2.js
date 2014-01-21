## var builder = new builder.scripts(nodes, [options])

`options` (in addition to [builder](./builder.md) options):

- `urlPrefx` <''> - prefix urls, ex. `//component.io/` will create urls like `url("//component.io/fortawesome/font-awesome/v4.0.3/css/font-awesome.css")`

## Plugins

### css()

This just appends the CSS file as a string.

```js
builder.styles()
.use('styles', builder.plugins.css())
```

### Other

- [autoprefixer](https://github.com/component/builder-autoprefixer) - Autoprefixes the CSS files
