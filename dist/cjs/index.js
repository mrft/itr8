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
// https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLjAVwLYCMCmAnA2gXRgF4ZcBGAGhgCYqBmKgFnwG4AoUSWdBabASzABzAsVIBycJnFVxUAO4gZcgBbZM02QDMQybONZs2W5GGBR+4GFBABJKDjg3sAHgAqAPgAUiAILZsOABPdw8ASgR7R2dQmABvNhgkmHUoPTB4XABlIIwQABsAOn4HQOd8LzD2AF8jEzMLKxLokGw3EH9AkM8vZrLWyNKnVtCIzuDYhOSYfMxYdQhkfNgSAnZp2dgwdeT5FX5ZmC8AQi8Mkj7h7EKwTAAPKEqwwoATKTD4xOnkhaWoQoADsgICozoUAG5wfLITBVL5JWrTVLpFKYRbLGpGYymcyWMAAKhScGEmC80Dg2CgSDQWGwVEwYBe1IwOA+U2S-C0R3JlJgLhgDJebPh3x02COmxg-DEPKgLClfJIgvl-AA1Krhd8tTAgvxMPkXlKdlrEclqgL8hBMJ9tTAxRK5gqSLKVTAPErGSqALRezW25K6-WG-jG76mhFsWpsAD00ZgnAgBUwhXyICEXlwhSzgRJXgYAHYwvg4bH4+BE7MU2mM1nCjmhKSAKwUahFuFGUsJpNV9OXZztcZBLw2KL9bA+MKT9gccuwPpieukhgATnbUCCAOtbjcOYgL2QwBw7lsYAobgA8sgoB4xL0hs5Bi1XG4Tx4qLWARS4KgIAh4GAgg+Igb1HK53Eva9pwTWBUDgAEEG3Xd90PVxiSCCg0JvEh6lxcBCTvR8xxcFAWWwN87TABAvDuBA0KAm86JtZJJVuB4TzEEobnuR44WmPYDlJY5WKgE9XneJitUDA0KLObjRMhaFYVDaZhPYi5-mEypQ1qKNoJgWCAWoBCd2JPcDyPNCMIArCjhKQiwJI2lyK0SjqNogD6P-QDiBvdkkmRbAMj875hL-SofIk-09NU84pQ07itJFW09OweznAAJTRP5iJpHAbOC-1kgUmE-xc2S2LACEoRhMIKCSwqYDeW4-xisTbjqhqYHDf0AoybBlLNEVzTgCAYFAmJHLyyMjD0rQDlKYykPM1CAKsoIbJwxoCVsqlxpGTCqBcqiaMY4CYHQEAk2JP0khYuTYs4zTeN2fZZhOVqmthSLpk5I4yta4rYRu-0pMNAHqswAaI1tGKOPih5EumHSZtnGAQC0LQrSpRDTOQizVswsRNrxfC7L2lb1qob9dDAKlJuwYG7oquGuIR57bsdUBTFKMQAAZQ34t6hPutqvoK5IudpnAxElnnVRgMgoalLkvFl6WGNQGmoGB21QZgcHFKV7qVPulmnu06aZy4GZ+FQOyccgPGKbWjacS20ndvvfbrKpzXueZWlGcdWH1NZnjQ0lNXxRIfmRUFwSPvE8WkijmWtel+XFfqpJftV9PxRcEhqe5nXtT1g2YSN7P9dN0PzaGy2YzjYm8JgAF+E3Lxa1wEB4IdsyUKp7AhDQBkoF-GBCDCFHrbgagifmnAvAM4c7C98c4Fqo4aPpzy7hgTOt7c3eIv3m9Wyg8tu1TXt14HAJgh8Vt2y7Ssb7vJ9766Lx0cxuZV-Jl4dAW9n4vyvm-asfZWhf0fvkW2JQAHryASAycVQgA
// The following fails with npm run test, since we started using tsx instead of ts-node
// export {
//   TPushable,
//   TTransIteratorSyncOrAsync,
//   TNextFnResult,
//   TThenable,
// } from "./types.js";
// I am unable to reproduce it in a test project, so for now we'll export everything from ./types.js
__exportStar(require("./types.js"), exports);
__exportStar(require("./util/index.js"), exports);
__exportStar(require("./interface/index.js"), exports);
__exportStar(require("./operators/index.js"), exports);
//# sourceMappingURL=index.js.map