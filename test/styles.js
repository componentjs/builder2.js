var Builder = require('..').styles
var plugins = require('..').plugins

var co = require('co')
var fs = require('fs')
var assert = require('assert')
var Resolver = require('component-resolver')
var Remotes = require('remotes')
var join = require('path').join

var options = {
  install: true,
  remote: new Remotes.GitHub
}

function fixture(name) {
  return join(__dirname, 'fixtures', name)
}

function read(name) {
  return fs.readFileSync(join(fixture(name), 'out.css'), 'utf8').trim()
}

function build(nodes, options) {
  return new Builder(nodes, options)
    .use('styles', plugins.urlRewriter(''))
}

function test(name) {
  describe(name, function () {
    var tree
    var nodes
    var css

    it('should install', co(function* () {
      var resolver = new Resolver(fixture(name), options)
      tree = yield* resolver.tree()
      nodes = resolver.flatten(tree)
    }))

    it('should build', co(function* () {
      var builder = build(nodes)
      css = yield builder.toStr()
    }))

    it('should be correct', function () {
      css.trim().should.equal(read(name))
    })
  })
}

test('css-simple')
test('css-local-ordering')
test('css-url-rewriting')
test('css-glob')

describe('font-awesome', function () {
  var tree
  var nodes
  var css

  it('should install', co(function* () {
    var resolver = new Resolver({
      dependencies: {
        "fortawesome/font-awesome": "4.0.3"
      }
    }, options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    css = yield builder.toStr()
  }))

  it('should be correct', co(function* () {
    css.should.include('url("fortawesome/font-awesome/v4.0.3/fonts/fontawesome-webfont.eot?v=4.0.3")')
  }))
})