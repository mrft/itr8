import { powerMap } from "../general/powerMap.js";

/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      runningTotal(),  // => [ 1, 3, 6, 10 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningTotal = () =>
  powerMap<number, number, number>(
    (nextIn, state) => {
      if (nextIn.done) {
        return { done: true };
      }
      const newTotal = state + nextIn.value;
      return { done: false, value: newTotal, state: newTotal };
    },
    () => 0,
  );

export { runningTotal };
