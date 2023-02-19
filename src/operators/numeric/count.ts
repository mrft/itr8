import { itr8OperatorFactory } from "../../util/index";

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
const count = itr8OperatorFactory<number, number, { done: boolean, count: number }, void>(
  (nextIn: IteratorResult<any>, state: { done: boolean, count: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.count, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, count: state.count + 1 } };
  },
  () => ({ done: false, count: 0 }),
);

export {
  count,
}
