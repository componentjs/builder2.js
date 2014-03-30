var Builder = require('./builder');

module.exports = Styles;

Builder.extend(Styles);

function Styles(branches, options) {
  if (!(this instanceof Styles)) return new Styles(branches, options);

  options = options || {};
  Builder.call(this, branches, options);
}
