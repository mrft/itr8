/**
 * Skip the first elements as long as the filter function returns true,
 * and return all the others unchanged.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([1, 2, 3, 4, 1, 2, 6]),
 *      skipWhile(x => x < 4), // => [4, 1, 2, 6]
 *    );
 * ```
 *
 * @param whileFn a fuction that returns true as long as elements should be dropped
 *
 * @category operators/general
 */
declare const skipWhile: <TIn>(whileFn: (v: TIn) => boolean | Promise<boolean>) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { skipWhile };
