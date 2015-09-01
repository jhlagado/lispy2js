# lispy2.js

A lispy2 interpreter in JavaScript

This is a JavaScript implementation of Peter Norvig's Lispy2 interpreter

See: "(An ((Even Better) Lisp) Interpreter (in Python))" http://norvig.com/lispy2.html

It implements all functionality except complex number support (which should be easy to add if required).

This code can be included as a "little language" module in your JavaScript application. 

It can be installed via bower and it supports RequireJS, AMD or via the global name space.

Simple example:

var result = lispy2.run('(+ 1 2)');

==> result = 3

A test framework which includes Norvig's original tests plus a few I added 

can be found in tests.html (simply open it in a browser)