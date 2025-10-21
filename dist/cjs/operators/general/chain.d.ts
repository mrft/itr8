/**
 * Chain the argument iterator after the incoming iterator.
 *
 * It will also work when one iterator is synchronous and the other one is
 * asynchronous!
 *
 * @example
 * ```ts
 * const chained = pipe(
 *  itr8Range(1, 3),
 *  chain(itr8Range(4, 6))
 * );
 *
 * // chained yields: 1, 2, 3, 4, 5, 6
 * ```
 *
 * @param secondIterator The iterator to chain after the incoming iterator
 * @returns An iterator that yields all values from the first iterator, then all
 * values from the second iterator
 * @category operators/general
 */
declare const chain: <TIn>(secondIterator: Iterator<TIn, any, undefined> | AsyncIterator<TIn, any, undefined>) => (firstIterator: Iterator<TIn, any, undefined> | AsyncIterator<TIn, any, undefined>) => IterableIterator<TIn> | AsyncIterableIterator<TIn>;
export { chain };
