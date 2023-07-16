"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
const powerMap_js_1 = require("../general/powerMap.js");
/**
 * Only useful on async iterators.
 *
 * Wait for x milliseconds of 'no events' before firing one.
 * So an event will either not be handled (busy period),
 * or handled after the calm period (so with a delay of x milliseconds)
 *
 * @category operators/timeBased
 */
const debounce = (cooldownMilliseconds) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    const newState = Date.now();
    const timePassed = newState - state;
    if (timePassed > cooldownMilliseconds) {
        return { done: false, value: nextIn.value, state: newState };
    }
    return { done: false, state: newState };
}, () => -Infinity);
exports.debounce = debounce;
//# sourceMappingURL=debounce.js.map