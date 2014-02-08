module.exports = function () {
  return function string(file, done) {
    file.read(function (err, string) {
      if (err) return done(err);
      file.string = JSON.stringify(string);
      file.define = true;
      done();
    })
  }
}