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

export * from './forEach';

export * from './itr8FromArray';

export * from './itr8FromArrayAsync';

export * from './itr8FromIterable';

export * from './itr8FromIterator';

export * from './itr8FromSingleValue';

export * from './itr8FromSingleValueAsync';

export * from './itr8FromString';

export * from './itr8FromStringAsync';

export * from './itr8Interval';

export * from './itr8Pushable';

export * from './itr8Range';

export * from './itr8RangeAsync';

export * from './itr8ToArray';

export * from './itr8ToObject';

export * from './itr8ToString';

export * from './itr8ToMultiIterable';
