"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupPer = void 0;
const powerMap_1 = require("./powerMap");
/**
 * Group the incoming elements so the output iterator will return arrays/tuples of a certain size.
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4, 5, 6 ]),
 *      groupPer(2), // => [ [1, 2], [3, 4], [5, 6] ]
 *    );
 * ```
 *
 * @category operators/general
 */
const groupPer = (groupSize) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (state.done || (nextIn.done && state.buffer.length === 0)) {
        return { done: true };
    }
    else if (nextIn.done) {
        return {
            done: false,
            value: state.buffer,
            state: { done: true, buffer: [] },
        };
    }
    else if (state.buffer.length + 1 === groupSize) {
        return {
            done: false,
            value: [...state.buffer, nextIn.value],
            state: { done: false, buffer: [] },
        };
    }
    return {
        done: false,
        state: { ...state, buffer: [...state.buffer, nextIn.value] },
    };
}, () => ({ done: false, buffer: [] }));
exports.groupPer = groupPer;
//# sourceMappingURL=groupPer.js.map