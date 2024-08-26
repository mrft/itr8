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
const thenable = <T>(x: T): TThenable<T> => {
  if (isPromise(x)) {
    // console.log(`[thenable] ASYNC: ${x}`);
    const newX = {
      src: x,
      then: (...args) => thenable(x.then(...args)),
    };
    // make sure the value gets added to this object after the promise resolves
    x.then((value) => (newX["value"] = value));
    return newX;
  } else {
    // console.log(`[thenable] SYNC: ${x}`);
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
 * ```typescript
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
const thenableFactory = <T>(
  y: T | Promise<T>,
): ((x: T | Promise<T>) => TThenable<T>) => {
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

    return function asyncThenable(x: Promise<T>) {
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
  } else {
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

    return function syncThenable(x: T) {
      firstRun = true;

      if (typeof (x as any)?.then === "function") {
        return x as unknown as TThenable;
      } else {
        // needed, because in strict mode it is impossble to set a property
        // on a string primitive (and in non-strict mode the set value cannot be read again)
        const newX = {
          src: (x as any)?.src !== undefined ? (x as any).src : x,
          then: (okHandler: (v: unknown, isSync?: boolean) => unknown) => {
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

/**
 * doAfter() will create another function that expects a single argument which could either be
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
const doAfter = <TIn, TOut>(
  f: (v: TIn) => TOut | Promise<TOut>,
): ((x: TIn | Promise<TIn>) => TOut | Promise<TOut>) => {
  return (valueOrPromise: TIn | Promise<TIn>) => {
    return isPromise(valueOrPromise)
      ? (valueOrPromise.then(f) as Promise<TOut>)
      : (f(valueOrPromise) as TOut);
  };
};

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
 *  await pipe(
 *    Promise.resolve(i),
 *    incrementAfter.doAfter,
 *    doubleAfter.doAfter,
 *    console.log,
 *  );
 * }
 * ```
 * @param f
 * @returns
 */
const doAfterFactory = <TIn, TOut>(
  f: (v: TIn) => TOut | Promise<TOut>,
): {
  doAfter: (x: TIn | Promise<TIn>) => TOut | Promise<TOut>;
  asyncDoAfter: (promise: Promise<TIn>) => Promise<TOut>;
  syncDoAfter: (value: TIn) => TOut | Promise<TOut>;
} => {
  // let first = true;
  // let isAsync;
  const doAfterObj = {
    asyncDoAfter: async (valueOrPromise: Promise<TIn>) =>
      f(await valueOrPromise),
    syncDoAfter: f,
    doAfter: (valueOrPromise: TIn | Promise<TIn>) => {
      if (isPromise(valueOrPromise)) {
        doAfterObj.doAfter = doAfterObj.asyncDoAfter;
      } else {
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
  codeToExecute: (a: State) => void | Promise<void>,
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
                  // whether a value should be awaited, we can solve it like this
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
                  `,
                  )(
                    firstStateAfterEach,
                    testBeforeEach,
                    codeToExecute,
                    afterEach,
                  );
                }
              },
            );
          });
        } else {
          return initialState;
        }
      },
    );
  });
};

/**
 * Another attempt to make optimization easier, while trying to avoid code duplication.
 *
 * This is basically the same as doAfterFactory, but with a different name!
 * Also, this one allows for extra parameters to be passed to the function.
 *
 * We have created manual optimizations in the past, where a function would be replaced
 * by another version once we found out whether the input was a promise or not.
 *
 * Here I have tried to create a function that will simplify this process.
 *
 * @example
 * ```typescript
 * const plusOne = (v) => v + 1;
 * const fnContainer = createSelfReplacingFunction(plusOne);
 *
 * fnContainer.func(1); // 2, and the second call will be faster because by now fnContainer.func has been replaced by fnToApply
 * fnContainer.func(2); // 3, without any isPromise checks
 *
 * const fnContainer2 = createSelfReplacingFunction(plusOne);
 * fnContainer2.func(Promise.resolve(1)); // Promise<2>, and the second call will be faster because by now fnContainer2.func has been replaced by (promise) => promise.then(plusOne)
 * fnContainer2.func(Promise.resolve(2)); // Promise<3>, without any isPromise checks
 * ```
 *
 * The reason this actually makes a difference is because we avoid the isPromise check,
 * but mainly because we avoid a few function calls that isPromise would require.
 * This is a huge difference with 'thenable', that would add an extra function call
 * even in the synchronous case.
 *
 * This makes sense in the world of iterators, where the first call will determine
 * the nature of the rest of the calls (synchronous or asynchronous).
 *
 * @param fnToApply the first argument of this function should be the possible promise
 * @returns
 */
function createSelfReplacingFunction(
  fnToApply: (
    possiblePromise: unknown | Promise<unknown>,
    ...otherArgs: unknown[]
  ) => unknown,
) {
  let container = {
    call: (possiblePromise, ...otherArgs) => {
      if (isPromise(possiblePromise)) {
        container.call = (promise, ...otherArgs) =>
          promise.then((promiseVal) => fnToApply(promiseVal, ...otherArgs));
      } else {
        container.call = fnToApply;
      }
      return container.call(possiblePromise, ...otherArgs);
    },
  };

  return container;

  // alternative implementation using classes?
  // class Container {
  //   call(possiblePromise, ...otherArgs) {
  //     if (isPromise(possiblePromise)) {
  //       this.call = (promise, ...otherArgs) =>
  //         promise.then((promiseVal) => fnToApply(promiseVal, ...otherArgs));
  //     } else {
  //       this.call = fnToApply;
  //     }
  //     return this.call(possiblePromise, ...otherArgs);
  //   }
  // }
  // return new Container();
}

/**
 * Another attempt to make optimization easier, while trying to avoid code duplication.
 * This time using a class instead of an object.
 *
 * @example
 * ```typescript
 * const plusOne = (v) => v + 1;
 *
 * const fnContainer = new SelfReplacingFunctionContainer(plusOne);
 * fnContainer.func(1); // 2, and the second call will be faster because by now fnContainer.func has been replaced by fnToApply
 * fnContainer.func(2); // 3, without any isPromise checks
 *
 * const fnContainer2 = new SelfReplacingFunctionContainer(plusOne);
 * fnContainer2.func(Promise.resolve(1)); // Promise<2>, and the second call will be faster because by now fnContainer2.func has been replaced by (promise) => promise.then(plusOne)
 * fnContainer2.func(Promise.resolve(2)); // Promise<3>, without any isPromise checks
 *
 * @todo make sure the types match the function that is passed in
 */
class SelfReplacingFunctionContainer {
  constructor(fnToApply) {
    this.call = (possiblePromise, ...otherArgs) => {
      if (isPromise(possiblePromise)) {
        this.call = (promise, ...otherArgs) =>
          promise.then((promiseVal) => fnToApply(promiseVal, ...otherArgs));
      } else {
        this.call = fnToApply;
      }
      return this.call(possiblePromise, ...otherArgs);
    };
  }

  call(possiblePromise, ...otherArgs) {
    throw new Error("Constructor should have replaced this method");
  }
}

/**
 * Let us try another way to optimize the code.
 *
 * What if we could create the synchronous version of the function, and tell which calls inside
 * that function could potentially be asynchronous.
 *
 * Then we could create a function that would rewrite the function's code to include the necessary
 * await keywords. I guess this would cause problems when the function is minified, because then
 * names could be changed. If we pass in the function c
 *
 * ```typescript
 * function plusOne(value) { return value + 1; }
 * // => could be minified as
 * function plusOne(a){return a+1;}
 * // which would be hard to alter into 'await a' when we use 'value' as the function name
 * ```
 *
 * @example
 * ```typescript
 * const retVal.next = () => {
 *  retVal.value)) {
 * }
 * ```
 *
 * @param fn
 * @returns
 */
function syncFunctionToAsyncFunction<A, B>(
  fn: (a: A) => B,
): (a: A) => Promise<B> {
  return (a: A) => Promise.resolve(fn(a));
}

// /**
//  * A more generic pipe function that takes multiple functions as input
//  * and outputs a single function where input = input of the first function
//  * and output = output where every funtion has been applied to the output of the previous on.
//  *
//  * So itr8Pipe(f1:(x:A)=>B, f2:(x:B)=>C, f3:(x:C)=>D) returns (a:A):D => f3(f2(f1(a)))
//  *
//  * @param first
//  * @param params
//  * @returns
//  *
//  * @deprecated see compose (and pipe)
//  */
// function itr8Pipe<A, B>(fn1: (x: A) => B): (x: A) => B;
// function itr8Pipe<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C;
// function itr8Pipe<A, B, C, D>(
//   fn1: (x: A) => B,
//   fn2: (x: B) => C,
//   fn3: (x: C) => D
// ): (x: A) => D;
// function itr8Pipe<A, B, C, D, E>(
//   fn1: (x: A) => B,
//   fn2: (x: B) => C,
//   fn3: (x: C) => D,
//   fn4: (x: D) => E
// ): (x: A) => E;
// /*export*/ function itr8Pipe<A = any, B = any>(
//   first: (x: A) => B,
//   ...params: Array<(any) => any>
// ): any {
//   if (params.length === 0) {
//     return first;
//   } else {
//     return params.reduce<(any) => any>((acc, cur) => {
//       return (arg) => cur(acc(arg));
//     }, first);
//   }
// }

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
  fn3: (x: C) => D,
): (x: A) => D;
function compose<A, B, C, D, E>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
): (x: A) => E;
function compose<A, B, C, D, E, F>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
): (x: A) => F;
function compose<A, B, C, D, E, F, G>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
): (x: A) => G;
function compose<A, B, C, D, E, F, G, H>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn7: (x: G) => H,
): (x: A) => H;
function compose<A, B, C, D, E, F, G, H, I>(
  fn1: (x: A) => B,
  fn2: (x: B) => C,
  fn3: (x: C) => D,
  fn4: (x: D) => E,
  fn5: (x: E) => F,
  fn6: (x: F) => G,
  fn8: (x: G) => H,
  fn7: (x: H) => I,
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
  fn9: (x: I) => J,
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
  fn10: (x: J) => K,
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
  fn3: (x: B) => C,
): C;
function pipe<IN, A, B, C, D>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
): D;
function pipe<IN, A, B, C, D, E>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
): E;
function pipe<IN, A, B, C, D, E, F>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
): F;
function pipe<IN, A, B, C, D, E, F, G>(
  input: IN,
  fn1: (x: IN) => A,
  fn2: (x: A) => B,
  fn3: (x: B) => C,
  fn4: (x: C) => D,
  fn5: (x: D) => E,
  fn6: (x: E) => F,
  fn7: (x: F) => G,
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
  fn8: (x: G) => H,
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
  fn9: (x: H) => I,
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
  fn10: (x: I) => J,
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
      fn1,
    );
    return composedFn(input);
  }
}

//#region from iter-tools
// the code below is taken from iter-ops, I found it while trying to figure out
// why iter-ops was so much faster with synchronous iterators,
// and then I found this 'hidden' optimisation in its pipe function !!!
// This made the comparison between iter-ops and itr8 or RxJS somewhat unfair.

/**
 * Determines if the value is an indexed type.
 */
function isIndexed<T, CastGeneric = unknown>(
  value: T,
): value is T & ArrayLike<CastGeneric> {
  return (
    Array.isArray(value) ||
    isTypedArray(value) ||
    typeof value === "string" ||
    value instanceof String
  );
}

/**
 * Determines if the given object has the given set property.
 */
function has<T, K extends PropertyKey>(
  object: T,
  key: K,
): object is T & Record<K, unknown> {
  return key in Object(object);
}

/**
 * Determines if the given object has a property with the given name of type number.
 */
function hasOfType<T, K extends PropertyKey>(
  object: T,
  key: K,
  type: "number",
): object is T & Record<K, number>;

function hasOfType<T, K extends PropertyKey>(
  object: T,
  key: K,
  type:
    | "string"
    | "number"
    | "bigint"
    | "boolean"
    | "symbol"
    | "undefined"
    | "object"
    | "function",
): object is T & Record<K, unknown> {
  return has(object, key) && typeof object[key] === type;
}

/**
 * Determines if the value is a buffer-like array.
 */
function isArrayBufferLike<T>(value: T): value is T & ArrayBufferLike {
  return hasOfType(value, "byteLength", "number");
}

/**
 * A Typed array.
 */
type TypedArray = ArrayBufferView & ArrayLike<unknown>;

/**
 * Determines if the value is a typed array.
 */
function isTypedArray<T>(value: T): value is T & TypedArray {
  return (
    has(value, "BYTES_PER_ELEMENT") &&
    has(value, "buffer") &&
    isArrayBufferLike(value.buffer)
  );
}

/**
 * Wraps an indexed iterable into an Iterable<T> object
 */
function indexedIterable<T>(input: ArrayLike<T>): Iterable<T> {
  return {
    [Symbol.iterator](): IterableIterator<T> {
      const len = input.length;
      let i = 0;
      const retVal = {
        [Symbol.iterator]: () => retVal,
        next(): IteratorResult<T> {
          return i < len
            ? { value: input[i++], done: false }
            : { value: undefined, done: true };
        },
      };
      return retVal;
    },
  };
}

/**
 * Type-dependent performance optimizer.
 *
 * Tests show that for indexed types, JavaScript performs way better
 * when accessed via index, rather than iterable interface.
 */
function optimizeIterable<T>(input: Iterable<T>): Iterable<T> {
  return isIndexed<Iterable<T>>(input)
    ? indexedIterable<T>(input as ArrayLike<T>)
    : input;
}
//#endregion from iter-tools

export {
  compose,
  /**
   * @deprecated Use compose(...) instead!
   */
  compose as itr8Pipe,
  pipe,
  isPromise,
  AsyncFunction,
  thenable,
  thenableFactory,
  doAfter,
  doAfterFactory,
  forLoop,
  createSelfReplacingFunction,
  SelfReplacingFunctionContainer,
  // itr8OperatorFactory,
  optimizeIterable,
};
