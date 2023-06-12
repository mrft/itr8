/**
 * The input must be a stream of characters or strings,
 * and the output will be 1 string for each line.
 * \n is used as the default line separator, but you can pass any string as a parameter
 * to be used as the line separator!
 *
 * @example
 * ```typescript
 *    // simplest case: an iterator of single characters
 *    pipe(
 *      itr8FromArray([ 'h', 'e', 'l', 'l', 'o', '\n', 'w', 'o', 'r', 'l', 'd' ]),
 *      lineByLine(), // => [ 'hello', 'world' ]
 *    );
 *
 *    // second case: an iterator of string chunks
 *    pipe(
 *      itr8FromArray(['Hel', 'lo\nWorld\n\nGo', 'od', 'by', 'e', '\nSpace', '!']),
 *      lineByLine(), // => ['Hello', 'World', '', 'Goodbye', 'Space!'];
 *    );
 *
 *    // thrid case: the newline separator is something else than \n
 *    pipe(
 *      itr8FromArray(['Hel', 'lo<br>>World<br><br>Go', 'od', 'by', 'e', '<br>Space', '!']),
 *      lineByLine(), // => ['Hello', 'World', '', 'Goodbye', 'Space!'];
 *    );
 * ```
 * @param {string} separator: the string that will be considered the newline sequence
 * @category operators/strings
 */
declare const lineByLine: (splitBy?: string) => import("../../types").TTransIteratorSyncOrAsync<string, string>;
export { lineByLine };
