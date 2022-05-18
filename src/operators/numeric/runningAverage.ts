import { itr8OperatorFactory } from "../../util/index";

/**
 * On every item, output the average so far
 * @example
 * ```typescript
 *    itr8Range(1,10)
 *      .pipe(runningAverage())  // => [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
 * ```
 *
 * @param it
 * @param amount
 *
 * @category operators/numeric
 */
const runningAverage = itr8OperatorFactory<number, number, void, { done: boolean, count: number, sum: number }>(
  (nextIn, state, params) => {
    if (nextIn.done) return { done: true };
    const newCount = state.count + 1;
    const newSum = state.sum + nextIn.value;
    return { done: false, state: { ...state, count: newCount, sum: newSum }, value: newSum / newCount };
  },
  () => ({ done: false, count: 0, sum: 0 }),
);

export {
  runningAverage,
}
