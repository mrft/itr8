"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
const powerMap_1 = require("../general/powerMap");
/**
 * Simply delay every element by the given nr of milliseconds.
 * (Will always produce an async iterator!).
 *
 * @category operators/timeBased
 */
const delay = (timeout) => (0, powerMap_1.powerMap)((nextIn, _state) => {
    return new Promise((resolve /*, reject*/) => {
        setTimeout(() => resolve(nextIn), timeout);
    });
}, () => undefined);
exports.delay = delay;
//# sourceMappingURL=delay.js.map