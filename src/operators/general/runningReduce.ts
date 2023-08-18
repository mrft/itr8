import { thenable } from "../../util/index.js";
import { powerMap } from "./powerMap.js";

/**
 * The runnigReduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. Eaxch next call produces the result of running the reducer across all elements so far.
 * (called scan in RxJS)
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      reduce((acc, cur) => acc + cur, 0),
 *    );
 *    // => [ 1, 3, 6, 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducer
 * @param initialValue: value passed as 'accumulator' on the very first call to the reducer function
 *
 * @category operators/general
 */
const runningReduce = <TIn, TOut>(
  reducer: (
    accumulator: TOut,
    currentValue: TIn,
    presentIndex?: number,
  ) => TOut | Promise<TOut>,
  initialValue: TOut,
) =>
  powerMap<TIn, TOut, { index: number; accumulator: TOut; done?: true }>(
    (nextIn, state) => {
      if (state.done) {
        return { done: true };
      }

      const acc = state.index === 0 ? initialValue : state.accumulator;

      if (nextIn.done) {
        return { done: true, value: acc, state };
      }

      return thenable(reducer(acc, nextIn.value, state.index)).then(
        (reduced) => ({
          done: false,
          value: reduced,
          state: {
            ...state,
            index: state.index + 1,
            accumulator: reduced,
          },
        }),
      ).src;
    },
    () => ({ index: 0, accumulator: initialValue }),
  );

export { runningReduce };
