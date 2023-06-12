/**
 * Skip the 'amount' first elements and return all the others unchanged.
 *
 * @param amount
 *
 * @category operators/general
 */
declare const skip: <TIn>(params?: number) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { skip };
