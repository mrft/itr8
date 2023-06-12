/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
declare const delay: <TIn>(timeout: number) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { delay };
