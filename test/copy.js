var Builder = require('..').files
var plugins = require('..').plugins

var fs = require('fs')
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

function build(nodes, options) {
  return new Builder(nodes, options)
    .use('files', plugins.copy())
}

describe('copy', function () {
  var tree

  it('should install', co(function* () {
    tree = yield* resolve(fixture('files'), options);
  }))

  it('should build', co(function* () {
    yield build(tree).end()
  }))

  it('should have copied files', co(function* () {
    var dest = join(process.cwd(), 'build', 'files')
    yield fs.stat.bind(null, join(dest, 'one.txt'))
    yield fs.stat.bind(null, join(dest, 'lib', 'two.txt'))
  }))
})