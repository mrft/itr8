/**
 * The reduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. The final result of running the reducer across all elements of the array is a
 * single value, so the ouput iterator will only produce 1 result before finishing.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      reduce((acc, cur) => acc + cur, 0),
 *    );
 *    // => [ 10 ]
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
declare const reduce: <TIn, TOut>(reducer: (accumulator: TOut, currentValue: TIn, presentIndex?: number) => TOut | Promise<TOut>, initialValue: TOut) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TOut>;
export { reduce };
