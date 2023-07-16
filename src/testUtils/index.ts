/**
 * These are not part of the library, but just contain a few utility functions that are used
 * throughout the tests, and not in the actual code.
 *
 * @module
 */

import { Stream } from "stream";
import FakeTimers from "@sinonjs/fake-timers";
import { TTransIteratorSyncOrAsync } from "../types";
import { itr8ToMultiIterable } from "../interface";
import { pipe } from "../util";
import { assert } from "chai";
import sinon from "sinon";

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr: any[], timeBetweenChunks = 10) => {
  const readable = new Stream.Readable({ objectMode: true });

  readable._read = () => {
    // empty
  };

  arr.forEach((item, index) =>
    setTimeout(() => readable.push(item), index * timeBetweenChunks)
  );

  // no more data
  setTimeout(() => readable.push(null), arr.length * timeBetweenChunks);

  return readable;
};

/**
 * Resolve promise after the given amount of time. If you pass in a second parameter,
 * the promise will resolve with that value.
 *
 * @param milliseconds
 * @param value
 * @returns a Promise that resolves after the given number of milliseconds.
 */
const sleep = (milliseconds: number, value?: any) =>
  new Promise((resolve) => setTimeout(() => resolve(value), milliseconds));

/**
 * process.hrtime() method can be used to measure execution time, but returns an array
 *
 * @param {Array<Integer>} hrtime tuple [seconds, nanoseconds]
 * @returns the input translated to milliseconds
 */
function hrtimeToMilliseconds([seconds, nanoseconds]: [
  number,
  number
]): number {
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
 *  clock.runAllAsync(); // make the promise actually resolve by advancing the clock
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
async function awaitPromiseWithFakeTimers<T>(
  clock: FakeTimers.InstalledClock,
  p: Promise<T>
): Promise<T> {
  await clock.runAllAsync();
  return p;
}

/**
 * Helper function to check if a transIterator correctly calls the other iterator protocol methods:
 * return(value) and throw(error).
 *
 * What do we need to check:
 * * if return(value) is called on the OUTPUT iterator, it should also be called on the INPUT
 *   iterator (given that it is defined!)
 * * if the output iterator is done, return(value) should be called on the INPUT iterator (given
 *   that it is defined!).
 *   The value should be the last value from the input iterator (let's say the one that caused
 *   the output iterator to be done, and thus it could be undefined, when the input iterator has
 *   run to the very end)
 * * if the transIterator throws an error, it should be stable anough to call throw(exception)
 *   on the INPUT iterator (given that it is defined!).
 *   (We cannot generically make a transIterator fail I guess, so maybe this will be a separate
 *   test, with as input a transIterator that will fail somewhere).
 * * both throw() and return() should always return an IteratorResult | Promise<IteratorResult>.
 *
 * return(value)
 *   A function that accepts zero or one argument and returns an object conforming to the
 *   IteratorResult interface, typically with value equal to the value passed in and done equal
 *   to true. Calling this method tells the iterator that the caller does not intend to make any
 *   more next() calls and can perform any cleanup actions.
 * throw(exception) Optional
 *   A function that accepts zero or one argument and returns an object conforming to the
 *   IteratorResult interface, typically with done equal to true. Calling this method tells the
 *   iterator that the caller detects an error condition, and exception is typically an Error
 *   instance.
 */
async function checkIfOperatorRespectsIteratorProtocol(
  itIn: Iterator<unknown>,
  transIt: TTransIteratorSyncOrAsync
) {
  // itr8ToMultiIterable should produce iterators WITH return() and throw() functions!
  const iterable = itr8ToMultiIterable(itIn);

  /** Quick helper to create in and out pairs to run tests on */
  const makeInOutIts = () => {
    const itIn = iterable[Symbol.asyncIterator]();
    const itOut = pipe(itIn, transIt);
    const spyReturnIn = sinon.spy(itIn, "return");
    const spyThrowIn = sinon.spy(itIn, "throw");
    const spyReturnOut = sinon.spy(itOut, "return");
    const spyThrowOut = sinon.spy(itOut, "throw");
    return { itIn, itOut, spyReturnIn, spyThrowIn, spyReturnOut, spyThrowOut };
  };

  const its1 = makeInOutIts();

  // return() is defined and properly returns an IteratorResult
  // and also calls return on the itIn if it exists, and does not crash if it does not exist!
  // const next1 = await itOut1.next();
  assert.isDefined(its1.itOut.return);
  if (its1.itOut.return) {
    const ret1 = await its1.itOut.return();
    assert.hasAnyDeepKeys(ret1, ["done", "value"], "return() does not return an IteratorResult");
    assert.equal(
      its1.spyReturnIn.callCount,
      1,
      "return(...) on the input iterator has not been called."
    );
  }

  const its2 = makeInOutIts();
  assert.isDefined(its2.itOut.return);
  // make sure its2.itIn.return is UNDEFINED for this test !!!
  delete its2.itIn.return;
  if (its2.itOut.return) {
    const ret2 = await its2.itOut.return();
    assert.hasAnyDeepKeys(ret2, ["done", "value"], "return() does not return an IteratorResult");
    assert.equal(
      its2.spyThrowIn.callCount,
      0,
      "throw(...) on the input iterator has not been called."
    );
  }

  // throws() is defined and properly returns an IteratorResult
  const its3 = makeInOutIts();
  assert.isDefined(its3.itOut.throw);
  if (its3.itOut.throw) {
    const ret3 = await its3.itOut.throw();
    assert.hasAnyDeepKeys(ret3, ["done", "value"], "throw() does not return an IteratorResult");
    assert.equal(
      its3.spyThrowIn.callCount,
      0,
      "throw(...) on the input iterator has been called, but we removed it"
    );
  }

  // throws() is defined and properly returns an IteratorResult
  const its4 = makeInOutIts();
  assert.isDefined(its4.itOut.return);
  // make sure its2.itIn.throw is UNDEFINED for this test !!!
  delete its4.itIn.throw;
  if (its4.itOut.throw) {
    const ret4 = await its4.itOut.throw();
    assert.hasAnyDeepKeys(ret4, ["done", "value"], "throw() does not return an IteratorResult");
    assert.equal(
      its4.spyReturnIn.callCount,
      0,
      "throw(...) on the input iterator has been called, but we removed it"
    );
  }
}

export {
  arrayToStream,
  sleep,
  hrtimeToMilliseconds,
  awaitPromiseWithFakeTimers,
};
