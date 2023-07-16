/**
 * Only useful on async iterators.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 *
 * @category operators/timeBased
 */
declare const throttle: <TIn>(throttleMilliseconds: number) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { throttle };
