/**
 * The interface module contains all helper functions to interface from or to
 * other representations.
 * This means simple data representations like arrays, objecs, Sets, Maps, strings, ...
 * but it also contains a few 'generators' that produce an iterator based on some
 * input parameters (like itr8Range and itr8Interval).
 *
 * Last but not least, it contains forEach which is 'the' tool to actually start
 * pulling items off of the iterator, and to initiate actions based on the data
 * they provide.
 *
 * REMARK: all interface functions that have dependencies (RxJS, NodeJS streams, ...) have been moved
 * to itr8/peer, which keeps this part of the library dependency-free, and theoretically usable
 * both in the browser and from NodeJS.
 *
 * This module will export ALL interface functions.
 *
 * @Example
 * ```
 * import { interfaceFn } from 'itr8'
 * ```
 *
 * You can also import more specifically what you need:
 * ```
 * import { interfaceFn } from 'itr8/interface/interfaceFn'
 * ```
 *
 * You can also import all interface functions with
 * ```
 * import { interfaceFn } from 'itr8/interface'
 * ```
 *
 * @module
 */
export * from "./forEach.js";
export * from "./itr8FromArray.js";
export * from "./itr8FromArrayAsync.js";
export * from "./itr8FromImpureFunction.js";
export * from "./itr8FromIterable.js";
export * from "./itr8FromSingleValue.js";
export * from "./itr8FromSingleValueAsync.js";
export * from "./itr8FromString.js";
export * from "./itr8FromStringAsync.js";
export * from "./itr8Interval.js";
export * from "./itr8Pushable.js";
export * from "./itr8Range.js";
export * from "./itr8RangeAsync.js";
export * from "./itr8ToArray.js";
export * from "./itr8ToObject.js";
export * from "./itr8ToString.js";
export * from "./itr8ToMultiIterable.js";
//# sourceMappingURL=index.js.map