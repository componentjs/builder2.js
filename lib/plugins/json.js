module.exports = function* (file) {
  if (file.string) return
  if (file.extension !== 'json') return
  yield file.read
  try {
    JSON.parse(file.string)
  } catch (err) {
    throw new Error('"' + file.filename + '" is invalid JSON')
  }
  file.define = true
}