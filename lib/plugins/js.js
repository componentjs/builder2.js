module.exports = function () {
  return function js(file) {
    if (file.extension !== 'js') return;
    file.string = true;
  }
}