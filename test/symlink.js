var Builder = require('..').files
var plugins = require('..').plugins

var fs = require('fs')
var co = require('co')
var assert = require('assert')
var resolve = require('component-resolver')
var join = require('path').join

var options = {
  install: true,
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

  it('should install', co(function* () {
    tree = yield* resolve(fixture('files'), options)
  }))

  it('should build', co(function* () {
    yield build(tree).end()
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

  describe('out option', function () {
    it('should have symlinked files at specified output', co(function* () {
      yield build(tree, { out: 'public' }).end()

      var dest = join(process.cwd(), 'public', 'files')
      yield fs.stat.bind(null, join(dest, 'one.txt'))
      yield fs.stat.bind(null, join(dest, 'lib', 'two.txt'))
      var stat1 = yield fs.lstat.bind(null, join(dest, 'one.txt'))
      var stat2 = yield fs.lstat.bind(null, join(dest, 'lib', 'two.txt'))
      stat1.isSymbolicLink().should.be.true
      stat2.isSymbolicLink().should.be.true
    }))
  })
})
