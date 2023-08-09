import { TPushable } from "../types.js";
/**
 * Returns a (pushable async) iterator that will automatically fire with the Date.now() value
 * of when it fired (= the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC).
 *
 * When you want it to stop, call the done() method of the returned iterator, and the interval
 * will be cleaned up.
 *
 * @param intervalMilliseconds
 * @returns an AsyncIterableIterator
 *
 * @category interface/standard
 */
declare function itr8Interval(intervalMilliseconds: number): AsyncIterableIterator<number> & TPushable;
export { itr8Interval };
