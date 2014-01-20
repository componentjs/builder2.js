module.exports = function () {
  return function* (file) {
    if (file.string) return;
    yield file.read;
    file.string = JSON.stringify(file.string);
    file.define = true;
  }
}