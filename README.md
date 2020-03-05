# nst package

A Tree-View for source code symbols and marks inspired by the Source Tree in KomodoEDIT and [KomodoIDE](https://www.activestate.com/products/komodo-ide/).

This is the initial work learning how to extend Atom. It has support for PHP, JS, CSS, SCSS, and LESS.

More useful (at least to me!) than similar packages like [symbols-tree-view](https://atom.io/packages/symbols-tree-view) and [symbols-view](http://github.com/atom/symbols-view).


![A screenshot of your package](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)


## TO DO

This package is meant to be light so finding symbols and tags is done using regex (see nst-parser.js for configuration) (no ast, or code-intel). In that respect it doesnt support all types of syntax you may find specially in JS, so it makes some assumptions at what patterns represent key symbols, in many cases with JS it follows my personal style.

Move the configuration of markers/tags outside the package.

Separate lang/mode definitions from nst-parser.js to make it easier for people to modify them.
