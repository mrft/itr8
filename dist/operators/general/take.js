"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.take = void 0;
const powerMap_1 = require("./powerMap");
/**
 * Only take 'amount' elements and then stop.
 *
 * (Beware: if the source is an Observable or a stream, it will not know that we stopped,
 * so the buffer will keep building up. The observable or stream should be closed by the user!)
 *
 * @param amount
 *
 * @category operators/general
 */
const take = (count = Infinity) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done)
        return { done: true };
    if (state < count) {
        const newState = state + 1;
        return {
            done: false,
            value: nextIn.value,
            state: newState,
            isLast: newState == count,
        };
    }
    return { done: true };
}, () => 0);
exports.take = take;
//# sourceMappingURL=take.js.map