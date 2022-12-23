import { itr8OperatorFactory } from "../../util/index";

/**
 * Repeat each element of the iterator for the given amount.
 * If the amount is zero (or negative), you'll end up with an empty iterator.
 *
 * @example
 * ```typescript
 * itr8FromArray([ 'hello', 'world' ])
 *   .pipe(
 *     repeatEach(2)
 *   ) // => [ 'hello', 'hello', 'world', 'world' ]
 * ```
 * @example
 * ```typescript
 * // creating an indentation function is easy (even if it's 0)
 * function getIndentation(indentationLevel, tabSize = 2) {
 *   const singleTab = itr8FromSingleValue(' ')
 *     .pipe(repeatEach(tabSize), itr8ToSTring);
 *   return itr8FromSingleValue(singleTab)
 *     .pipe(
 *       repeatEach(indentationLevel),
 *       itr8ToSTring,
 *     )
 * };
 * getIndetation(3); // => '      ' (6 spaces)
 * ```
 *
 * @category operators/general
 */
const repeatEach = itr8OperatorFactory<number, unknown, void, number>(
  (nextIn, _state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
    };
  },
  () => undefined,
);

export {
  repeatEach,
}
