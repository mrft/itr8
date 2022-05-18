import { itr8OperatorFactory, thenable } from "../../util/index";

/**
 * The runnigReduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. Eaxch next call produces the result of running the reducer across all elements so far.
 * (called scan in RxJS)
 *
 * @example
 * ```typescript
 *    itr8FromArray([ 1, 2, 3, 4 ])
 *      .pipe(reduce({ reducer: (acc, cur) => acc + cur, initialValue: 0 }) // => [ 1, 3, 6, 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducerAndInitValue: an object of the form { initialValue: any, reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any }
 *
 * @category operators/general
 */
const runningReduce = itr8OperatorFactory<
 any,
 any,
 {
   reducer: (accumulator:any, currentValue:any, presentIndex?: number) => any,
   initialValue: any,
 },
 { index: number, accumulator: any, done?: true }
>(
 (nextIn, state, params) => {
   if (state.done) { return { done: true }; }

   const acc = state.index === 0 ? params.initialValue : state.accumulator;

   if (nextIn.done) {
     return { done: true, value: acc, state };
   }

   return thenable(params.reducer(acc, nextIn.value, state.index))
     .then((reduced) => ({
         done: false,
         value: reduced,
         state: {
           ...state,
           index: state.index + 1,
           accumulator: reduced,
         }
       }),
     )
     .src;
 },
 () => ({ index: 0, accumulator: undefined }),
);

export {
  runningReduce,
}
