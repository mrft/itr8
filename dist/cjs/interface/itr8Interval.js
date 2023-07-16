"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8Interval = void 0;
const itr8Pushable_js_1 = require("./itr8Pushable.js");
/**
 * Returns a (pushable async) iterator that will automatically fire with the Date.now() value
 * of when it fired (= the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC).
 *
 * When you want it to stop, call the done() method of the returned iterator, and the interval
 * will be cleaned up.
 *
 * @param intervalMilliseconds
 * @returns an AsyncIterableIterator
 *
 * @category interface/standard
 */
function itr8Interval(intervalMilliseconds) {
    const it = (0, itr8Pushable_js_1.itr8Pushable)(Infinity); // infinite buffer !!!
    const interval = setInterval(() => {
        it.push(Date.now());
    }, intervalMilliseconds);
    const origDone = it.done;
    it.done = () => {
        clearInterval(interval);
        return origDone();
    };
    return it;
}
exports.itr8Interval = itr8Interval;
//# sourceMappingURL=itr8Interval.js.map