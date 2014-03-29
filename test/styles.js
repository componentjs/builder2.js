var Builder = require('..').styles
var plugins = require('..').plugins

var co = require('co')
var fs = require('fs')
var assert = require('assert')
var resolve = require('component-resolver')
var join = require('path').join
var rimraf = require('rimraf');

var options = {
  install: true
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
      tree = yield* resolve(fixture(name), options)
      nodes = resolve.flatten(tree)
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

  before(function (done) {
    rimraf('components', done);
  })

  it('should install', co(function* () {
    tree = yield* resolve({
      dependencies: {
        "fortawesome/font-awesome": "4.0.3"
      }
    }, options)
    nodes = resolve.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    css = yield builder.toStr()
  }))

  it('should be correct', co(function* () {
    css.should.include('url(\'fortawesome/font-awesome/v4.0.3/fonts/fontawesome-webfont.eot?v=4.0.3\')')
  }))
})