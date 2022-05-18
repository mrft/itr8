/**
 * The interface/standard module contains helper functions to interface from or to
 * simple data representations like arrays, objecs, Sets, Maps, strings, ...
 * but it also contains a few 'generators' that produce an iterator based on some
 * input parameters (like itr8Range and itr8Interval).
 *
 * Last but not least, it contains forEach which is 'the' tool to start
 * pulling items of off the iterator, and to initiate actions based on the data
 * they provide.
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

export * from './itr8ToMultiIterable';
