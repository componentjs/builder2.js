module.exports = function (file) {
  if (file.extension !== 'js') return;
  file.string = true;
}