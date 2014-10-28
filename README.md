# introspect-typed

Provides rudimentary type checking and function overloading in Javascript.

## Install

    npm install introspect-typed

## Type checking: Individual values

### Direct match

    var matchType = require('introspect-typed').matchType;
    matchType(String, 'yes!');  // => true
    matchType(Number, 'no...'); // => false

### Getting a matcher function

    var matchType = require('introspect-typed').matchType;
    var stringMatcher = matchType(String);
    stringMatcher('yes!');  // => true
    stringMatcher(22.145);  // => false

### Custom types work as well

    var matchType = require('introspect-typed').matchType;
    function Custo () { this.type = 'custo'; }
    var custoMatcher = matchType(String);
    stringMatcher(new Custo());      // => true
    stringMatcher({type: 'custo'});  // => false


## Type checking: Function calls

    var typeChecked = require('introspect-typed').typeChecked;
    function Custo () { this.type = 'custo'; }

Declare a type checked function by calling `typeChecked` with
- an array of types,
- the function you want to type check.

    var tcFn = typeChecked([String, Custo], function (s, c) {
      // ...
    });

By default, the typechecked function throws a `TypeError` when not given
proper arguments.

    tcFn('string!', {type:'custo'}); // => throws TypeError

You can set the error management behaviour yourself (at any time).

    tcFn.onError(function (error, args, types) {
      console.error(error);
    });

And set back the original throwing behaviour by calling `onError` with 
a falsey value.

    tcFn.onError(false);


## Overloading

### Chaining methods

When creating an API, we often want our methods to accept different kinds 
of inputs, but the code that results from these checks is ugly and provides
many occasions for bugs.

Instead, using `overload`, one can do the following:

    var overload = require('introspect-typed').overload;

    var createObj = overload(
      // This method is the default method, called when no other case 
      // has matched
      function (obj) {
        obj.test = 1;
        return obj;
      }
    )
    .when('withName', // Here we define a 'withName' method in the overloading object
               [String, Object], // which matches calls with a String and an Object
      function (name,   obj,     o) // the last arg is the overloading object
      {
        obj.name = name;
        // We can use the overloading object to call other methods defined 
        // for example the default method, passed to overload
        return o.default(obj);
      }
    )

    .when([String, String, Object], function (name, desc, obj, o) {
      obj.desc = desc;
      // Or we can use it to call named overloading methods.
      return o.withName(name, obj);
    });

Without the comments:

    var overload = require('introspect-typed').overload;

    var createObj = overload(function (obj) {
      obj.test = 1;
      return obj;
    })
    .when('withName', [String, Object], function (name, obj, o) {
      obj.name = name;
      return o.default(obj);
    })
    .when([String, String, Object], function (name, desc, obj, o) {
      obj.desc = desc;
      return o.withName(name, obj);
    });

Calling a named overloading method directly bypasses the type check.

To have a completely type checked method, one could do this instead:

    var overload = require('introspect-typed').overload;
    var typeChecked = require('introspect-typed').typeChecked;

    var createObj = overload([Object], function (obj) {
      obj.test = 1;
      return obj;
    })
    .when([String, Object], function (name, obj, o) {
      obj.name = name;
      return createObj(obj);
    })
    .when([String, String, Object], function (name, desc, obj, o) {
      obj.desc = desc;
      return createObj(name, obj);
    });

The calls to `overload` with arguments matching `[Array, Function]` are 
equivalent to `overload(typeChecked(types, fn))`.


### Complete overloading

    var overload = require('introspect-typed').overload;

    var fn = overload(function () { return this; })
      
      // give a number : increments it
      .when([Number], 
        function (a) { return a + 1; })

      // give two numbers : multiply them
      .when([Number, Number], 
        function (n1, n2) { return n1 * n2; })
      
      // give two strings: join them with '-'
      .when([String, String], 
        function (s1, s2) { return s1 + '-' + s2; })
      
      // give 3 strings: join them with '!'
      .when([String, String, String], 
        function (s1, s2, s3) { return [s1,s2,s3].join('!'); })
      
      // give a number and a string: repeat the string n times
      .when([Number, String], 
        function (n, s) { return s.repeat(n); });
      
Calling this method with different kinds of arguments changes its behaviour.

    expect(fn('2','57', 'x')).to.be.equal('2!57!x');
    expect(fn('2','57')).to.be.equal('2-57');
    expect(fn(2,'57')).to.be.equal('5757');
    expect(fn(2,57)).to.be.equal(2*57);
    expect(fn(42)).to.be.equal(43);

The `this` value is conserved.

    expect(fn.apply(42, [])).to.be.equal(42);