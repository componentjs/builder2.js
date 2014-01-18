module.exports = function (file) {
  if (file.string) return
  if (file.extension !== 'js') return
  file.string = true
}