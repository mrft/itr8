/**
 * Translate each element into something else by applying the supplied mapping function
 * to each element.
 *
 * The mapping function can be asynchronous (in which case the resulting iterator will be
 * asynchronous regardless of the input iterator)!
 *
 * @param fn
 *
 * @category operators/general
 */
declare const map: <TIn, TOut>(mapFn: (v: TIn) => TOut | Promise<TOut>) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TOut>;
export { map };
