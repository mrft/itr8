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
declare const groupPer: <TIn>(groupSize: number) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn[]>;
export { groupPer };
