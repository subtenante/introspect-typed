/*global describe, it*/
'use strict';

var expect = require('chai').expect;

var Typed = require('../');
var build = Typed.build;
var matchType = Typed.matchType;
var typeChecked = Typed.typeChecked;
var overload = Typed.overload;

var Any = Typed.Any;
var Either = Typed.Either;
var Matcher = Typed.Matcher;
var Rest = Typed.Rest;
var Iterable = Typed.Iterable;

describe('build', function () {
  it ('is a function returning a new typed context', function () {
    var t = build();
    expect(t.Any).to.not.be.undefined;
    expect(t.Either).to.not.be.undefined;
    expect(t.Matcher).to.not.be.undefined;
    expect(t.matchType).to.be.a('function');
    expect(t.typeChecked).to.be.a('function');
    expect(t.overload).to.be.a('function');
    expect(t.Any).to.not.be.equal(Any);
    expect(t.Rest).to.not.be.equal(Rest);
    expect(t.Iterable).to.not.be.equal(Iterable);
  });

  it ('should allow for new type match cases', function () {
    var t = build();
    var matchType = t.matchType;

    var Truthy = {};

    expect(matchType(Truthy, 1)).to.be.false;
    expect(matchType(Truthy, null)).to.be.false;

    matchType.addTypeMatchCase({
      case: function (type) { return type === Truthy; },
      match: function (type) { return function (val) { return !!val }; }
    });

    expect(matchType(Truthy, 1)).to.be.true;
    expect(matchType(Truthy, null)).to.be.false;

  });

});

describe('matchType', function () {

  it ('should validate correctly for null', function () {
    var type = null;
    var typeMatcher = matchType(type);
    [null].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    ['', 2, undefined, new Date(), /.*/, {}, []].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for undefined', function () {
    var type = undefined;
    var typeMatcher = matchType(type);
    [undefined].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    ['', 2, null, new Date(), /.*/, {}, []].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Function', function () {
    var type = Function;
    var typeMatcher = matchType(type);
    [String, matchType].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    ['', 2, null, undefined, new Date(), /.*/, {}, []].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for String', function () {
    var type = String;
    var typeMatcher = matchType(type);
    ['', 'abcd'].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [expect, 2, null, undefined, new Date(), /.*/, {}, []].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Object', function () {
    var type = Object;
    var typeMatcher = matchType(type);
    [{}, new Date(), [], /.*/, arguments].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [2, '', undefined, null].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Array', function () {
    var type = Array;
    var typeMatcher = matchType(type);
    [[], [1,2,3]].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [expect, 2, null, undefined, new Date(), /.*/, {}, arguments].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Custom type', function () {
    function Type () {}
    var type = Type;
    var typeMatcher = matchType(type);
    [new Type()].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [expect, 2, null, undefined, new Date(), /.*/, {}, arguments].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Any', function () {
    function Type () {}
    var type = Any;
    var typeMatcher = matchType(type);
    [new Type(), expect, 2, null, undefined, new Date(), /.*/, {}, arguments].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
  });

  it ('should validate correctly for Either', function () {
    function Type () {}
    var type = Either(Type, Number);
    var typeMatcher = matchType(type);
    [new Type(), 2].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [expect, null, undefined, new Date(), /.*/, {}, arguments].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Matcher', function () {
    function Type (v, unused) { this.length = v; }
    // Type.length === 2 since it takes officially 2 arguments
    var type = Matcher(function (v) { return v.length === 2; });
    var typeMatcher = matchType(type);
    [Type, new Type(2), {length: 2}, '12', [1,2]].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    [arguments, null, undefined, new Date(), /.*/, {}, '', [1,2,3]].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

  it ('should validate correctly for Iterable', function () {
    var type = Iterable;
    var typeMatcher = matchType(type);
    var iter = {}; iter[Symbol.iterator] = function () {};
    [[], new Set(), new Map(), iter, ''].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.true;
      expect(matchType(type, tested)).to.be.true;
    });
    var noiter = {}; noiter[Symbol.iterator] = true;
    [expect, 2, null, undefined, {}, new Date(), /.*/, arguments, noiter].forEach(function (tested) {
      expect(typeMatcher(tested)).to.be.false;
      expect(matchType(type, tested)).to.be.false;
    });
  });

});

describe('typeChecked', function () {
  function Custom () { this.type = 'custo'; }

  var typedFn = typeChecked([String, Number, Rest(Custom)], function (s, n) {
    var cs = [].slice.call(arguments, 2);
    return { result: s.repeat(n), rest: cs.length };
  });

  var testFn = function () { return typedFn('incorrect', 'types'); };

  it('should work correctly when given correct types', function () {
    var result0 = typedFn('ab', 1);
    expect(result0.rest).to.be.equal(0);
    expect(result0.result).to.be.equal('ab');
    var result1 = typedFn('ab', 3, new Custom());
    expect(result1.rest).to.be.equal(1);
    expect(result1.result).to.be.equal('ababab');
    var result2 = typedFn('ab', 2, new Custom(), new Custom());
    expect(result2.rest).to.be.equal(2);
    expect(result2.result).to.be.equal('abab');
  });
  it('should throw a TypeError by default on error', function () {
    expect(testFn).to.throw(TypeError);
  });
  it('should correctly call the onError callback if given', function () {
    var result;
    typedFn.onError(function (error, args, types) {
      result = {error: error, types: types, args: args};
    });
    expect(testFn).to.not.throw(TypeError);
    typedFn('a', '2');
    expect(result.error).to.be.instanceOf(TypeError);
    expect(result.types).to.be.instanceOf(Array);
    expect(result.args.length).to.be.equal(2);
  });
  it('should throw a TypeError when calling onError with falsey value', function () {
    typedFn.onError(null);
    expect(testFn).to.throw(TypeError);
  });
});

describe('overload', function(){

  describe('a completely overloaded function', function () {
    var fn = overload(function () { return this; })
      .when([Number],
        function (a) { return a + 1; })

      .when([Number, Number],
        function (n1, n2) { return n1 * n2; })

      .when([String, String],
        function (s1, s2) { return s1 + '-' + s2; })

      .when([String, String, String],
        function (s1, s2, s3) { return [s1,s2,s3].join('!'); })

      .when([Boolean, Either(String,Array)],
        function (b, v) { return v.length; })

      .when([Array, Rest(Either(String, Number))],
        function (arr) {
          var args = [].slice.call(arguments, 1);
          return arr.concat(args);
        })

      .when([Any, Any, Any, Any],
        function () { return arguments[3]; })

      .when([Number, String],
        function (n, s) { return s.repeat(n); });

    it('should correctly detect the argument String/String/String', function(){
      expect(fn('2','57', 'x')).to.be.equal('2!57!x');
    });

    it('should correctly detect the argument Any/Any/Any/Any', function(){
      expect(fn('?',0,null,'fourth')).to.be.equal('fourth');
    });

    it('should correctly detect the argument Boolean/Either(String,Array)', function(){
      expect(fn(true, '?')).to.be.equal(1);
      expect(fn(false, [1,2,3,4,5])).to.be.equal(5);
    });

    it('should correctly detect the arguments Array/Rest', function(){
      expect(fn([0], 1, 2, '3', '4')).to.deep.equal([0, 1, 2, '3', '4']);
      expect(fn([], 0)).to.deep.equal([0]);
    });

    it('should correctly detect the argument String/String', function(){
      expect(fn('2','57')).to.be.equal('2-57');
    });

    it('should correctly detect the argument Number/String', function(){
      expect(fn(2,'57')).to.be.equal('5757');
    });

    it('should correctly detect the argument Number/Number', function(){
      expect(fn(2,57)).to.be.equal(2*57);
    });

    it('should correctly detect the argument Number', function(){
      expect(fn(42)).to.be.equal(43);
    });

    it('should correctly return the "this" value', function(){
      expect(fn.apply(42, [])).to.be.equal(42);
    });
  });

  describe('a partially overloaded untyped function', function () {
    var createObj = overload(function (obj) {
      obj.one = 1;
      return obj;
    }).when('withName', [String, Object], function (name, obj, o) {
      obj.name = name;
      return createObj.default(obj);
    }).when([String, String, Object], function (name, desc, obj, o) {
      obj.desc = desc;
      return createObj.withName(name, obj);
    });

    it('should correctly overload with String/String/Object', function(){
      var result = createObj('great', 'a fancy obj', {inner: 1});
      expect(result.one).to.be.equal(1);
      expect(result.inner).to.be.equal(1);
      expect(result.name).to.be.equal('great');
      expect(result.desc).to.be.equal('a fancy obj');
    });
    it('should correctly overload with String/Object', function(){
      var result = createObj('great', {inner: 2});
      expect(result.one).to.be.equal(1);
      expect(result.inner).to.be.equal(2);
      expect(result.name).to.be.equal('great');
      expect(result.desc).to.be.equal(undefined);
    });
    it('should correctly call the default function', function(){
      var result = createObj({inner: 3});
      expect(result.one).to.be.equal(1);
      expect(result.inner).to.be.equal(3);
      expect(result.name).to.be.equal(undefined);
      expect(result.desc).to.be.equal(undefined);
    });
    it('should not throw when calling with wrong signature', function(){
      var testFn = function () { return createObj([]); };
      expect(testFn).not.to.throw(TypeError);
    });
  });

  describe('a partially overloaded typed function', function () {
    var createObj = overload([Object], function (obj) {
      obj.test = 1;
      return obj;
    }).when([String, Object], function (name, obj, o) {
      obj.name = name;
      return createObj(obj);
    }).when([String, String, Object], function (name, desc, obj, o) {
      obj.desc = desc;
      return createObj(name, obj);
    });

    it('should correctly overload with String/String/Object', function(){
      var result = createObj('great', 'a fancy obj', {inner: 1});
      expect(result.test).to.be.equal(1);
      expect(result.inner).to.be.equal(1);
      expect(result.name).to.be.equal('great');
      expect(result.desc).to.be.equal('a fancy obj');
    });
    it('should correctly overload with String/Object', function(){
      var result = createObj('great', {inner: 2});
      expect(result.test).to.be.equal(1);
      expect(result.inner).to.be.equal(2);
      expect(result.name).to.be.equal('great');
      expect(result.desc).to.be.equal(undefined);
    });
    it('should correctly call the default function', function(){
      var result = createObj({inner: 3});
      expect(result.test).to.be.equal(1);
      expect(result.inner).to.be.equal(3);
      expect(result.name).to.be.equal(undefined);
      expect(result.desc).to.be.equal(undefined);
    });
    it('should throw when calling with wrong signature', function(){
      var testFn = function () { return createObj(2); };
      expect(testFn).to.throw(TypeError);
    });
  });

});
