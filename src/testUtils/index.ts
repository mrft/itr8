/**
 * These are not part of the library, but just contain a few utility functions that are used
 * throughout the tests, and not in the actual code.
 *
 * @module
 */

import { Stream } from "stream";
import * as FakeTimers from '@sinonjs/fake-timers';

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr: any[], timeBetweenChunks = 10) => {
  const readable = new Stream.Readable({ objectMode: true });

  readable._read = () => {
    // empty
  };

  arr.forEach((item, index) => setTimeout(() => readable.push(item), index * timeBetweenChunks));

  // no more data
  setTimeout(() => readable.push(null), arr.length * timeBetweenChunks);

  return readable;
}

/**
 * Resolve promise after the given amount of time. If you pass in a second parameter,
 * the promise will resolve with that value.
 *
 * @param milliseconds
 * @param value
 * @returns a Promise that resolves after the given number of milliseconds.
 */
const sleep = (milliseconds: number, value?: any) => new Promise((resolve) => setTimeout(() => resolve(value), milliseconds));

/**
 * process.hrtime() method can be used to measure execution time, but returns an array
 *
 * @param {Array<Integer>} hrtime tuple [seconds, nanoseconds]
 * @returns the input translated to milliseconds
 */
function hrtimeToMilliseconds([seconds, nanoseconds]: [number, number]): number {
  return seconds * 1000 + nanoseconds / 1000000;
}

/**
 * Helper function to make it less verbose to 'await a promise'.
 *
 * With the FakeTimers clock, you cannot just 'await someAsyncFunctionCall()';
 * because it would never resolve until clock.runAllAsync() had been called.
 *
 * So instead of the one-liner:
 * ```typescript
 * await someAsyncFunctionCall();
 * ```
 * you'd have to write:
 * ```typescript
 *  const promise = someAsyncFunctionCall();
 *  clock.clock.runAllAsync(); // make the promise actually resolve by advancing the clock
 *  const value = await promise;
 * ```
 * which is a lot more verbose than:
 * ```typescript
 *  await awaitPromiseWithFakeTimers(clock, someAsyncFunctionCall());
 * ```
 *
 * @param clock 
 * @param p 
 */
async function awaitPromiseWithFakeTimers<T>(clock:FakeTimers.InstalledClock, p:Promise<T>):Promise<T> {
  await clock.runAllAsync();
  return p;
}


export {
  arrayToStream,
  sleep,
  hrtimeToMilliseconds,
  awaitPromiseWithFakeTimers,
}