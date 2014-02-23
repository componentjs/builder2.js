# component-builder2 [![Build Status](https://travis-ci.org/component/builder2.js.png)](https://travis-ci.org/component/builder2.js)

Another version of component's builder. Some differences:

- Everything is streaming!
- Split into multiple builders
- Much leaner `require` implementation
- Handles newer features like globs
- Fixes a lot of issues with the previous builder

Depends on:

- [component-resolver](https://github.com/component/resolver.js) - resolved dependency tree
- [component-flatten](https://github.com/jonathanong/flatten.js) - flatten the dependency tree to create a build order

You may be interested in:

- [component-bundler](https://github.com/component/bundler.js) - create multiple bundles from the resolved dependency tree
- [component-process](https://github.com/jonathanong/component-process.js) - a faster component(1) as a running process

## Example

```js
var build = require('component-builder2');
var resolve = require('component-resolver');
var flatten = require('component-flatten');

// resolve the dependency tree
resolve(process.cwd(), {
  // install the remote components locally
  install: true
}, function (err, tree) {
  if (err) throw err;
  // lists the components in the proper build order
  var nodes = flatten(tree);

  // only include `.js` files from components' `.scripts` field
  build.scripts(nodes)
    .use('scripts', build.plugins.js())
    .toFile('build.js');

  // only include `.css` files from components' `.styles` field
  build.styles(nodes)
    .use('styles', build.plugins.css())
    .toFile('build.css');
})
```

## Builders

There are three types of builders:

- [`scripts`](https://github.com/component/builder2.js/blob/master/docs/scripts.md) - streaming builder for the `Javascript` file.
- [`styles`](https://github.com/component/builder2.js/blob/master/docs/styles.md) - streaming builder for the `CSS` file.
- [`files`](https://github.com/component/builder2.js/blob/master/docs/files.md) - channel-based builder for everything else, which generally means copying or symlinking

You'll also want to read docs on [`builder`](https://github.com/component/builder2.js/blob/master/docs/builders.md), which all three builders above inherit from (files only kind of).

See the documentation for more information on each.

## Examples

- [simple-builder2-demo](http://github.com/mnmly/simple-builder2-demo): Simple demo that shows how to use plugins and build as bundles.

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
