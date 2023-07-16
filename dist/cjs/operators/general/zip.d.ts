/**
 * The zip() operator outputs tuples containing 1 element from the first and
 * one element from the second iterator. The first iterator is leading, so when
 * the first iterator is done, the output iterator is done. When the second iterator
 * is 'shorter', the tuples will contain undefined as the second element.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      zip(itr8FromArray([ 'a', 'b', 'c', 'd' ]), // => [ [1, 'a'], [2, 'b'], [3, 'c'], [4, 'd' ] ]
 *    );
 * ```
 *
 * @param secondIterator
 *
 * @category operators/general
 */
declare const zip: <TIn>(secondIterator: Iterator<any> | AsyncIterator<any>) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { zip };
