var Builder = require('..').scripts
var plugins = require('..').plugins

var vm = require('vm')
var co = require('co')
var assert = require('assert')
var Resolver = require('component-resolver')
var Remotes = require('remotes')
var join = require('path').join

var options = {
  install: true,
  remote: new Remotes.GitHub,
}

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

function build(nodes, options) {
  return new Builder(nodes, options)
    .use('scripts', plugins.js())
    .use('json', plugins.json())
    .use('templates', plugins.string())
}

describe('js-scripts', function () {
  var tree
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-scripts'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
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

describe('js-scripts -dev', function () {
  var tree
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-scripts'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes, {
      dev: true
    })
    js = yield builder.toStr()
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
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-main'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
  }))

  it('should rewrite requires', function  () {
    js.should.not.include("require('./one')")
    js.should.not.include("require('./one.js')")
    js.should.not.include("require('./two')")
    js.should.not.include("require('./two.js')")

    js.should.not.include('lib/one')
    js.should.not.include('lib/two')
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
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-json'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
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
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-templates'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
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
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-extension'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = Builder(nodes)
    .use('coffee', function* (file) {
      // no transform - just assume it's valid js
      if (file.extension !== 'coffee') return
      file.string = true
    })
    js = yield builder.toStr()
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
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-glob'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-glob") !== "glob") throw new Error()', ctx)
  })
})

describe('js-infer-main', function () {
  var tree
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-infer-main'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
  }))

  it('should execute', function () {
    var ctx = vm.createContext()
    vm.runInContext(js, ctx)
    vm.runInContext('if (require("js-infer-main").trim() !== "<p>hi</p>") throw new Error()', ctx)
  })
})

describe('js-debug', function () {
  var tree
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('js-debug'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    js = yield builder.toStr()
  }))
})