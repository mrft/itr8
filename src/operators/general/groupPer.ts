import { powerMap } from "./powerMap";

/**
 * Group the incoming elements so the output iterator will return arrays/tuples of a certain size.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      groupPer(2), // => [ [1, 2], [3, 4], [5, 6] ]
 *    );
 * ```
 *
 * @category operators/general
 */
const groupPer = <TIn>(groupSize: number) =>
  powerMap<TIn, Array<TIn>, { done: boolean; buffer: Array<TIn> }>(
    (nextIn, state) => {
      if (state.done || (nextIn.done && state.buffer.length === 0)) {
        return { done: true };
      } else if (nextIn.done) {
        return {
          done: false,
          value: state.buffer,
          state: { done: true, buffer: [] },
        };
      } else if (state.buffer.length + 1 === groupSize) {
        return {
          done: false,
          value: [...state.buffer, nextIn.value],
          state: { done: false, buffer: [] },
        };
      }
      return {
        done: false,
        state: { ...state, buffer: [...state.buffer, nextIn.value] },
      };
    },
    () => ({ done: false, buffer: [] })
  );

export { groupPer };
