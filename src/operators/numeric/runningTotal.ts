import { itr8OperatorFactory } from "../../util/index";

/**
 * On every item, output the total so far.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(runningTotal())  // => [ 1, 3, 6, 10 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const runningTotal = itr8OperatorFactory<number, number, void, number>(
  (nextIn: IteratorResult<any>, state: number) => {
    if (nextIn.done) {
      return { done: true };
    }
    const newTotal = state + nextIn.value;
    return { done: false, value: newTotal, state: newTotal };
  },
  () => 0,
);

export {
  runningTotal,
}
