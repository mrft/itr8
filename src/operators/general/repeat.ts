import { powerMap } from "./powerMap.js";

/**
 * Repeat the entire iterator the given amount.
 * If the amount is zero (or negative), you'll end up with an empty iterator.
 *
 * BEWARE: In order to be able to repeat everything, the entire collection must be kept in memory
 * (as opposed to repeatEach where only a single element needs to be stored).
 *
 * @example
 * ```typescript
 * pipe(
 *     itr8FromArray([ 'hello', 'world' ]),
 *     repeat(2)
 *   ) // => [ 'hello', 'world', 'hello', 'world' ]
 * ```
 * @example
 * ```typescript
 * // creating an indentation function is easy (even if it's 0)
 * function getIndentation(indentationLevel, tabSize = 2) {
 *   const singleTab = pipe(
 *      itr8FromSingleValue(' '),
 *      repeat(tabSize),
 *      itr8ToSTring,
 *   );
 *   return pipe(
 *     itr8FromSingleValue(singleTab)
 *     repeat(indentationLevel),
 *     itr8ToSTring,
 *   );
 * }
 * getIndentation(3); // => '      ' (6 spaces)
 * ```
 *
 * @category operators/general
 */
const repeat = <TIn>(count = 2) =>
  powerMap<TIn, TIn, { list: Array<TIn>; remaining: number }>(
    (nextIn, { list, remaining }) => {
      if (remaining <= 0) {
        return { done: true };
      }

      if (nextIn.done) {
        return {
          done: false,
          iterable: list,
          state: { list, remaining: remaining - 1 },
        };
      }

      return {
        done: false,
        value: nextIn.value,
        state: { list: list.concat(nextIn.value), remaining },
      };
    },
    () => ({ list: [], remaining: count - 1 }),
  );

export { repeat };
