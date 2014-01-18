try {
  module.exports = require('./lib')
} catch (err) {
  if (err.message !== 'Unexpected token *') throw err
  module.exports = require('./build')
}