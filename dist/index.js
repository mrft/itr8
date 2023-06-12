"use strict";
/**
 * itr8 exposes 4 categories of functions:
 *  * **interface** functions: these are meant to either
 *    * turn an iterator into something else for further processing (their name typically starts with 'itr8To')
 *    * simply produce an iterableIterator based on some arguments (their name typically starts with 'itr8')
 *    * turn something else into a 'pipeable' iterator (their name typically starts with 'itr8From')
 *  * **operator** functions: the heart of the library
 *    * operator functions produce transIterators that we can chain to gether to build the behaviour we want
 *    * these transIterator functions will always be able to handle both synchronous or asynchronous iterators as input
 *  * **peer** functions: both interface functions and operators that have *external dependencies*
 *    * interface functions to work with NodeJS streams (because the browser wouldnot)
 *    * interface functions to integrate with RxJS
 *    * an operator to help with streaming JSON parsing
 *  * **utility** functions: functions used to implement the rest of the library that culd be used by others to help them write their own 'operators'
 *    * `isPromise`
 *    * `powerMap operator`: build your own operators easily
 *    * `forLoop`: do a ```for (init; check; after) {}``` loop, regardless whether init and/or check and/or after is asynchronous or not
 *    * `compose`: chain functions together, passing the output of the first as input of the next (so you can read from left to right)
 *    * `thenable`: write the same code, regardless whether the input is a promise or a regular value
 *
 * itr8 is all about using iterators as a simple abstraction that can be used for things like:
 * * synchronously accessible data separated in space (~in-memory array)
 * * asynchronously accessible data separated in space (~data stored in a file or api)
 * * data separated in time (~events)
 * * data that changes over time (every element in the stream is the new current value)
 *
 * An iterator has an extremely simple interface that exposes a parameter-less next() function
 * that will return ```{ done: boolean, value: any }``` (or ```Promise<{ done: boolean, value: any }>```
 * for async iterators). Checkout the MDN page about
 * [the iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol)
 * for more details.
 *
 * Because the abstraction is 1) so simple 2) a part of the javascript standard
 * it is very well suited to build upon.
 *
 * What we build upon it is very simple as well: if we can easily generate functions that take
 * one iterator as input and return another iterator as output, we can pipe all these functions
 * after another and build things that are very powerful, and actually reuse code regardless
 * of which data is being sent. I am calling these functions transIterators (cfr. transducers).
 *
 * The function that produces a transIterator is what we call an 'operator': a function that
 * produces another function of the form (inputIterator) => outputIterator.
 * (Functions producing other functions are often referred to as a 'higher-order functions').
 *
 * @example
 * ```filter((x) => x > 100)```
 * takes the filter function as a parameter, and will return
 * a new function that takes an input iteratorIn, and outputs a new iteratorOut that will only
 * pass through the elements of iteratorIn that are > 100.
 * so 'filter' is the operator, and the function it produces is the transIterator.
 *
 * We categorized all functions into 3 sets:
 * * 'operators' contains all the functions that help you transform an iterator
 * * 'interface' contains all the functions that either produce an iterator based
 *    on something else or take an iterator and turn it into something else.
 * * 'utils' are functions used internally, but that can also be used by you to easily
 *    build your own operators or interface functions
 *
 * @module
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./util/index"), exports);
__exportStar(require("./interface/index"), exports);
__exportStar(require("./operators/index"), exports);
//# sourceMappingURL=index.js.map