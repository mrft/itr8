"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduce = void 0;
const index_1 = require("../../util/index");
const powerMap_1 = require("./powerMap");
/**
 * The reduce() method executes a user-supplied "reducer" callback function on each element of
 * the iterator, in order, passing in the return value from the calculation on the preceding
 * element. The final result of running the reducer across all elements of the array is a
 * single value, so the ouput iterator will only produce 1 result before finishing.
 *
 * @example
 * ```typescript
 *    pipe(
 *      itr8FromArray([ 1, 2, 3, 4 ]),
 *      reduce((acc, cur) => acc + cur, 0),
 *    );
 *    // => [ 10 ]
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
const reduce = (reducer, initialValue) => (0, powerMap_1.powerMap)((nextIn, state) => {
    if (state.done) {
        return { done: true };
    }
    const acc = state.accumulator;
    if (nextIn.done) {
        return { done: false, value: acc, state: { ...state, done: true } };
    }
    return (0, index_1.thenable)(reducer(acc, nextIn.value, state.index)).then((reduced) => ({
        done: false,
        state: {
            ...state,
            index: state.index + 1,
            accumulator: reduced,
        },
    })).src;
    // const reduced = params.reducer(acc, nextIn.value, state.index);
    // if (isPromise(reduced)) {
    //   return (async () => ({
    //     done: false,
    //     state: {
    //       ...state,
    //       index: state.index + 1,
    //       accumulator: await reduced,
    //     }
    //   }))();
    // }
    // // synchronous
    // return {
    //   done: false,
    //   state: {
    //     ...state,
    //     index: state.index + 1,
    //     accumulator: reduced,
    //   }
    // };
}, () => ({ index: 0, accumulator: initialValue, done: false }));
exports.reduce = reduce;
//# sourceMappingURL=reduce.js.map