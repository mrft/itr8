import { itr8OperatorFactory } from "../../util/index";

/**
 * Output a single thing containing the sum of all values.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(total()) // => [ 10 ]
 * ```
 *
 * @param amount
 *
 * @category operators/numeric
 */
const total = itr8OperatorFactory<number, number, void, { done: boolean, total: number }>(
  (nextIn: IteratorResult<any>, state: { done: boolean, total: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.total, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, total: state.total + nextIn.value } };
  },
  () => ({ done: false, total: 0 }),
);


export {
  total,
}
