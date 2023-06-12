/**
 * Takes all strings from the input and outputs them as single characters
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', 'world' ]),
 *      stringToChar(), // => [ 'h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd' ]
 *    );
 * ```
 *
 * @category operators/strings
 */
declare const stringToChar: () => import("../../types").TTransIteratorSyncOrAsync<string, string>;
export { stringToChar };
