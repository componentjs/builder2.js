module.exports = function () {
  return function* string(file) {
    yield file.read;
    file.string = JSON.stringify(file.string);
    file.define = true;
  }
}