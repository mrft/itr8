import { powerMap } from "../general/powerMap.js";

/**
 * Output the average.
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,100),
 *      average(),  // => [ 50 ]
 *    );
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const average = () =>
  powerMap<number, number, { done: boolean; count: number; sum: number }>(
    (nextIn, state) => {
      if (state.done) return { done: true };
      if (nextIn.done)
        return {
          done: false,
          value: state.sum / state.count,
          state: { ...state, done: true },
        };
      const newCount = state.count + 1;
      const newSum = state.sum + nextIn.value;
      return { done: false, state: { ...state, count: newCount, sum: newSum } };
    },
    () => ({ done: false, count: 0, sum: 0 })
  );

export { average };
