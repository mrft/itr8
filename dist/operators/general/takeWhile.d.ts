/**
 * Only take elements as long as the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
declare const takeWhile: <TIn>(filterFn: (x: TIn) => boolean | Promise<boolean>) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { takeWhile };
