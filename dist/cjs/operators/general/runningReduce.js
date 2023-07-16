"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningReduce = void 0;
const index_js_1 = require("../../util/index.js");
const powerMap_js_1 = require("./powerMap.js");
/**
 * The runnigReduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. Eaxch next call produces the result of running the reducer across all elements so far.
 * (called scan in RxJS)
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      reduce((acc, cur) => acc + cur, 0),
 *    );
 *    // => [ 1, 3, 6, 10 ]
 * ```
 *
 * The reduce function can be an asynchronous function (in which case the resulting
 * iterator will be asynchronous regardless of the input iterator)!
 *
 * @param reducer
 * @param initialValue: value passed as 'accumulator' on the very first call to the reducer function
 *
 * @category operators/general
 */
const runningReduce = (reducer, initialValue) => (0, powerMap_js_1.powerMap)((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    const acc = state.index === 0 ? initialValue : state.accumulator;
    if (nextIn.done) {
        return { done: true, value: acc, state };
    }
    return (0, index_js_1.thenable)(reducer(acc, nextIn.value, state.index)).then((reduced) => ({
        done: false,
        value: reduced,
        state: {
            ...state,
            index: state.index + 1,
            accumulator: reduced,
        },
    })).src;
}, () => ({ index: 0, accumulator: initialValue }));
exports.runningReduce = runningReduce;
//# sourceMappingURL=runningReduce.js.map