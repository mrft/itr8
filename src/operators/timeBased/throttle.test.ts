import { assert } from "chai";
import FakeTimers from "@sinonjs/fake-timers";
import {
  itr8FromIterable,
  itr8Pushable,
  itr8ToArray,
  map,
  pipe,
} from "../../index.js";
import { sleep } from "../../testUtils/index.js";
import { throttle } from "./throttle.js";

describe("operators/timeBased/throttle.ts", () => {
  it("throttle(...) operator works properly without second argument", async () => {
    const clock = FakeTimers.install(); // don't forget to uninstall the clock in a finally block !
    try {
      const pushIt = itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(1 * 5);
        pushIt.push(2);
        pushIt.push(3);
        await sleep(3 * 5);
        pushIt.push(4);
        await sleep(1 * 5);
        pushIt.push(5);
        await sleep(1 * 5);
        pushIt.push(6);
        await sleep(2 * 5);
        pushIt.push(7);
        await sleep(1 * 5);
        pushIt.push(8);
        pushIt.done();
      });

      const resultPromise = pipe(pushIt, throttle(3 * 5), itr8ToArray);

      // now run all the clock ticks
      await clock.runAllAsync();

      // and then run the assertions
      assert.deepEqual(await resultPromise, [1, 4, 7]);
    } finally {
      clock.uninstall();
    }
  });

  it("throttle(...) operator works properly with second argument", () => {
    const valueTimestampTuples = [
      [1, 0],
      [2, 5],
      [3, 5],
      [4, 20],
      [5, 25],
      [6, 30],
      [7, 40],
      [8, 45],
    ];

    const result = pipe(
      itr8FromIterable(valueTimestampTuples),
      throttle(15, ([_v, ts]) => ts),
      map(([v, _ts]) => v),
      itr8ToArray,
    );

    // and then run the assertions
    assert.deepEqual(result, [1, 4, 7]);
  });
});
