"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tap = void 0;
const powerMap_1 = require("./powerMap");
/**
 * Tap will run a function 'on the side' without while passing the iterator
 * unchanged to the next.
 *
 * @param fn
 *
 * @category operators/general
 */
const tap = (tapFn) => (0, powerMap_1.powerMap)((nextIn, _state) => {
    if (nextIn.done) {
        return { done: true };
    }
    else {
        try {
            tapFn(nextIn.value);
        }
        catch (e) {
            console.warn("Tap function caused an exception", e, e.stack);
        }
        return { done: false, value: nextIn.value };
    }
}, () => undefined);
exports.tap = tap;
//# sourceMappingURL=tap.js.map