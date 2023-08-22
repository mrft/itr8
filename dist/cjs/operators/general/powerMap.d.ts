import { TNextFnResult, TTransIteratorSyncOrAsync } from "../../types.js";
/**
 * An experimental version of powerMap trying to learn from the lessons from
 * the powerMapWithDoAfter version
 * We'll remove doAfter again from the async version, and use simple ifs again.
 *
 * The most important optimization is probably the same as what doAfterFactory does:
 * do a first run in order to figure out whether the first next() call is synchronous
 * and then replace the next function by an entirely synchronous version.
 * (And maybe the async version can be written with doAfterFactory (or a for-loop))
 *
 * Consequence: an iterable can only be async in a synchronous handler if it is used the first time
 * otherwise the iterator will already be synchronous.
 *
 * how do you make the while loop work for both synchronous and asynchronous code?
 * MAYBE I should reimplement the forLoop function using doAfter, and then use the powerMap version
 * that is written using the for-loop (and drop this one)?
 *
 * @param nextFn
 * @param initialStateFactory
 * @returns
 */
declare const powerMapWithoutDoAfter: <TIn = unknown, TOut = unknown, TState = void>(nextFn: (nextIn: IteratorResult<TIn, any>, state: TState) => TNextFnResult<TOut, TState> | Promise<TNextFnResult<TOut, TState>>, initialStateFactory: () => TState) => TTransIteratorSyncOrAsync<TIn, TOut>;
export { powerMapWithoutDoAfter as powerMap };
