module.exports = function () {
  return function (file) {
    if (file.extension !== 'js') return;
    file.string = true;
  }
}