/**
 * Turns an itr8 into an object. It is like Object.fromEntries,
 * but it will work both for synchronous and asynchronous iterators
 *
 * @example
 * ```typescript
 *  // synchronous, same as Object.fromEntries(...)
 *  const myObj = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 *
 *  // asynchronous
 *  await myObj2 = pipe(
 *      itr8FromIterable([['a', 'value of A'], ['b', 'value of B'], ['c', 'value of C']]),
 *      delay(100),     // delay every element by 100 milliseconds
 *      itr8ToObject,
 *    ) // => {
 *      //      a: 'value of A',
 *      //      b: 'value of B',
 *      //      c: 'value of C',
 *      // }
 * ```
 *
 * @param iterator
 * @returns an array
 *
 * @category interface/standard
 */
declare function itr8ToObject<TK extends string | number | symbol, TV>(iterator: Iterator<[TK: string | number | symbol, TV: unknown]> | AsyncIterator<[TK: string | number | symbol, TV: any]>): Record<TK, TV> | Promise<Record<TK, TV>>;
export { itr8ToObject };
