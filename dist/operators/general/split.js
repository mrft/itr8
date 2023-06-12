"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.split = void 0;
const powerMap_1 = require("./powerMap");
/**
 * like string.split => output arrays of elements and use the given parameter as a delimiter
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 'hello', '|', 'world' ]),
 *      split('|'), // => [ ['hello'], ['world'] ]
 *    );
 * ```
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, true, 2, 3, true, 4 ]),
 *      split(true), // => [ [1], [2,3], [4] ]
 *    );
 * ```
 *
 * @category operators/general
 */
const split = (delimiter) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (nextIn.done) {
        if (state === null) {
            return { done: true };
        }
        return { done: false, value: state, state: null };
    }
    else if (nextIn.value === delimiter) {
        return { done: false, value: state || [], state: [] };
    }
    return {
        done: false,
        state: [...(state === null ? [] : state), nextIn.value],
    };
}, () => null);
exports.split = split;
//# sourceMappingURL=split.js.map