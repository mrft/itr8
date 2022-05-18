/**
 * These are not part of the library, but just contain a few utility functions that are used
 * throughout the tests, and not in the actual code.
 *
 * @module
 */

import { Stream } from "stream";

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


export {
  arrayToStream,
  sleep,
  hrtimeToMilliseconds,
}