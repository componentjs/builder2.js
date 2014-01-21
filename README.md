# component-builder2 [![Build Status](https://travis-ci.org/component/builder2.js.png)](https://travis-ci.org/component/builder2.js)

Another version of component's builder. Some differences:

- Everything is streaming!
- Split into multiple builders
- Much leaner `require` implementation
- Fixes a lot of issues with the previous builder

## Example
```js
var Builder = require('component-builder2'),
    Resolver = require('component-resolver'),
    Remotes = require('remotes'),
    co = require('co'),
    remotes = new Remotes();

co(function* build() {
    var resolver = new Resolver(process.cwd(), {
        remote: new Remotes.Github,
        install: true
    });

    var tree = yield* resolver.tree();
    var nodes = resolver.flatten(tree);

    var script = new Builder.scripts(nodes);
    script.use('scripts', Builder.plugins.string());

    var style = new Builder.styles(nodes);
    style.use('styles', Builder.plugins.css());

    yield [
        script.toFile('build.js'),
        style.toFile('build.css')
    ];
})();
```

## API

### builder[type]

There are three types of builders:

- `scripts`
- `styles`
- `copy`

See the documentation for more information on each.

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
