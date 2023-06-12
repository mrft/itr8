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
declare const runningReduce: <TIn, TOut>(reducer: (accumulator: TOut, currentValue: TIn, presentIndex?: number) => TOut | Promise<TOut>, initialValue: TOut) => import("../../types").TTransIteratorSyncOrAsync<TIn, TOut>;
export { runningReduce };
