/**
 * Only keep elements where the filter function returns true.
 *
 * The filter function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @category operators/general
 */
declare const filter: <TIn>(filterFn: (v: TIn) => boolean) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { filter };
