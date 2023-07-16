import { powerMap } from "../general/powerMap.js";

/**
 * On every item, output the percentile(x) so far
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(1,10),
 *      percentile(50),  // => [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5 ]
 *    );
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningPercentile = (percentage: number) =>
  powerMap<number, number, { count: number; topArray: number[] }>(
    (nextIn, state) => {
      if (nextIn.done) return { done: true };
      const newCount = state.count + 1;
      const newTopArraySize =
        Math.floor(((100 - percentage) / 100) * newCount) + 1;
      const newTopArray = [...state.topArray, nextIn.value];
      newTopArray.sort((a, b) => a - b);
      while (newTopArraySize < newTopArray.length) {
        newTopArray.shift();
      }
      // console.log('value', nextIn.value, 'percentage', percentage, 'count', state.count, 'newTopArraySize', newTopArraySize, 'state.topArray', state.topArray);
      return {
        done: false,
        state: { ...state, count: newCount, topArray: newTopArray },
        value: newTopArray[0],
      };
    },
    () => ({ count: 0, topArray: [] })
  );

export { runningPercentile };
