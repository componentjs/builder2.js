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
