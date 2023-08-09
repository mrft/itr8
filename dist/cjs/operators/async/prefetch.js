"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefetch = void 0;
const index_js_1 = require("../../util/index.js");
/**
 * Probably only useful on async iterators.
 *
 * Instead of only asking for the next value of the incoming iterator when a next call comes in,
 * make sure to do one or more next calls to the incoming iterator up-front, to decrease the
 * waiting time.
 *
 * This can be used to kind of 'parallelize' the processing, while respecting the order.
 * If the order is not important, you might want to take a look a the parallel(...) operator!
 *
 * This one can be useful, when the result needs to do some I/O (for example an API get
 * or a DB fetch), and processing also takes up a certain amount of time due to I/O.
 * In this case, it makes sense to already do the next call on the incoming iterator up-front,
 * so that it will hopefully already have resolved by the time you need it for processing.
 *
 * Nothing will be done before the first next call, but after the first next call the iterator
 * will always try to have a buffer with the given amount of prefetched results (which will be
 * impossible to achieve if processing is generally faster than fetching).
 *
 * forEach actually by default acts like it has a prefetch of 1, but imagine a case where the
 * processing time can vary significantly. Then, when processing takes a long time, by prefetching
 * more than one you can make sure that there is no waiting time for the next (maybe very fast)
 * processing to start because the promises they act upon are already resolved by the time they
 * are needed.
 *
 * @category operators/async
 */
const prefetch = (amount) => {
    return (it) => {
        let inputs = [];
        let isAsyncInput;
        const addInputIfNeeded = async () => {
            if (inputs.length < amount) {
                if (isAsyncInput && inputs.length > 0)
                    await inputs[0];
                const next = it.next();
                if ((0, index_js_1.isPromise)(next)) {
                    // console.log('     add another (async) input, current nr of inputs = ', inputs.length, ' < ', amount);
                    isAsyncInput = true;
                    next.then((n) => {
                        if (!n.done) {
                            // console.log('  then: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
                            addInputIfNeeded();
                        }
                    });
                }
                inputs.push(next);
            }
        };
        const retVal = {
            [Symbol.asyncIterator]: () => retVal,
            [Symbol.iterator]: () => retVal,
            next: () => {
                // console.log('  next: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
                addInputIfNeeded();
                if (inputs.length > 0) {
                    const [firstInput, ...remainingInputs] = inputs;
                    inputs = remainingInputs;
                    // console.log('  next: call 2 to addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
                    addInputIfNeeded();
                    // console.log('  next: return ', firstInput);
                    return firstInput;
                }
                return isAsyncInput
                    ? Promise.resolve({ done: true, value: undefined })
                    : { done: true, value: undefined };
            },
        };
        return retVal;
    };
};
exports.prefetch = prefetch;
//# sourceMappingURL=prefetch.js.map