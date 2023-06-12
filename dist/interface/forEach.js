"use strict";
/**
 * forEach is the one that will actually start 'draining' the iterator.
 * (itr8ToArray and most other itr8To... methods as well)
 *
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEach = void 0;
const util_1 = require("../util");
/**
 * produces a function that can be applied to an iterator and that will execute
 * the handler on each value.
 *
 * The handler can be asynchronous!
 * By default the next will only be handled when the current handler has finished.
 * If you set options.concurrency to a higher value, you are allowing multiple handlers
 * to run in parallel.
 * But the next() will already be called while the (async) handler is still handling the current
 * result, which optimizes things by not waiting for the processing to finish, before asking for
 * the next one. Instead we'll first be asking for the next one, and then start processing of the
 * current one. This will waste less time than using 'for await (... of ...)' while still
 * processing things in the expected order!
 *
 * @param handler
 * @param options: ```{ concurrency: number }``` will control how many async handler are alowed to run in parallel. Default: 1
 * @returns
 *
 * @category interface/standard
 */
const forEach = function (handler, options) {
    return (it) => {
        const maxRunningHandlers = (options === null || options === void 0 ? void 0 : options.concurrency) || 1;
        const runningHandlers = new Set();
        const waitForOpenSpot = async () => {
            // wait for an open spot if the max amount of running handlers is reached
            if (runningHandlers.size >= maxRunningHandlers) {
                try {
                    await Promise.race(runningHandlers);
                }
                catch (e) {
                    // ignore this we only want to know there is an open spot again
                }
            }
        };
        const addToRunningHandlersList = (handlerPossiblePromise) => {
            // add it to the running handlers list
            runningHandlers.add(handlerPossiblePromise);
            handlerPossiblePromise.finally(() => {
                runningHandlers.delete(handlerPossiblePromise);
            });
        };
        const nextPromiseOrValue = it.next();
        if ((0, util_1.isPromise)(nextPromiseOrValue)) {
            const nextPromise = nextPromiseOrValue;
            const handleNext = async (nextValue) => {
                await waitForOpenSpot();
                // TODO: add a try catch so errors can be handled properly?
                // or maybe we should leave it to the user???
                const handlerPossiblePromise = handler(nextValue);
                if ((0, util_1.isPromise)(handlerPossiblePromise)) {
                    addToRunningHandlersList(handlerPossiblePromise);
                }
            };
            return (async () => {
                let next = (await nextPromise);
                while (!next.done) {
                    await handleNext(next.value);
                    next = await it.next();
                }
                // wait until all remaining handlers are done before resolving the current promise!
                await Promise.all(runningHandlers);
            })();
        }
        else {
            let next = nextPromiseOrValue;
            if (!next.done) {
                const handlerPossiblePromise = handler(next.value);
                if ((0, util_1.isPromise)(handlerPossiblePromise)) {
                    return (async () => {
                        let handlerPossiblePromiseIn = handlerPossiblePromise;
                        while (!next.done) {
                            await waitForOpenSpot();
                            // TODO: add a try catch so errors can be handled properly?
                            // or maybe we should leave it to the user???
                            const handlerPromise = handlerPossiblePromiseIn ||
                                handler(next.value);
                            handlerPossiblePromiseIn = undefined;
                            addToRunningHandlersList(handlerPromise);
                            next = it.next();
                        }
                        // wait until all remaining handlers are done before resolving the current promise!
                        await Promise.all(runningHandlers);
                    })();
                }
                else {
                    next = it.next();
                    while (!next.done) {
                        handler(next.value);
                        next = it.next();
                        // console.log('[forEach] next', next);
                    }
                }
            }
        }
    };
};
exports.forEach = forEach;
//# sourceMappingURL=forEach.js.map