import { powerMap } from "../general/powerMap.js";

/**
 * Output a single thing which is the number of elements returned by the incoming iterator.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 7, 4 ]),
 *      count(), // => [ 4 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const count = () =>
  powerMap<unknown, number, { done: boolean; count: number }>(
    (nextIn, state) => {
      if (state.done) {
        return { done: true };
      } else if (nextIn.done) {
        return {
          done: false,
          value: state.count,
          state: { ...state, done: true },
        };
      }
      return { done: false, state: { ...state, count: state.count + 1 } };
    },
    () => ({ done: false, count: 0 }),
  );

export { count };
