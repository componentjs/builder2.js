var toArray = require('stream-to-array')
var saveTo = require('save-to')

module.exports = function (proto) {
  proto.toArray = toArray

  proto.toBuffer = function (cb) {
    toArray(this, function (err, arr) {
      if (err) return cb(err)
      cb(null, Buffer.concat(arr))
    })

    return function (fn) {
      cb = fn
    }
  }

  proto.toStr = function (cb) {
    this.setEncoding('utf8')
    toArray(this, function (err, arr) {
      if (err) return cb(err)
      cb(null, arr.join(''))
    })

    return function (fn) {
      cb = fn
    }
  }

  proto.toFile = function (filename, cb) {
    saveTo(this, filename, function (err) {
      cb(err)
    })

    return function (fn) {
      cb = fn
    }
  }
}