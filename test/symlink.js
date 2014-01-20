var Builder = require('..').files
var plugins = require('..').plugins

var fs = require('fs')
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
    .use('files', plugins.symlink())
}

describe('symlink', function () {
  var tree
  var nodes
  var js

  it('should install', co(function* () {
    var resolver = new Resolver(fixture('files'), options)
    tree = yield* resolver.tree()
    nodes = resolver.flatten(tree)
  }))

  it('should build', co(function* () {
    var builder = build(nodes)
    yield builder.end()
  }))

  it('should have symlinked files', co(function* () {
    var dest = join(process.cwd(), 'build', 'files')
    yield fs.stat.bind(null, join(dest, 'one.txt'))
    yield fs.stat.bind(null, join(dest, 'lib', 'two.txt'))
    var stat1 = yield fs.lstat.bind(null, join(dest, 'one.txt'))
    var stat2 = yield fs.lstat.bind(null, join(dest, 'lib', 'two.txt'))
    stat1.isSymbolicLink().should.be.true
    stat2.isSymbolicLink().should.be.true
  }))
})