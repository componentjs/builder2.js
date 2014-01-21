module.exports = function () {
  return function* (file) {
    yield file.read;
    file.string = JSON.stringify(file.string);
    file.define = true;
  }
}