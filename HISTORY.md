
1.1.2 / 2014-04-06
==================

 * build.scripts.canonical now returns the tree, not the canonical name
 * fix UMD wrap formatting

1.1.1 / 2014-04-06
==================

 * fix local file rewriting

1.1.0 / 2014-04-05
==================

So you don't have to include this for every custom `build.js`.

 * include build.scripts.canonical from build.js
 * include build.scripts.umd from build.js

1.0.4 / 2014-04-04
==================

 * fix components whose name does not match the repo name (such as page.js)

1.0.3 / 2014-04-01
==================

 * fix mix-cased `require()`s with mix-cased filenames - https://github.com/component/builder2.js/pull/34

1.0.2 / 2014-04-01
==================

 * fix `undefined`s when a relative URL can not be resolved - https://github.com/component/component/issues/499#issuecomment-39289681
