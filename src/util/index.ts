/**
 * Utility functions that are used internally, but that can be used by anyone to
 * help create operators that support both synchronous and asynchronous parameters
 * (by using thenable, forLoop or isPromise).
 *
 * @module
 */

// https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLjAVwLYCMCmAnA2gXRgF4ZcBGAGhgCYqBmKgFnwG4AoUSWdBabASzABzAsVIBycJnFVxUAO4gZcgBbZM02QDMQybONZs2W5GGBR+4GFBABJKDjg3sAHgAqAPgAUiAILZsOABPdw8ASgR7R2dQmABvNhgkmHUoPTB4XABlIIwQABsAOn4HQOd8LzD2AF8jEzMLKxLokGw3EH9AkM8vZrLWyNKnVtCIzuDYhOSYfMxYdQhkfNgSAnZp2dgwdeT5FX5ZmC8AQi8Mkj7h7EKwTAAPKEqwwoATKTD4xOnkhaWoQoADsgICozoUAG5wfLITBVL5JWrTVLpFKYRbLGpGYymcyWMAAKhScGEmC80Dg2CgSDQWGwVEwYBe1IwOA+U2S-C0R3JlJgLhgDJebPh3x02COmxg-DEPKgLClfJIgvl-AA1Krhd8tTAgvxMPkXlKdlrEclqgL8hBMJ9tTAxRK5gqSLKVTAPErGSqALRezW25K6-WG-jG76mhFsWpsAD00ZgnAgBUwhXyICEXlwhSzgRJXgYAHYwvg4bH4+BE7MU2mM1nCjmhKSAKwUahFuFGUsJpNV9OXZztcZBLw2KL9bA+MKT9gccuwPpieukhgATnbUCCAOtbjcOYgL2QwBw7lsYAobgA8sgoB4xL0hs5Bi1XG4Tx4qLWARS4KgIAh4GAgg+Igb1HK53Eva9pwTWBUDgAEEG3Xd90PVxiSCCg0JvEh6lxcBCTvR8xxcFAWWwN87TABAvDuBA0KAm86JtZJJVuB4TzEEobnuR44WmPYDlJY5WKgE9XneJitUDA0KLObjRMhaFYVDaZhPYi5-mEypQ1qKNoJgWCAWoBCd2JPcDyPNCMIArCjhKQiwJI2lyK0SjqNogD6P-QDiBvdkkmRbAMj875hL-SofIk-09NU84pQ07itJFW09OweznAAJTRP5iJpHAbOC-1kgUmE-xc2S2LACEoRhMIKCSwqYDeW4-xisTbjqhqYHDf0AoybBlLNEVzTgCAYFAmJHLyyMjD0rQDlKYykPM1CAKsoIbJwxoCVsqlxpGTCqBcqiaMY4CYHQEAk2JP0khYuTYs4zTeN2fZZhOVqmthSLpk5I4yta4rYRu-0pMNAHqswAaI1tGKOPih5EumHSZtnGAQC0LQrSpRDTOQizVswsRNrxfC7L2lb1qob9dDAKlJuwYG7oquGuIR57bsdUBTFKMQAAZQ34t6hPutqvoK5IudpnAxElnnVRgMgoalLkvFl6WGNQGmoGB21QZgcHFKV7qVPulmnu06aZy4GZ+FQOyccgPGKbWjacS20ndvvfbrKpzXueZWlGcdWH1NZnjQ0lNXxRIfmRUFwSPvE8WkijmWtel+XFfqpJftV9PxRcEhqe5nXtT1g2YSN7P9dN0PzaGy2YzjYm8JgAF+E3Lxa1wEB4IdsyUKp7AhDQBkoF-GBCDCFHrbgagifmnAvAM4c7C98c4Fqo4aPpzy7hgTOt7c3eIv3m9Wyg8tu1TXt14HAJgh8Vt2y7Ssb7vJ9766Lx0cxuZV-Jl4dAW9n4vyvm-asfZWhf0fvkW2JQAHryASAycVQgA

import { TThenable } from "../types.js";

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
const isPromise = function isPromise(p: unknown): p is Promise<unknown> {
  return (
    p !== undefined &&
    p !== null &&
    Object.prototype.toString.call(p) === "[object Promise]"
  );
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
const thenable = <T>(x: T): TThenable<T> => {
  if (isPromise(x)) {
    const newX = {
      src: x,
      then: (...args) => thenable(x.then(...args)),
    };
    // make sure the value gets added to this object after the promise resolves
    x.then((value) => (newX["value"] = value));
    return newX;
  } else {
    if (typeof (x as any)?.then === "function") {
      return x as unknown as TThenable;
    } else {
      // needed, because in strict mode it is impossble to set a property
      // on a string primitive (and in non-strict mode the set value cannot be read again)
      const newX = {
        src: (x as any)?.src !== undefined ? (x as any).src : x,
        then: (okHandler: (v: unknown, isSync?: boolean) => unknown) => {
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
const forLoop = <State>(
  initialStateFactory: () => State | Promise<State>,
  testBeforeEach: (a: State) => boolean | Promise<boolean>,
  afterEach: (a: State) => State | Promise<State>,
  codeToExecute: (a: State) => void | Promise<void>
) => {
  // if we assume that thenable will return true as the second argument of the callbacks
  // when we are still synchronous, we can write this with thenable I think
  return thenable(initialStateFactory()).then((initialState, isSyncInit) => {
    return thenable(testBeforeEach(initialState)).then(
      (testResult, isSyncTest) => {
        // this should work, both for sync and async stuff, so that we don't get the indentation-of-hell issue?
        if (testResult) {
          return thenable(codeToExecute(initialState)).then((_, isSyncBody) => {
            return thenable(afterEach(initialState)).then(
              (firstStateAfterEach, isSyncAfterBody) => {
                if (isSyncInit && isSyncTest && isSyncBody && isSyncAfterBody) {
                  // everything is synchronous so we can do a synchronous for loop
                  let state = firstStateAfterEach;
                  while (testBeforeEach(state)) {
                    codeToExecute(state);
                    state = afterEach(state);
                  }
                  return state;
                } else {
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
                  return new AsyncFunction(
                    "firstStateAfterEach",
                    "testBeforeEach",
                    "codeToExecute",
                    "afterEach",
                    `
                    let state = firstStateAfterEach;
                    while (${isSyncTest ? "" : "await "}testBeforeEach(state)) {
                      ${isSyncBody ? "" : "await "}codeToExecute(state);
                      state = ${
                        isSyncAfterBody ? "" : "await "
                      }afterEach(state);
                    }
                    return state;
                  `
                  )(
                    firstStateAfterEach,
                    testBeforeEach,
                    codeToExecute,
                    afterEach
                  );
                }
              }
            );
          });
        } else {
          return initialState;
        }
      }
    );
  });
};

/**
 * Produce a new (parameterless) itr8 that is the combination of all the itr8 params
 *
 * Maybe We could allow the first element to either be a TTransIterator or just an iterator?
 * As long as the final output is an iterator?
 *
 * @param params a list of transIterators
 *
 * @category util
 */
// function compose<TIn=any,TOut=any>(
//   first:TTransIteratorSyncOrAsync,
//   ...params:Array<TTransIteratorSyncOrAsync>
// ):TTransIteratorSyncOrAsync<TIn, TOut> {
//   const [second, ...rest] = params;
//   return second
//     ? compose((it:Iterator<any>) => itr8FromIterator(second(first(it))), ...rest)
//     : (it:Iterator<any>) => itr8FromIterator(first(it));
//   ;
// }

/**
 * A more generic pipe function that takes multiple functions as input
 * and outputs a single function where input = input of the first function
 * and output = output where every funtion has been applied to the output of the previous on.
 *
 * So itr8Pipe(f1:(x:A)=>B, f2:(x:B)=>C, f3:(x:C)=>D) returns (a:A):D => f3(f2(f1(a)))
 *
 * @param first
 * @param params
 * @returns
 *
 * @deprecated see compose (and pipe)
 */
function itr8Pipe<A, B>(fn1: (x: A) => B): (x: A) => B;
function itr8Pipe<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C;
function itr8Pipe<A, B, C, D>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D
): (x: A) => D;
function itr8Pipe<A, B, C, D, E>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E
): (x: A) => E;
/*export*/ function itr8Pipe<A = any, B = any>(
  first: (x: A) => B,
  ...params: Array<(any) => any>
): any {
  if (params.length === 0) {
    return first;
  } else {
    return params.reduce<(any) => any>((acc, cur) => {
      return (arg) => cur(acc(arg));
    }, first);
  }
}

/**
 * A generic compose function that takes multiple functions as input
 * and outputs a single function where input = input of the first function
 * and output = output where every funtion has been applied to the output of the previous one.
 *
 * So
 * ```typescript
 * compose(f1:(x:A)=>B, f2:(x:B)=>C, f3:(x:C)=>D)
 * ```
 * will return a single unary function
 * ```typescript
 * (a:A):D => f3(f2(f1(a)))
 * ```
 *
 * @param first
 * @param params
 * @returns
 */
function compose<A, B>(fn1: (x: A) => B): (x: A) => B;
function compose<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C;
function compose<A, B, C, D>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D
): (x: A) => D;
function compose<A, B, C, D, E>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E
): (x: A) => E;
function compose<A, B, C, D, E, F>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F
): (x: A) => F;
function compose<A, B, C, D, E, F, G>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G
): (x: A) => G;
function compose<A, B, C, D, E, F, G, H>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn7: (x: G) => H
): (x: A) => H;
function compose<A, B, C, D, E, F, G, H, I>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn8: (x: G) => H,
  fn7: (x: H) => I
): (x: A) => I;
function compose<A, B, C, D, E, F, G, H, I, J>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn7: (x: G) => H,
  fn8: (x: H) => I,
  fn9: (x: I) => J
): (x: A) => J;
function compose<A, B, C, D, E, F, G, H, I, J, K>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn7: (x: G) => H,
  fn8: (x: H) => I,
  fn9: (x: I) => J,
  fn10: (x: J) => K
): (x: A) => K;
function compose<A, B, C, D, E, F, G, H, I, J, K>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn7: (x: G) => H,
  fn8: (x: H) => I,
  fn9: (x: I) => J,
  fn10: (x: J) => K,
  ...moreFns: Array<(x: unknown) => unknown>
): (x: A) => unknown;
function compose<A, B>(
  first: (x: A) => B,
  ...params: Array<(unknown) => unknown>
): unknown {
  if (params.length === 0) {
    return first;
  } else {
    return params.reduce<(unknown) => unknown>((acc, cur) => {
      return (arg) => cur(acc(arg));
    }, first);
  }
}

/**
 * A pipe function applies the multiple functions to the first parameter
 *
 * So
 * ```typescript
 * pipe(x: A, f1:(x:A)=>B, f2:(x:B)=>C, f3:(x:C)=>D)
 * ```
 * returns the result of (a:A):D => f3(f2(f1(a)))
 *
 * @param first
 * @param params
 * @returns
 */
function pipe<IN, A>(input: IN, fn1: (x: IN) => A): A;
function pipe<IN, A, B>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B): B;
function pipe<IN, A, B, C>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C
): C;
function pipe<IN, A, B, C, D>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D
): D;
function pipe<IN, A, B, C, D, E>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E
): E;
function pipe<IN, A, B, C, D, E, F>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F
): F;
function pipe<IN, A, B, C, D, E, F, G>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G
): G;
function pipe<IN, A, B, C, D, E, F, G, H>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G,
  fn8: (x: G) => H
): H;
function pipe<IN, A, B, C, D, E, F, G, H, I>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G,
  fn8: (x: G) => H,
  fn9: (x: H) => I
): I;
function pipe<IN, A, B, C, D, E, F, G, H, I, J>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G,
  fn8: (x: G) => H,
  fn9: (x: H) => I,
  fn10: (x: I) => J
): J;
function pipe<IN, A, B, C, D, E, F, G, H, I, J>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G,
  fn8: (x: G) => H,
  fn9: (x: H) => I,
  fn10: (x: I) => J,
  ...moreFns: Array<(x: unknown) => unknown>
): unknown;
function pipe<IN, A>(
  input: IN,
  fn1: (x: IN) => A,
  ...functionsToApply: Array<(unknown) => unknown>
): unknown {
  if (functionsToApply.length === 0) {
    return fn1(input);
  } else {
    const composedFn = functionsToApply.reduce<(unknown) => unknown>(
      (acc, cur) => {
        return (arg) => cur(acc(arg));
      },
      fn1
    );
    return composedFn(input);
  }
}

export {
  /**
   * @deprecated Use compose(...) instead!
   */
  compose as itr8Pipe,
  compose,
  pipe,
  isPromise,
  AsyncFunction,
  thenable,
  forLoop,
  // itr8OperatorFactory,
};
