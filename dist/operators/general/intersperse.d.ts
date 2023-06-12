/**
 * Intersperse the the argument bewteen each element of the iterator.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', 'world', 'and', 'goodbye' ]),
 *      intersperse('|'), // => [ [ 'hello', '|', 'world', '|', 'and', '|', 'goodbye' ] ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      intersperse(true), // => [ 1, true, 2, true, 3, true, 4 ]
 *    );
 * ```
 *
 * @category operators/general
 */
declare const intersperse: (intersperseThing: unknown) => import("../../types").TTransIteratorSyncOrAsync<unknown, unknown>;
export { intersperse };
