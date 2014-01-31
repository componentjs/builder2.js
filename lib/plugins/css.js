module.exports = function () {
  return function css(file) {
    if (file.extension !== 'css') return;
    file.string = true;
  }
}