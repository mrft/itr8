/**
 * Utility functions that are used internally, but that can be used by anyone to
 * help create operators that support both synchronous and asynchronous parameters
 * (by using thenable, forLoop or isPromise).
 *
 * @module
 */
import { TThenable } from "../types.js";
/**
 * Check whether the parameter is a promise.
 *
 * @param p
 * @returns true if p is a promise
 *
 * @category util
 */
declare const isPromise: (p: unknown) => p is Promise<unknown>;
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
declare const AsyncFunction: any;
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
declare const thenable: <T>(x: T) => TThenable<T>;
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
declare const thenableFactory: <T>(y: T | Promise<T>) => (x: T | Promise<T>) => TThenable<T>;
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
declare const doAfter: <TIn, TOut>(f: (v: TIn) => TOut | Promise<TOut>) => (x: TIn | Promise<TIn>) => TOut | Promise<TOut>;
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
declare const doAfterFactory: <TIn, TOut>(f: (v: TIn) => TOut | Promise<TOut>) => {
    doAfter: (x: TIn | Promise<TIn>) => TOut | Promise<TOut>;
    asyncDoAfter: (promise: Promise<TIn>) => Promise<TOut>;
    syncDoAfter: (value: TIn) => TOut | Promise<TOut>;
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
declare const forLoop: <State>(initialStateFactory: () => State | Promise<State>, testBeforeEach: (a: State) => boolean | Promise<boolean>, afterEach: (a: State) => State | Promise<State>, codeToExecute: (a: State) => void | Promise<void>) => any;
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
declare function compose<A, B>(fn1: (x: A) => B): (x: A) => B;
declare function compose<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C;
declare function compose<A, B, C, D>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D): (x: A) => D;
declare function compose<A, B, C, D, E>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E): (x: A) => E;
declare function compose<A, B, C, D, E, F>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F): (x: A) => F;
declare function compose<A, B, C, D, E, F, G>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G): (x: A) => G;
declare function compose<A, B, C, D, E, F, G, H>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H): (x: A) => H;
declare function compose<A, B, C, D, E, F, G, H, I>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn8: (x: G) => H, fn7: (x: H) => I): (x: A) => I;
declare function compose<A, B, C, D, E, F, G, H, I, J>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H, fn8: (x: H) => I, fn9: (x: I) => J): (x: A) => J;
declare function compose<A, B, C, D, E, F, G, H, I, J, K>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H, fn8: (x: H) => I, fn9: (x: I) => J, fn10: (x: J) => K): (x: A) => K;
declare function compose<A, B, C, D, E, F, G, H, I, J, K>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H, fn8: (x: H) => I, fn9: (x: I) => J, fn10: (x: J) => K, ...moreFns: Array<(x: unknown) => unknown>): (x: A) => unknown;
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
declare function pipe<IN, A>(input: IN, fn1: (x: IN) => A): A;
declare function pipe<IN, A, B>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B): B;
declare function pipe<IN, A, B, C>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C): C;
declare function pipe<IN, A, B, C, D>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D): D;
declare function pipe<IN, A, B, C, D, E>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E): E;
declare function pipe<IN, A, B, C, D, E, F>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F): F;
declare function pipe<IN, A, B, C, D, E, F, G>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G): G;
declare function pipe<IN, A, B, C, D, E, F, G, H>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H): H;
declare function pipe<IN, A, B, C, D, E, F, G, H, I>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I): I;
declare function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J): J;
declare function pipe<IN, A, B, C, D, E, F, G, H, I, J>(input: IN, fn1: (x: IN) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H, fn9: (x: H) => I, fn10: (x: I) => J, ...moreFns: Array<(x: unknown) => unknown>): unknown;
export { compose, 
/**
 * @deprecated Use compose(...) instead!
 */
compose as itr8Pipe, pipe, isPromise, AsyncFunction, thenable, thenableFactory, doAfter, doAfterFactory, forLoop, };
