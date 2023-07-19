/**
 * forEach is the one that will actually start 'draining' the iterator.
 * (itr8ToArray and most other itr8To... methods as well)
 *
 * @module
 */
import { isPromise } from "../util/index.js";
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
 * @param options: ```{ concurrency: number }``` will control how many async handler are allowed to run in parallel. Default: 1
 * @returns
 *
 * @category interface/standard
 */
const forEach = function (handler, options) {
    return (it) => {
        let throwCount = 0;
        const maxRunningHandlers = options?.concurrency || 1;
        const runningHandlers = new Set();
        const waitForOpenSpot = async () => {
            // wait for an open spot if the max amount of running handlers is reached
            if (runningHandlers.size >= maxRunningHandlers) {
                await Promise.race(runningHandlers);
            }
        };
        const addToRunningHandlersList = (handlerPossiblePromise) => {
            // add it to the running handlers list
            runningHandlers.add(handlerPossiblePromise);
            handlerPossiblePromise.finally(() => {
                runningHandlers.delete(handlerPossiblePromise);
            });
        };
        /** Make sure the handler is wrapped in try/catch in order to send the right signals to the
         * input iterator in case something goes wrong!
         */
        const tryHandler = (v) => {
            try {
                const handlerPossiblePromise = handler(v);
                if (isPromise(handlerPossiblePromise)) {
                    handlerPossiblePromise.catch((e) => {
                        if (throwCount < 1) {
                            try {
                                it.throw?.(e);
                            }
                            catch (throwErr) {
                                // native implementation crashes?
                                // console.log(v, 'ERROR WHILE THROWING', throwErr);
                            }
                            throwCount += 1;
                        }
                    });
                }
                return handlerPossiblePromise;
            }
            catch (e) {
                if (throwCount < 1) {
                    try {
                        it.throw?.(e);
                    }
                    catch (throwErr) {
                        // native implementation crashes?
                        // console.log(v, 'ERROR WHILE THROWING', throwErr);
                    }
                    throwCount += 1;
                }
                throw e;
            }
        };
        const nextPromiseOrValue = it.next();
        if (isPromise(nextPromiseOrValue)) {
            const nextPromise = nextPromiseOrValue;
            const handleNext = async (nextValue) => {
                await waitForOpenSpot();
                const handlerPossiblePromise = tryHandler(nextValue);
                if (isPromise(handlerPossiblePromise)) {
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
                it.return?.(next.value);
            })();
        }
        else {
            let next = nextPromiseOrValue;
            if (next.done) {
                it.return?.(next.value);
            }
            else {
                const handlerPossiblePromise = tryHandler(next.value);
                if (isPromise(handlerPossiblePromise)) {
                    return (async () => {
                        let handlerPossiblePromiseIn = handlerPossiblePromise;
                        while (!next.done) {
                            const handlerPromise = handlerPossiblePromiseIn /* only the very first time */ ||
                                tryHandler(next.value);
                            handlerPossiblePromiseIn = undefined;
                            addToRunningHandlersList(handlerPromise);
                            next = it.next();
                            await waitForOpenSpot();
                        }
                        // wait until all remaining handlers are done before resolving the current promise!
                        await Promise.all(runningHandlers);
                        it.return?.(next.value);
                    })();
                }
                else {
                    next = it.next();
                    while (!next.done) {
                        tryHandler(next.value);
                        next = it.next();
                        // console.log('[forEach] next', next);
                    }
                    it.return?.(next.value);
                }
            }
        }
    };
};
export { forEach };
//# sourceMappingURL=forEach.js.map