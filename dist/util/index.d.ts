/**
 * Utility functions that are used internally, but that can be used by anyone to
 * help create operators that support both synchronous and asynchronous parameters
 * (by using thenable, forLoop or isPromise).
 *
 * @module
 */
import { TThenable } from "../types";
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
declare const thenable: <T>(x: T) => TThenable<T>;
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
export { 
/**
 * @deprecated Use compose(...) instead!
 */
compose as itr8Pipe, compose, pipe, isPromise, AsyncFunction, thenable, forLoop, };
