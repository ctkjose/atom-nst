# Symbol and Mark Tree View for the Atom Editor

A Tree-View for source code symbols and marks inspired by the Source Tree in KomodoEDIT and [KomodoIDE](https://www.activestate.com/products/komodo-ide/).

This is the initial work learning how to extend Atom. It has support for PHP, JS, CSS, SCSS, and LESS.

More useful (at least to me!) than similar packages like [symbols-tree-view](https://atom.io/packages/symbols-tree-view) and [symbols-view](http://github.com/atom/symbols-view).


![A screenshot of your package](https://raw.githubusercontent.com/ctkjose/atom-nst/master/screenshoot.png)



## Marks ##
Marks are special comments supported in JS and PHP.

```
//#TODO TAG_HERE
//#TODO A long explanation...
```

```
//#MARK TAG_HERE
//#MARK:OBJ MY_FAKE_CLASS
//#MARK:FN MY_FAKE_FUNCTION
//#MARK:CONFIG USER_DEFAULTS
```

You can skip or hide symbols from a section of code using:
```
//#MARK:IGNORE-START
var a = function(){ ... } //this will not be presented as a symbol
//#MARK:IGNORE-END
```

You can also set a list of symbols to be ignored.
```
//#MARK:IGNORE a1,openScope

var a1 = function(){...}; //will be ignored
function openScope(){...}; //will also be ignored

var a1 = function(){...}; //this one will not be ignored since
```

The `//#MARK:IGNORE` rule takes a list of symbols name that will be ignored. After this pragma is set the first symbol found with that name is ignored. Note this pragma has nothing to do with your code and is not bounded by the scope in which you put it in your code.

## TO DO

This package is meant to be light so finding symbols and tags is done using regex (see nst-parser.js for configuration) (no ast, or code-intel). In that respect it doesnt support all types of syntax you may find specially in JS, so it makes some assumptions at what patterns represent key symbols, in many cases with JS it follows my personal style.

Move the configuration of markers/tags outside the package.

Separate lang/mode definitions from nst-parser.js to make it easier for people to modify them.

## ExponentialWorks

This package is sponsored by [ExponentialWorks](https://exponentialworks.com).
