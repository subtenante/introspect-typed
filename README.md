# introspect-typed

Provides rudimentary type checking and function overloading in Javascript.

<!-- toc -->

* [Install](#install)
* [API](#api)
  * [`matchType`: Type checking individual values](#matchtype-type-checking-individual-values)
    * [Direct match](#direct-match)
    * [Getting a matcher function](#getting-a-matcher-function)
    * [Custom types work as well](#custom-types-work-as-well)
    * [Matching against any type](#matching-against-any-type)
    * [Matching against several types](#matching-against-several-types)
    * [Matching against a predicate](#matching-against-a-predicate)
    * [Matching against an ES6 iterable](#matching-against-an-es6-iterable)
  * [`typeChecked`: Type checking function calls](#typechecked-type-checking-function-calls)
    * [Rest parameters](#rest-parameters)
    * [Error management](#error-management)
  * [`overload`: Overloading functions](#overload-overloading-functions)
    * [Chaining methods](#chaining-methods)
    * [Complete overloading](#complete-overloading)
  * [`build`](#build)

<!-- toc stop -->

## Install

    npm install introspect-typed

## API

### `matchType`: Type checking individual values

Other methods (`typeChecked`, `overload`) are based on this functionality.

#### Direct match

```javascript
    var matchType = require('introspect-typed').matchType;
    matchType(String, 'yes!');  // => true
    matchType(Number, 'no...'); // => false
```

#### Getting a matcher function

```javascript
    var matchType = require('introspect-typed').matchType;
    var stringMatcher = matchType(String);
    stringMatcher('yes!');  // => true
    stringMatcher(22.145);  // => false
```

#### Custom types work as well

```javascript
    var matchType = require('introspect-typed').matchType;
    function Custo () { this.type = 'custo'; }
    var custoMatcher = matchType(Custo);
    custoMatcher(new Custo());      // => true
    custoMatcher({type: 'custo'});  // => false
```

#### Matching against any type

Use `Typed.Any` if you want to match any value.

```javascript
    var Typed = require('introspect-typed');
    var matchType = Typed.matchType;
    matchType(Typed.Any, undefined); // => true
```

#### Matching against several types

Use `Typed.Either` if you want to match several types.

```javascript
    var Typed = require('introspect-typed');
    var matchType = Typed.matchType;
    matchType(Typed.Either(String, Number), 'string'); // => true
    matchType(Typed.Either(String, Number), 2);        // => true
    matchType(Typed.Either(String, Number), {});       // => false
```

#### Matching against a predicate

Use `Typed.Matcher` if you want to match with a predicate.

```javascript
    var Typed = require('introspect-typed');
    var matchType = Typed.matchType;
    var type = Typed.Matcher(function (v) { return v.length === 2; });
    matchType(type, {length: 2}); // => true
    matchType(type, '12');        // => true
    matchType(type, [1,2]);       // => true
    matchType(type, '1');         // => false
    matchType(type, [1,2,3]);     // => false
```

#### Matching against an ES6 iterable

Iterables are objects with a `Symbol.iterator` property containing a function.
In ES6, strings, arrays, sets, maps and generator functions, among others, are
iterables.

Use `Typed.Iterable` if you want to match es6 iterables.

```javascript
    var Typed = require('introspect-typed');
    var Iterable = Typed.Iterable;
    matchType(Iterable, []);    // => true
    matchType(Iterable, '12');  // => true
    matchType(Iterable, {});    // => false
    matchType(Iterable, 2);     // => false
    matchType(Iterable, null);  // => false
```

### `typeChecked`: Type checking function calls

```javascript
  var Typed = require('introspect-typed');
  var typeChecked = Typed.typeChecked;
  var Either = Typed.Either;
  function Custo () { this.type = 'custo'; }
```

Declare a type checked function by calling `typeChecked` with
- an array of types,
- the function you want to type check.

```javascript
  var tcFn = typeChecked([Either(String, Number), Custo], function (s, c) {
    return s + c;
  });
  tcFn('string', new Custo()); // => 'string[object Object]'
  tcFn(Infinity, new Custo()); // => 'Infinity[object Object]'
```

#### Rest parameters

Check type for rest parameters by using `Typed.Rest`. In ES6:

```javascript
var Rest = Typed.Rest;
var typedFn = typeChecked([String, Number, Rest(Either(Custom, String))],
  (s, n, ...cs) => ({ result: s.repeat(n), rest: cs.length });
```

In ES5:

```javascript
  var Rest = Typed.Rest;
  var typedFn = typeChecked([String, Number, Rest(Either(Custom, String))],
    function (s, n) {
      var cs = [].slice.call(arguments, 2);
      return { result: s.repeat(n), rest: cs.length };
    });
```

* `Rest(String)` will match all strings at the end of the arguments.
* `Rest(Any)` will match anything at the end of the arguments.
* `Rest(Either(X,Y))` will match any number of `X`s and `Y`s at
  the end of the arguments.

Note that `Rest(...)` _must_ be the last element in the type array, otherwise
an error will be thrown while matching.

#### Error management

By default, the typechecked function throws a `TypeError` when not given
proper arguments.

```javascript
  tcFn('string', {type:'custo'}); // => throws TypeError
```

You can set the error management behaviour yourself (at any time).

```javascript
  tcFn.onError(function (error, args, types) {
    console.error(error);
  });
```

And set back the original throwing behaviour by calling `onError` with
a falsey value.

```javascript
  tcFn.onError(false);
```

### `overload`: Overloading functions

#### Chaining methods

When creating an API, we often want our methods to accept different kinds
of inputs, but the code that results from these checks is ugly and provides
many occasions for bugs.

Instead, using `overload`, one can do the following:

```javascript
  var overload = require('introspect-typed').overload;

  var createObj = overload(
    // This method is the default method, called when no other case
    // has matched
    function (obj) {
      obj.test = 1;
      return obj;
    }
  )
  .when('withName', // Here we define a 'withName' method in the overloaded method
             [String, Object], // which matches calls with a String and an Object
    function (name,   obj)
    {
      obj.name = name;
      // We can use the overloaded method named parameters to call other methods defined
      // for example the default method, passed to overload
      return createObj.default(obj);
    }
  )

  .when([String, String, Object], function (name, desc, obj) {
    obj.desc = desc;
    // Or we can use it to call named overloaded methods.
    return createObj.withName(name, obj);
  });
```

Without the comments:

```javascript
  var overload = require('introspect-typed').overload;

  var createObj = overload(function (obj) {
    obj.test = 1;
    return obj;
  }).when('withName', [String, Object], function (name, obj) {
    obj.name = name;
    return createObj.default(obj);
  }).when([String, String, Object], function (name, desc, obj) {
    obj.desc = desc;
    return createObj.withName(name, obj);
  });
```

Calling a named overloaded method directly bypasses the type check.

To have a completely type checked method, one could do this instead:

```javascript
  var overload = require('introspect-typed').overload;
  var typeChecked = require('introspect-typed').typeChecked;

  var createObj = overload([Object], function (obj) {
    obj.test = 1;
    return obj;
  })
  .when([String, Object], function (name, obj) {
    obj.name = name;
    return createObj(obj);
  })
  .when([String, String, Object], function (name, desc, obj) {
    obj.desc = desc;
    return createObj(name, obj);
  });
```

The calls to `overload` with arguments matching `[Array, Function]` are
equivalent to `overload(typeChecked(types, fn))`.

#### Complete overloading

```javascript
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

    // returns the length for a String or an Array
    .when([Either(String,Array)],
      function (v) { return v.length; })

    // logs arguments when there are 4 of them
    .when([Any, Any, Any, Any],
      function () { console.log(arguments); return arguments[3]; })

    // give a number and a string: repeat the string n times
    .when([Number, String],
      function (n, s) { return s.repeat(n); });
```


Calling this method with different kinds of arguments changes its behaviour.

```javascript
    expect(fn('2','57', 'x')).to.be.equal('2!57!x');
    expect(fn('2','57')).to.be.equal('2-57');
    expect(fn(2,'57')).to.be.equal('5757');
    expect(fn(2,57)).to.be.equal(2*57);
    expect(fn(42)).to.be.equal(43);
```

The `this` value is conserved.

```javascript
    expect(fn.apply(42, [])).to.be.equal(42);
```

### `build`

The `build` function allows to create a new Typed context.

This allows to modify the `matchType` function, to pass more cases to the
type checking.

```javascript
    var build = require('introspect-typed').build;
    var newTypedContext = build();
    var matchType = newTypedContext.matchType;

    var Truthy = {};

    expect(matchType(Truthy, 1)).to.be.false;
    expect(matchType(Truthy, null)).to.be.false;

    matchType.addTypeMatchCase({
      case: function (type) { return type === Truthy; },
      match: function (type) { return function (val) { return !!val }; }
    });

    expect(matchType(Truthy, 1)).to.be.true;
    expect(matchType(Truthy, null)).to.be.false;
```
