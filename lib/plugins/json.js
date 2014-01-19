module.exports = function () {
  return function* (file) {
    if (file.extension !== 'json') return;
    yield file.read;
    try {
      JSON.parse(file.string);
    } catch (err) {
      throw new Error('"' + file.filename + '" is invalid JSON');
    }
    file.define = true;
  }
}