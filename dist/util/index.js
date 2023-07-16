/**
 * Utility functions that are used internally, but that can be used by anyone to
 * help create operators that support both synchronous and asynchronous parameters
 * (by using thenable, forLoop or isPromise).
 *
 * @module
 */
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
 * or maybe thenable should always return a new object with poerties ```{ src, then, finally, ... }``` so
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
        const newX = {
            src: x,
            then: (...args) => thenable(x.then(...args)),
        };
        // make sure the value gets added to this object after the promise resolves
        x.then((value) => (newX["value"] = value));
        return newX;
    }
    else {
        if (typeof x?.then === "function") {
            return x;
        }
        else {
            // needed, because in strict mode it is impossble to set a property
            // on a string primitive (and in non-strict mode the set value cannot be read again)
            const newX = {
                src: x?.src !== undefined ? x.src : x,
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
/*export*/ function itr8Pipe(first, ...params) {
    if (params.length === 0) {
        return first;
    }
    else {
        return params.reduce((acc, cur) => {
            return (arg) => cur(acc(arg));
        }, first);
    }
}
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
export { 
/**
 * @deprecated Use compose(...) instead!
 */
compose as itr8Pipe, compose, pipe, isPromise, AsyncFunction, thenable, forLoop,
// itr8OperatorFactory,
 };
//# sourceMappingURL=index.js.map