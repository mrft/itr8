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
import { debounce } from "./debounce.js";

describe("operators/timeBased/debounce.ts", () => {
  it("debounce(...) operator without second argument works properly", async () => {
    const clock = FakeTimers.install(); // don't forget to uninstall the clock in a finally block !
    try {
      const pushIt = itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(10);
        pushIt.push(2);
        pushIt.push(3);
        await sleep(30);
        pushIt.push(4);

        await sleep(10);
        pushIt.push(5);

        await sleep(10);
        pushIt.push(6);
        pushIt.push(7);
        pushIt.push(8);
        pushIt.push(9);

        await sleep(40);
        pushIt.push(10);

        await sleep(30);
        pushIt.done();
      });

      const resultPromise = pipe(pushIt, debounce(20), itr8ToArray);

      // now run all the clock ticks
      await clock.runAllAsync();

      assert.deepEqual(await resultPromise, [1, 4, 10]);
    } finally {
      clock.uninstall();
    }
  });

  it("debounce(...) operator with second argument works properly", () => {
    const valueTimestampTuples = [
      [1, 0],
      [2, 10],
      [3, 10],
      [4, 40],
      [5, 50],
      [6, 60],
      [7, 60],
      [8, 60],
      [9, 60],
      [10, 100],
    ];

    const result = pipe(
      itr8FromIterable(valueTimestampTuples),
      debounce(20, ([_v, ts]) => ts),
      map(([v, _ts]) => v),
      itr8ToArray,
    );

    assert.deepEqual(result, [1, 4, 10]);
  });
});
