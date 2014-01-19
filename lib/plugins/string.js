module.exports = function () {
  return function* (file) {
    if (file.string) return;
    yield file.read;
    // https://github.com/visionmedia/node-string-to-js/blob/master/index.js
    file.string = JSON.stringify(file.string
      .replace(/'/g, "\\'")
      .replace(/\r\n|\r|\n/g, "\\n"));
    file.define = true;
  }
}