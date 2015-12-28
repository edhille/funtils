'use strict';

/**
 * naive clone function for copying simple object/array/primitive data
 *
 * @param {object|array} obj_or_array Object or Array to deep clone
 */
function clone(obj_or_array) {
	var cloneObj = {};

	if (obj_or_array instanceof Array) {
		return obj_or_array.map(clone);
	} else if (obj_or_array instanceof Function) {
		return obj_or_array;
	} else if (obj_or_array instanceof Object || typeof obj_or_array === 'object') {
		Object.keys(obj_or_array).map(function (prop) {
			cloneObj[prop] = clone(obj_or_array[prop]);
		});

		return cloneObj;
	}

	return obj_or_array;
}

/**
 * merge given props with given object to produce new object where props overrides/adds to object
 *
 * @param {Object} obj - base object
 * @param {Object} props - properties to override/add to obj
 *
 * @return {Object} newObj - merged object
 */
function merge(obj, props) {
	var newObj = clone(obj);

	Object.keys(props).map(function (prop) {
		newObj[prop] = props[prop];
	});

	return newObj;
}

/**
 * functional method to slice array or arguments
 */
var slice = Function.call.bind([].slice);

/**
 * functional method to splice array or arguments
 */
var splice = Function.call.bind([].splice);

/**
 * functional method to reduce array or arguments
 */
var reduce = Function.call.bind(Array);

/**
 * tell if something exists (ie it's neither null, nor undefined)
 */
function existy(test) {
   /* jshint eqnull: true */
	return test != null;
}

/**
 * functional dispatcher
 *
 * @param {...function} fn - function to call for dispatching
 *
 * @return {function}
 */
function dispatch(/* fns */) {
	var fns = slice(arguments),
		size = fns.length;

	return function do_dispatch(target /* args */) {
		var args = slice(arguments, 1), ret, fn, i;

		for (i = 0; i < size; ++i) {
			fn = fns[i];

			ret = fn.apply(null, [target].concat(args));

			if (existy(ret)) return ret;
		}

		return ret;
	};
}

/**
 * identity
 *
 * @param {Mixed} me - what should always be returned
 *
 * @returns {Mixed}
 */
function identity(me) {
	return function _identity() { return me; };
}

/**
 * curry given function
 *
 * @param {function} fun - function to curry
 *
 * @returns {function}
 */
function curry(fun) {
	return function _curry(arg) {
		return fun(arg);
	};
}

/**
 * partial function generator
 *
 * @param {function} fun - function to wrap
 * @param {[Mixed]} pargs - arguments to be prepended to arguments
 *
 * @returns {function}
 */
function partial(fun /* pargs */) {
	var pargs = slice(arguments, 1);

	return function _partial(/* args */) {
		return fun.apply(null, pargs.concat(slice(arguments)));
	};
}

/**
 * compose compose(f, g) => f(g(x))
 *
 * @param {function}
 * @param {function}
 *
 * @returns {function}
 */
function compose(f, g) {
	return function _composee(x) {
		return f(g(x));
	};
}

/**
 * sorts numerically
 */
function sortNumeric(a, b) {
	a = +a;
	b = +b;
	return a > b ? 1 : a < b ? -1 : 0;
}

/**
 * gets the values for a given object
 *
 * @param {Object}
 *
 * @return {Array}
 */
function values(obj) {
	return Object.keys(obj).map(function (key) { return obj[key]; });
}

/**
 * memoize the given function so it is called once and it's return value is
 * used for all subsequent calls
 *
 * @param {Function}
 */
function memoize(fn) {
	var memo = {};

	return function _memoize() {
		var key = JSON.stringify(arguments);

		if (typeof memo[key] === 'undefined') {
			memo[key] = fn.apply(null, arguments);
		}

		return memo[key];
	};
}

/**
 * accessor for index of elem in array, based upon it's id
 *
 * @param {Array} arr - array to search
 * @param {Object} elem - element to find in array
 *
 * @return {Number} index of element in array or -1 if not found
 */
function getIndex(arr, elem) {
	var i, l = arr.length;

	for (i = 0; i < l; ++i) {
		if (elem.id === arr[i].id) return i;
	}

	return -1;
}

/**
 * generate a scaling function for the given input/output ranges
 *
 * @param {Number} inputMin - smallest expected value for input
 * @param {Number} inputMax - largest expected value for input
 * @param {Number} outputMin - smallest desired output
 * @param {Number} outputMax - largest desired output
 *
 * @return {Number} where ouputMin <= output <= outputMax
 */
function generateScale(inputMin, inputMax, outputMin, outputMax) {
	var inputDiff = inputMax - inputMin,
		outputDiff = outputMax - outputMin;

	return function _scale(x) {
		var test = (outputDiff * (x - inputMin) / inputDiff) + outputMin;

		return test < outputMin ? outputMin : test > outputMax ? outputMax : test;
	};   
}

/**
 * monad generator based off Crockford's monad implementation
 *
 * @param{Function} modifier - helper function to alter value for unit() calls
 *
 * @return {Object} monad for wrapping values
 */
function monad(modifier) {
	var prototype = Object.create(null);

	prototype._is_monad = true;

	function unit(value) {
		var monad = Object.create(prototype);

		if (typeof modifier === 'function') {
			value = modifier(monad, value);
		}

		monad.bind = function (fn, args) {
			var argsCopy = args ? [].slice.call(args) : [],
				result = fn.apply(null, [value].concat(argsCopy));

			return result && result._is_monad ? result : unit(result);
		};

		monad.value = function () { return value; };

		return monad;
	}

	unit.lift = function (name, fn) {
		if (prototype[name]) throw new Error('"' + name + '" is already defined');

		prototype[name] = function (/* args */) {
			var result = this.bind(fn, arguments);
			return result && result._is_monad ? result : unit(result);
		};

		return unit;
	};

	return unit;
}

module.exports = {
	clone: clone,
	merge: merge,
	slice: slice,
	splice: splice,
	reduce: reduce,
	existy: existy,
	dispatch: dispatch,
	noop: function(){},
	identity: identity,
	curry: curry,
	partial: partial,
	compose: compose,
	monad: monad,
	sortNumeric: sortNumeric,
	values: values,
	memoize: memoize,
	getIndex: getIndex,
	genScale: generateScale
};
