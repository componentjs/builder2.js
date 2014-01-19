var join = require('path').join;

var Builder = require('./builder');
var utils = require('../utils');

module.exports = Styles;

Builder.extend(Styles);

function Styles(branches, options) {
  if (!(this instanceof Styles)) return new Styles(branches, options);

  options = options || {}
  Builder.call(this, branches, options);

  // prefix for assets
  // i.e. this.urlPrefix + 'fortawesome/fontawesome/fonts/'
  this.urlPrefix = options.urlPrefix || '';
}

/**
 * Go through all the branches, filter out the components,
 * then format it so we can proces them easier.
 *
 * @param {Object} branch
 * @api private
 */

 Styles.prototype.resolve = function* (branch) {
  var fields = this.fields;
  var component = branch.node;

  var obj = {
    branch: branch,
    component: component
  };

  obj.path = branch.path
    || join(this.out, utils.folder(branch));

  var files = yield* this.unglob(obj);

  // convert every field into a `file` object suitable for the middleware
  fields.forEach(function (field) {
    files[field] = files[field].map(toFileObject);
  });


  this.dispatch(files);

  function toFileObject(path) {
    var file = {
      path: path,
      obj: obj,
      branch: branch,
      component: component,
      filename: join(obj.path, path),
      extension: path.split('.').pop()
    };

    file.read = utils.read(file);

    return file;
  }
}

/**
 * The last middleware of every field.
 * Checks to see if the file is "used",
 * then appends it if it is.
 *
 * @param {Object} field
 * @param {Object} file
 * @return {String}
 * @api private
 */

Styles.prototype.append = function* (field, file) {
  yield* this.transform(field, file);
  // read file now if not already read
  if (file.string === true) yield file.read;
  if (!file.string) return '';
  return file.string + '\n\n';
}