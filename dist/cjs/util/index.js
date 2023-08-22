"use strict";
/**
 * Utility functions that are used internally, but that can be used by anyone to
 * help create operators that support both synchronous and asynchronous parameters
 * (by using thenable, forLoop or isPromise).
 *
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.forLoop = exports.doAfterFactory = exports.doAfter = exports.thenableFactory = exports.thenable = exports.AsyncFunction = exports.isPromise = exports.pipe = exports.itr8Pipe = exports.compose = void 0;
// THIS MIGHT BE AN ALTERNATIVE TO REMOVE THE DEPENDENCY to Node's uil/types
////////////////////////////////////////////////////////////////////////////
/**
 * Check whether the parameter is a promise.
 *
 * @param p
 * @returns true if p is a promise
 *
 * @category util
 */
const isPromise = function isPromise(p) {
    return (p !== undefined &&
        p !== null &&
        Object.prototype.toString.call(p) === "[object Promise]");
};
exports.isPromise = isPromise;
// import { isPromise } from 'util/types'
// try {
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   isPromise = require('util/types').isPromise;
// } catch {
//   // ignore
// }
/**
 * Shim for allowing async function creation similar to new Function.
 *
 * Found here: https://davidwalsh.name/async-function-class
 *
 * @example
 * ```javascript
 * const fetchPage = new AsyncFunction("url", "return await fetch(url);");
 * ```
 */
const AsyncFunction = Object.getPrototypeOf(async function () {
    /* empty */
}).constructor;
exports.AsyncFunction = AsyncFunction;
/**
 * (Word play on then-able an th-enable)
 *
 * This utility function makes sure that any value (Promise or otherwise)
 * will be turned into an object with a then property, so that we can write the same code
 * regardless of whether the input is sync or async, but guaranteeing that
 * if the input is sync, all operations will also be called synchronously.
 *
 * The original input object is available under the thenable(...).src property.
 *
 * After the then callback has finished, the Object's 'value' property will be set
 * to the 'resolved' value.
 *
 * @example
 * ```typescript
 * // the same code can be applied without changes to a promise or a non promise
 * // by doing it all in the then-callback
 * thenable(123)
 *  .then(
 *    (v) => {
 *      console.log(v);
 *      return getSomeOtherSyncOrAsyncVal(v);
 *    }
 *  )
 *  .then(
 *    (otherVal) => {
 *      console.log(otherVal);
 *      return getYetAnotherVal(v);
 *    }
 *  )
 * ```
 *
 * ???
 * MAYBE a better solution would be to have a function called ```doAfter(value, (value) => { your code })```
 * that checks whether it is a promise or not, and returns the result of the handler?
 * But without the pipe operator it would be a pain to chain them, unless it will return an object
 * with some properties like ```{ result, doAfter:... }```
 * or maybe thenable should always return a new object with properties ```{ src, then, finally, ... }``` so
 * that the interface resembles a promise, but if we need the actual promise or value
 * we should simply call src?
 *
 * @param x a Promise or a regular value
 * @returns an object that has a then function and a src property pointing to the original input
 *          regardless whether it is a Promise or not
 *
 * @category util
 */
const thenable = (x) => {
    if (isPromise(x)) {
        // console.log(`[thenable] ASYNC: ${x}`);
        const newX = {
            src: x,
            then: (...args) => thenable(x.then(...args)),
        };
        // make sure the value gets added to this object after the promise resolves
        x.then((value) => (newX["value"] = value));
        return newX;
    }
    else {
        // console.log(`[thenable] SYNC: ${x}`);
        if (typeof (x === null || x === void 0 ? void 0 : x.then) === "function") {
            return x;
        }
        else {
            // needed, because in strict mode it is impossble to set a property
            // on a string primitive (and in non-strict mode the set value cannot be read again)
            const newX = {
                src: (x === null || x === void 0 ? void 0 : x.src) !== undefined ? x.src : x,
                then: (okHandler) => {
                    const retVal = thenable(okHandler(x, true));
                    retVal["value"] = retVal.src;
                    return retVal;
                },
                value: x,
            };
            return newX;
        }
    }
};
exports.thenable = thenable;
/**
 * After I created the thenable function, my code became easier, because I could write
 * the same code regardless whether the input was synchronous or asynchronous.
 * But by wrapping something with thenable, the check whether it was a Promise or not
 * was done on every invocation.
 *
 * In a library that is about iterators, we expect this to be called many times.
 * So it feels like it could make sense to create a version that 'remembers'
 * the conclusions from the first run, and that will use that knowledge in the second run
 * (assuming that every next element in an iterator will be a promise if the first was a promise
 * and vice versa)
 *
 * A few tests seemed to indicate that calling isPromise often if about 10x slower than
 * checking if a variable is true or false (or is a specific symbol), so there should be
 * gain to be made with this.
 *
 * @example
 * ```@typescript
 * // instead of
 * for (x of [1, 2, 3]) {
 *   thenable(x).then((v) => console.log(v));
 * }
 * // do something like
 * const cachedThenable = thenableFactory(1);
 * for (x of [1, 2, 3]) {
 *   cachedThenable(x).then((v) => console.log(v))
 * }
 * ```
 *
 * @param x a simple value or a promise, for which you need to execute some code
 * @returns a thenable(...)-like function that has assumptions built-in based on the first x
 */
const thenableFactory = (y) => {
    let cachedThenable;
    let firstRun = true;
    if (isPromise(y)) {
        // console.log(`[thenableFactory] ASYNC: ${y}`);
        // let genericThenAsync = (x: Promise<T>, ...args) => {
        //   const thenResult = x.then(...args);
        //   if (firstRun) {
        //     firstRun = false;
        //     cachedThenable = thenableFactory(thenResult);
        //     genericThenAsync = (x2: Promise<T>, ...args) => cachedThenable(x2.then(...args));
        //   }
        //   return cachedThenable(thenResult);
        // };
        return function asyncThenable(x) {
            const newX = {
                src: x,
                then: (...args) => {
                    if (firstRun) {
                        firstRun = false;
                        const thenResult = x.then(...args);
                        cachedThenable = thenableFactory(thenResult);
                        return cachedThenable(thenResult);
                    }
                    return cachedThenable(x.then(...args));
                },
            };
            // make sure the value gets added to this object after the promise resolves
            x.then((value) => (newX["value"] = value));
            return newX;
        };
        // .bind({}); // needed for 'this' to work
    }
    else {
        // console.log(`[thenableFactory] SYNC: ${y}`);
        // let genericThenSync = (x: T, okHandler: (v: unknown, isSync?: boolean) => unknown) => {
        //   if (firstRun) {
        //     firstRun = false;
        //     // console.log(`[thenableFactory] set cached thenable = ${okHandlerResult}`);
        //     cachedThenable = thenableFactory(okHandlerResult);
        //     // overwrite genericThenSync with a version that does not need to check anymore
        //     genericThenSync = (x2: T, okHandler2: (v: unknown, isSync?: boolean) => unknown) => {
        //       const retVal2 = cachedThenable(okHandler2(x2, true));
        //       // console.log(`genericThenSync ${x2} -> ${retVal2.value}`);
        //       retVal2["value"] = retVal2.src;
        //       return retVal2;
        //     };
        //   }
        //   const retVal = cachedThenable(okHandlerResult);
        //   retVal["value"] = retVal.src;
        //   return retVal;
        // };
        return function syncThenable(x) {
            firstRun = true;
            if (typeof (x === null || x === void 0 ? void 0 : x.then) === "function") {
                return x;
            }
            else {
                // needed, because in strict mode it is impossble to set a property
                // on a string primitive (and in non-strict mode the set value cannot be read again)
                const newX = {
                    src: (x === null || x === void 0 ? void 0 : x.src) !== undefined ? x.src : x,
                    then: (okHandler) => {
                        if (firstRun) {
                            firstRun = false;
                            // console.log(`[thenableFactory] set cached thenable = ${okHandlerResult}`);
                            const okHandlerResult = okHandler(x, true);
                            cachedThenable = thenableFactory(okHandlerResult);
                            const retVal = cachedThenable(okHandlerResult);
                            retVal["value"] = retVal.src;
                            return retVal;
                        }
                        const retVal = cachedThenable(okHandler(x, true));
                        retVal["value"] = retVal.src;
                        return retVal;
                    },
                    value: x,
                };
                return newX;
            }
        };
        // .bind({}); // needed for 'this' to work
    }
};
exports.thenableFactory = thenableFactory;
/**
 * doAfter() will create another function that expects a singoe argument which could either be
 * a simple value or a promise, and doAfter will make sure that the given function is executed
 * synchronously if it's a simple value, or asynchronously after the promise resolves.
 *
 * Like thenable, but trying to avoid the creation of all the intermediate objects.
 * With our pipe function, it should be easy to use.
 *
 * @example
 * ```
 *  pipe(
 *    promiseOrValue,
 *    doAfter((v) => { do sync or async stuff with v and return the result }),
 *    doAfter((w) => { do sync or async stuff and return the result }),
 *  )
 * ```
 */
const doAfter = (f) => {
    return (valueOrPromise) => {
        return isPromise(valueOrPromise)
            ? valueOrPromise.then(f)
            : f(valueOrPromise);
    };
};
exports.doAfter = doAfter;
/**
 * Like doAfter, but remembers whether the sync or the async route should be chosen
 * based on the first call.
 * This could speed up things by avoiding repeated isPromise calls.
 * @example
 * ```typescript
 *  const incrementAfter = doAfterFactory((n) => n + 1);
 *  const doubleAfter = doAfterFactory((n) => n * 2);
 *
 * for (let i = 1; i <= 1_000_000; i++) {
 *  pipe(
 *    i,
 *    incrementAfter,
 *    doubleAfter,
 *    toArray,
 *  );
 * }
 * ```
 * @param f
 * @returns
 */
const doAfterFactory = (f) => {
    // let first = true;
    // let isAsync;
    const doAfterObj = {
        asyncDoAfter: async (valueOrPromise) => f(await valueOrPromise),
        syncDoAfter: f,
        doAfter: (valueOrPromise) => {
            if (isPromise(valueOrPromise)) {
                doAfterObj.doAfter = doAfterObj.asyncDoAfter;
            }
            else {
                doAfterObj.doAfter = doAfterObj.syncDoAfter;
            }
            return doAfterObj.doAfter(valueOrPromise);
        },
    };
    return doAfterObj;
    // return (valueOrPromise: TIn | Promise<TIn>) => {
    //   if (first) {
    //     isAsync = isPromise(valueOrPromise);
    //   }
    //   return isAsync ? (valueOrPromise as Promise<TIn>).then(f) : f(valueOrPromise as TIn);
    // };
};
exports.doAfterFactory = doAfterFactory;
/**
 * This utility function will do a for loop, synchronously if all the parts are synchronous,
 * and asynchronously otherwise.
 * This should help us to use the same code yet supporting both possible scenarios.
 *
 * @param initialStateFactory
 * @param testBeforeEach
 * @param afterEach
 * @param codeToExecute
 * @returns void | Promise<void>
 *
 * @category util
 */
const forLoop = (initialStateFactory, testBeforeEach, afterEach, codeToExecute) => {
    // if we assume that thenable will return true as the second argument of the callbacks
    // when we are still synchronous, we can write this with thenable I think
    return thenable(initialStateFactory()).then((initialState, isSyncInit) => {
        return thenable(testBeforeEach(initialState)).then((testResult, isSyncTest) => {
            // this should work, both for sync and async stuff, so that we don't get the indentation-of-hell issue?
            if (testResult) {
                return thenable(codeToExecute(initialState)).then((_, isSyncBody) => {
                    return thenable(afterEach(initialState)).then((firstStateAfterEach, isSyncAfterBody) => {
                        if (isSyncInit && isSyncTest && isSyncBody && isSyncAfterBody) {
                            // everything is synchronous so we can do a synchronous for loop
                            let state = firstStateAfterEach;
                            while (testBeforeEach(state)) {
                                codeToExecute(state);
                                state = afterEach(state);
                            }
                            return state;
                        }
                        else {
                            // naive implementation: something is asynchronous so we can to do an asychronous for loop
                            // return (async () => {
                            //   let state = firstStateAfterEach;
                            //   while (await testBeforeEach(state)) {
                            //     await codeToExecute(state);
                            //     state = await afterEach(state);
                            //   }
                            //   return state;
                            // })();
                            // await on a non-promise will still break execution and turns
                            // the value into Promise.resolve(...))
                            // SO can we only await if it's necessary?
                            // 2^3 = 8 possible (ignoring the generation of initial state) combinations
                            // with and without await
                            // Luckily new Function('a', 'b', 'return a + b;'); will produce a function
                            // from a string and some clever guy found a way to create an AsyncFunction
                            // equivalent of that!
                            // So using isSyncInit, isSyncTest, isSyncBody, isSyncAfterBody to decide
                            // whether a value shouldbe awaited, we can solve it like this
                            return new AsyncFunction("firstStateAfterEach", "testBeforeEach", "codeToExecute", "afterEach", `
                    let state = firstStateAfterEach;
                    while (${isSyncTest ? "" : "await "}testBeforeEach(state)) {
                      ${isSyncBody ? "" : "await "}codeToExecute(state);
                      state = ${isSyncAfterBody ? "" : "await "}afterEach(state);
                    }
                    return state;
                  `)(firstStateAfterEach, testBeforeEach, codeToExecute, afterEach);
                        }
                    });
                });
            }
            else {
                return initialState;
            }
        });
    });
};
exports.forLoop = forLoop;
function compose(first, ...params) {
    if (params.length === 0) {
        return first;
    }
    else {
        return params.reduce((acc, cur) => {
            return (arg) => cur(acc(arg));
        }, first);
    }
}
exports.compose = compose;
exports.itr8Pipe = compose;
function pipe(input, fn1, ...functionsToApply) {
    if (functionsToApply.length === 0) {
        return fn1(input);
    }
    else {
        const composedFn = functionsToApply.reduce((acc, cur) => {
            return (arg) => cur(acc(arg));
        }, fn1);
        return composedFn(input);
    }
}
exports.pipe = pipe;
//# sourceMappingURL=index.js.map