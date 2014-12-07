var Builder = require('..').scripts
var plugins = require('..').plugins

var vm = require('vm')
var co = require('co')
var assert = require('assert')
var resolve = require('component-resolver')
var join = require('path').join

var options = {
  install: true
}

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

function build(tree, options) {
  return new Builder(tree, options)
    .use('scripts',
      require('builder-es6-module-to-cjs')(),
      plugins.js())
    .use('json',
      plugins.json())
    .use('templates',
      plugins.string())
}

describe('js-scripts', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-scripts'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('emitter')")
    js.should.not.include("require('component-emitter')")
    js.should.not.include("require('component/emitter')")
    js.should.not.include("require('./something')")

    js.should.include("component~emitter@")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-scripts")', ctx)
    vm.runInContext('if (!this.one) throw new Error()', ctx)
    vm.runInContext('if (!this.two) throw new Error()', ctx)
  })
})

describe('js-nested-locals', function() {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-nested-locals'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite the component require correctly', function() {
    js.should.not.include("require('nested/boot')")
    js.should.not.include("require('./lib/nested/boot/boot')")

    js.should.include("require('./lib/nested/boot')")
  })

  it('should rewrite requires inside of components correctly', function  () {
    js.should.not.include("require('nested/boot/smth.js')")

    js.should.include("require('./lib/nested/boot/smth.js')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-nested-locals")', ctx)
    ctx.boot.main.should.be.ok
    ctx.insideBoot.inside.should.be.ok
  })
})

describe('js-matching-prefixes', function() {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-matching-prefixes'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))


  it('should rewrite the component require correctly', function() {
    js.should.not.include("require('test')")
    js.should.not.include("require('test_again')")

    js.should.include("require('./lib1/test')")
    js.should.include("require('./lib2/test_again')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('this.test = require("js-matching-prefixes")', ctx)
    ctx.test.test_name.should.equal('test')
    ctx.test.test_again_name.should.equal('test_again')
  })
})

describe('js-scripts -dev', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-scripts'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree, {
      dev: true
    }).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('emitter')")
    js.should.not.include("require('component-emitter')")
    js.should.not.include("require('component/emitter')")
    js.should.not.include("require('./something')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-scripts")', ctx)
    vm.runInContext('if (!this.one) throw new Error()', ctx)
    vm.runInContext('if (!this.two) throw new Error()', ctx)
  })
})

describe('js-main', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-main'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('./one')")
    js.should.not.include("require('./one.js')")
    js.should.not.include("require('./two')")
    js.should.not.include("require('./two.js')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-main")', ctx)
    vm.runInContext('if (!this.one) throw new Error()', ctx)
    vm.runInContext('if (!this.two) throw new Error()', ctx)
  })
})

describe('js-json', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-json'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('var json = require("js-json")', ctx)
    vm.runInContext('if (json.message !== "hello") throw new Error()', ctx)
  })
})

describe('js-templates', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-templates'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('var string = require("js-templates")', ctx)
    vm.runInContext('if (string !== "<div>\\n  <p>hi</p>\\n</div>") throw new Error()', ctx)
  })
})

describe('js-extension', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-extension'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree)
      .use('coffee', function* (file) {
        // no transform - just assume it's valid js
        if (file.extension !== 'coffee') return
        file.string = true
      })
      .end()
  }))

  it('should rewrite requires', function  () {
    js.should.include('require("js-extension/something.coffee")')
    js.should.include('require.register("js-extension"')
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-extension") !== "something") throw new Error()', ctx)
  })
})

describe('js-glob', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-glob'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-glob") !== "glob") throw new Error()', ctx)
  })
})

describe('js-infer-main', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-infer-main'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-infer-main").trim() !== "<p>hi</p>") throw new Error()', ctx)
  })
})

describe('js-debug', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-debug'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))
})

describe('js-relative-up', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-relative-up'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('../')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-relative-up") !== 1) throw new Error()', ctx)
  })
})

describe('js-relative-camelcase', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-relative-camelcase'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('../')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-relative-camelcase") !== 1) throw new Error()', ctx)
  })
})

describe('js-multiple-names', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-multiple-names'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end()
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-multiple-names") !== 3) throw new Error()', ctx)
  })
})

describe('js-require-uppercase', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-require-uppercase'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end()
  }))

  it('should have resolved the require()', function () {
    js.should.include('var emitter = require("component~emitter@1.0.0"')
    js.should.include('var emitter_ = require("component~emitter@1.0.0"')
  })
})

describe('js-alias', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-alias'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree, {
      alias: true
    }).end();
  }))

  it('should execute aliases', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext("require('boot')", ctx);
    vm.runInContext("require('emitter')", ctx);
    vm.runInContext("require('component-emitter')", ctx);
    vm.runInContext("require('component~emitter')", ctx);
  })
})

describe('js-mocha', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-mocha'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-mocha")', ctx);
  })

  it('should not have require("undefined")', function () {
    js.should.not.include('require("undefined")');
  })
})

describe('js-chai', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-chai'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-chai")', ctx);
  })

  it('should not have require("undefined")', function () {
    js.should.not.include('require("undefined")');
  })
})

describe('js-502', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-502'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-502")', ctx);
  })
})

describe('js-page.js', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-page.js'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-page.js")', ctx);
  })
})

describe('js-require-single-quotes', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-require-single-quotes'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.include("require(\'js-require-single-quotes/something.js\')")
    js.should.not.include('require("js-require-single-quotes/something.js")')
  })
})

describe('js-locals', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-locals'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires for files inside locals', function  () {
    js.should.not.include("require('subcomponent-1')");
    js.should.not.include('require("subcomponent-1")');
    js.should.not.include("require('subcomponent-1/hello')");
    js.should.not.include('require("subcomponent-1/hello")');

    js.should.include("require('./subcomponents/subcomponent-1')");
    js.should.include("require('./subcomponents/subcomponent-1/hello.js')");
  })

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-locals")', ctx)
    ctx.one.should.equal('world');
  })
})

describe('js-asset-path', function () {
  var tree;
  var js = Builder.require;

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-asset-path'), options);
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should execute', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    vm.runInContext('require("js-asset-path")', ctx);
  })

  it('should rewrite asset path comments', function () {
    js.should.not.include('/* component:file */ "test.txt"');
    js.should.include('"js-asset-path/test.txt"');
  });

  it("should be able to handle relative paths", function () {
    js.should.not.include('/* component:file */ "../assets/foo.txt"');
    js.should.include('"js-asset-path/assets/foo.txt"');
  });
})

describe('js-relative-extension', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-relative-extension'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('./foo')")
    js.should.not.include("require('./foo/bar')")
    js.should.not.include("require('./foo/bar/baz')")
    js.should.not.include("require('./foo/bar/qux')")
    js.should.include("require('js-relative-extension/foo.js')")
    js.should.include("require('js-relative-extension/bar/index.js')")
    js.should.include("require('js-relative-extension/bar/baz.js')")
    js.should.include("require('js-relative-extension/bar/qux/index.js')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-relative-extension")', ctx)
    ctx.foo.should.equal('foo');
    ctx.bar.should.equal('bar');
    ctx.baz.should.equal('baz');
    ctx.qux.should.equal('qux');
  })
})

describe('js-relative-extension-locals', function () {
  var tree
  var js = Builder.require

  it('should install', co(function* () {
    tree = yield* resolve(fixture('js-relative-extension-locals'), options)
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('./foo/bar/index.js')")
    js.should.include("require('./foo/bar')")
    js.should.include("require('./foo/bar/baz/index.js')")
    js.should.not.include("require('./foo/bar/baz')")
    js.should.include("require('./foo/bar/baz/qux.js')")
    js.should.not.include("require('./foo/bar/baz/qux')")
    js.should.not.include("require('js-relative-extension-locals")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-relative-extension-locals")', ctx)
    ctx.bar.should.equal('bar');
    ctx.baz.should.equal('baz');
    ctx.qux.should.equal('qux');
  })
})

describe('js-relative-extension-deps', function () {
  var tree
  var js = Builder.require
  var dir = fixture('js-relative-extension-deps');

  it('should install', co(function* () {
    tree = yield* resolve(dir, { install: true, out: join(dir, 'foo') })
  }))

  it('should build', co(function* () {
    js += yield build(tree).end();
  }))

  it('should rewrite requires', function  () {
    js.should.include('require.register("bar~baz@1.2.3"')
    js.should.include('require.register("bar~baz@1.2.3/qux/index.js"')
    js.should.not.include('require.register("bar~baz@1.2.3/qux"')
    js.should.include('require.register("bar~baz@1.2.3/qux/quux.js"')
    js.should.not.include('require.register("bar~baz@1.2.3/qux/quux"')
    js.should.include("require('bar~baz@1.2.3')")
    js.should.include("require('bar~baz@1.2.3/qux/index.js')")
    js.should.include("require('bar~baz@1.2.3/qux/quux.js')")
    js.should.not.include("require('bar~baz@1.2.3/qux')")
    js.should.not.include("require('bar~baz@1.2.3/qux/quux')")
  })

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('require("js-relative-extension-deps")', ctx)
    ctx.baz.should.equal('baz');
    ctx.qux.should.equal('qux');
    ctx.quux.should.equal('quux');
  })
})
