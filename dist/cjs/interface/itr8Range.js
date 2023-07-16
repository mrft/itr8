"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itr8Range = void 0;
const itr8FromIterator_js_1 = require("./itr8FromIterator.js");
/**
 * Utility function that produces an iterator producing numbers (not only integers)
 * starting and ending where you want, which is useful for trying out stuff
 * without manually having to create arrays.
 *
 * * 'from' can be higher than 'to', in which case the iterator will count down
 * * 'step' is always a positive number (but we are forgiving if it's not)
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8Range(0, 3)
 *      itr8ToArray,
 *    ) // => [0, 1, 2, 3]
 *
 *    pipe(
 *      itr8Range(0, 10, 3)
 *      itr8ToArray,
 *    ) // => [0, 3, 6, 9]
 *
 *    pipe(
 *      itr8Range(5, 1, 2)
 *      itr8ToArray,
 *    ) // => [5, 3, 1]
 * ```
 *
 * @param start start index
 * @param end end index
 * @param end step size, default = 1
 *
 * @category interface/standard
 */
function itr8Range(from, to, step) {
    const stepValue = step !== undefined ? Math.abs(step) : 1;
    const upwards = from < to;
    return (0, itr8FromIterator_js_1.itr8FromIterator)((function* () {
        if (upwards) {
            for (let i = from; i <= to; i = i + stepValue) {
                yield i;
            }
        }
        else {
            for (let i = from; i >= to; i = i - stepValue) {
                yield i;
            }
        }
    })());
}
exports.itr8Range = itr8Range;
//# sourceMappingURL=itr8Range.js.map