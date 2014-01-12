## var builder = new Builder(nodes, [options])

Creates a new builder with `nodes`. `builder` is a `Readable Stream`.

`options`:

- `concurrency` <16>
- `dev` -
- `out` <'components'> - folder where all the components are saved.

### builder.toStr(callback)

Returns the entire build as a single string.

### builder.toFile(filename, callback)

Save the build to a file. Will create the file even if nothing is included in the build.

### builder.toBuffer(callback)

Return the entire build as a single `Buffer` instance.

### builder.toArray(callback)

You don't really need this.