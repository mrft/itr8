import { itr8OperatorFactory } from "../../util/index";

/**
 * Group the incoming elements so the output iterator will return arrays/tuples of a certain size.
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4, 5, 6 ])
 *      .pipe(groupPer(2)) // => [ [1, 2], [3, 4], [5, 6] ]
 * ```
 *
 * @category operators/general
 */
const groupPer = itr8OperatorFactory<any, any, { done: boolean, buffer: any[] }, number>(
  (nextIn: IteratorResult<any>, state: { done: boolean, buffer: any[] }, batchSize: number) => {
    if (state.done || nextIn.done && state.buffer.length === 0) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.buffer, state: { done: true, buffer: [] } };
    } else if (state.buffer.length + 1 === batchSize) {
      return { done: false, value: [...state.buffer, nextIn.value], state: { done: false, buffer: [] } };
    }
    return { done: false, state: { ...state, buffer: [...state.buffer, nextIn.value] } };
  },
  () => ({ done: false, buffer: [] }),
);

export {
  groupPer,
}
