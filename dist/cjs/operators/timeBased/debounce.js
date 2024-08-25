"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * Mainly useful on async iterators (for example generated from a stream of events), but see below for other options.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * The second parameter can be used if the timestamps can be calculated from the values on the input iterator
 * (by default Date.now() will be used).
 * This makes it possible to use this operator on synchronous iterators as well!
 *
 * @example
 * ```typescript
 * // imagine a stream of values fired at this pace onto an asyncIterator called itIn:
 * // 1, wait 10ms, 2, 3, wait 30ms, 4, wait 10ms, 5, wait 10ms, 6, 7, 8, 9, wait 40ms, 10
 * const result = await pipe(itIn, debounce(20), itr8ToArray);
 * // => [1, 4, 10]
 *
 * const valuesWithTimestamps = [
 *    { value: 1, timestamp: 0 },
 *    { value: 2, timestamp: 10 },
 *    { value: 3, timestamp: 10 },
 *    { value: 4, timestamp: 40 },
 *    { value: 5, timestamp: 50 },
 *    { value: 6, timestamp: 60 },
 *    { value: 7, timestamp: 60 },
 *    { value: 8, timestamp: 60 },
 *    { value: 9, timestamp: 60 },
 *    { value: 10, timestamp: 100 },
 * ];
 *
 * // or get the timestamp from the input values
 * const result = await pipe(
 *    itr8FromIterable(valuesWithTimestamps),
 *    debounce(20, ([_v, ts]) => ts),           // debounce with function that gets timestamp from input
 *    map(([v, _ts]) => v),                     // only keep values
 *    itr8ToArray,
 * );
 * // => [1, 4, 10]
 * ```
 *
 * @category operators/timeBased
 */
const debounce = (cooldownMilliseconds, getTimestamp = (_value) => Date.now()) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    const newState = getTimestamp(nextIn.value);
    const timePassed = newState - state;
    if (timePassed > cooldownMilliseconds) {
        return { done: false, value: nextIn.value, state: newState };
    }
    return { done: false, state: newState };
}, () => -Infinity);
exports.debounce = debounce;
//# sourceMappingURL=debounce.js.map