"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = void 0;
const powerMap_1 = require("../general/powerMap");
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
const throttle = (throttleMilliseconds) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        return { done: true };
    }
    const now = Date.now();
    if (now - state > throttleMilliseconds) {
        return { done: false, value: nextIn.value, state: now };
    }
    return { done: false, state };
}, () => -Infinity);
exports.throttle = throttle;
//# sourceMappingURL=throttle.js.map