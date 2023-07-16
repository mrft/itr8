/**
 * Turns an iterator into a single string.
 * The strings will simply be 'glued' together, so if you need a separator,
 * use interperse first.
 *
 * It is the equivalent of Array.join('').
 *
 * @example
 * ```typescript
 *  pipe(
 *    itr8FromArray(['Hello', 'Goodbye']),
 *    intersperse(' / '), // adds | between every 2 elements
 *    itr8ToString,
 *  ) // => 'Hello / Goodbye'
 *
 *  const alphabet = pipe(
 *    itr8Range(0, 25),
 *    map((i: number) => String.fromCharCode("A".charCodeAt(0) + i)),
 *    itr8ToString
 *  ); // => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
 * ```
 *
 * @param iterator
 * @returns a string
 *
 * @category interface/standard
 */
declare function itr8ToString<T>(iterator: Iterator<T> | AsyncIterator<T>): string | Promise<string>;
export { itr8ToString };
