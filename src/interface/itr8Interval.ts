import { TPipeable, TPushable } from "../types";
import { itr8Pushable } from "./itr8Pushable";

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
function itr8Interval(intervalMilliseconds:number):TPipeable & AsyncIterableIterator<number> & TPushable {
  const it = itr8Pushable<number>(Infinity); // infinite buffer !!!
  const interval = setInterval(() => {
    it.push(Date.now());
  }, intervalMilliseconds);
  const origDone = it.done;
  it.done = () => {
    clearInterval(interval);
    return origDone();
  }
  return it;
}

export {
  itr8Interval,
}
