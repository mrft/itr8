import { powerMap } from "../general/powerMap";

/**
 * Output a single thing containing the sum of all values.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      total(), // => [ 10 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const total = () =>
  powerMap<number, number, { done: boolean; total: number }>(
    (nextIn, state) => {
      if (state.done) {
        return { done: true };
      } else if (nextIn.done) {
        return {
          done: false,
          value: state.total,
          state: { ...state, done: true },
        };
      }
      return {
        done: false,
        state: { ...state, total: state.total + nextIn.value },
      };
    },
    () => ({ done: false, total: 0 })
  );

export { total };
