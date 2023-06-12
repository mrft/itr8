/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * @category operators/timeBased
 */
declare const debounce: <TIn>(cooldownMilliseconds: number) => import("../../types").TTransIteratorSyncOrAsync<TIn, TIn>;
export { debounce };
