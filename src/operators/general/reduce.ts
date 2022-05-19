import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * The reduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. The final result of running the reducer across all elements of the array is a
 * single value, so the ouput iterator will only produce 1 result before finishing.
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(reduce({ reducer: (acc, cur) => acc + cur, initialValue: 0 }) // => [ 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
const reduce = itr8OperatorFactory<
  any,
  any,
  { index: number, accumulator: any, done: boolean },
  {
    reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any,
    initialValue: any,
  }
>(
  (nextIn, state, params) => {
    if (state.done) { return { done: true }; }

    const acc = state.index === 0 ? params.initialValue : state.accumulator;

    if (nextIn.done) {
      return { done: false, value: acc, state: { ...state, done: true } }
    }

    return thenable(params.reducer(acc, nextIn.value, state.index))
      .then((reduced) => ({
          done: false,
          state: {
            ...state,
            index: state.index + 1,
            accumulator: reduced,
          }
        })
      ).src;

    // const reduced = params.reducer(acc, nextIn.value, state.index);
    // if (isPromise(reduced)) {
    //   return (async () => ({
    //     done: false,
    //     state: {
    //       ...state,
    //       index: state.index + 1,
    //       accumulator: await reduced,
    //     }
    //   }))();
    // }

    // // synchronous
    // return {
    //   done: false,
    //   state: {
    //     ...state,
    //     index: state.index + 1,
    //     accumulator: reduced,
    //   }
    // };
  },
  () => ({ index: 0, accumulator: undefined, done: false }),
);

export {
  reduce,
}
