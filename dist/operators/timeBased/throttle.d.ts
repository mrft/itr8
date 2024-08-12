/**
 * Mainly useful on async iterators (for example generated from a stream of events), but see below for other options.
 *
 * Only throw events at most every x milliseconds.
 *
 * So when a few events happen quickly in succession, only the first one will be handled,
 * and the next ones will be ignored until enough time (x ms) has passed with
 * the previously handled event.
 *
 * The second parameter can be used if the timestamps can be calculated from the values on the input iterator
 * (by default Date.now() will be used).
 * This makes it possible to use this operator on synchronous iterators as well!
 *
 * @example
 * ```typescript
 * // imagine a stream of values fired at this pace onto an asyncIterator called itIn:
 * // 1, wait 5ms, 2, 3, wait 15ms, 4, wait 5ms, 5, wait 5ms, 6wait 10ms, 7wait 5ms, 8

 * const result = await pipe(itIn, throttle(15), itr8ToArray);
 * // => [1, 4, 7]
 *
 * const valuesWithTimestamps = [
 *    { value: 1, timestamp: 0 },
 *    { value: 2, timestamp: 5 },
 *    { value: 3, timestamp: 5 },
 *    { value: 4, timestamp: 20 },
 *    { value: 5, timestamp: 25 },
 *    { value: 6, timestamp: 30 },
 *    { value: 7, timestamp: 40 },
 *    { value: 8, timestamp: 45 },
 * ];
 *
 * // or get the timestamp from the input values
 * const result = await pipe(
 *    itr8FromIterable(valuesWithTimestamps),
 *    throttle(15, ([_v, ts]) => ts),           // throttle with function that gets timestamp from input
 *    map(([v, _ts]) => v),                     // only keep values
 *    itr8ToArray,
 * );
 * // => [1, 4, 7]
 * ```
 * @category operators/timeBased
 */
declare const throttle: <TIn>(throttleMilliseconds: number, getTimestamp?: (_value: TIn) => number) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, TIn>;
export { throttle };
