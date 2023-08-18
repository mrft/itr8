import { powerMap } from "./powerMap.js";

/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', '|', 'world' ]),
 *      split('|'), // => [ ['hello'], ['world'] ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, true, 2, 3, true, 4 ]),
 *      split(true), // => [ [1], [2,3], [4] ]
 *    );
 * ```
 *
 * @category operators/general
 */
const split = <TIn>(delimiter) =>
  powerMap<TIn, TIn, TIn[] | null>(
    (nextIn, state) => {
      if (nextIn.done) {
        if (state === null) {
          return { done: true };
        }
        return { done: false, value: state, state: null };
      } else if (nextIn.value === delimiter) {
        return { done: false, value: state || [], state: [] };
      }
      return {
        done: false,
        state: [...(state === null ? [] : state), nextIn.value],
      };
    },
    () => null,
  );

export { split };
