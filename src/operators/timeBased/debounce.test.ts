import { assert } from "chai";
import * as FakeTimers from "@sinonjs/fake-timers";
import { itr8Pushable, itr8ToArray, pipe } from "../..";
import { sleep } from "../../testUtils";
import { debounce } from "./debounce";

describe("operators/timeBased/debounce.ts", () => {
  it("debounce(...) operator works properly", async () => {
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
});
