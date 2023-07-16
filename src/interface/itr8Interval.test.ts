import { assert } from "chai";
import { awaitPromiseWithFakeTimers, sleep } from "../testUtils/index.js";
import { itr8Interval } from "./itr8Interval.js";
import { itr8ToArray } from "./itr8ToArray.js";
import FakeTimers from "@sinonjs/fake-timers";

describe("interface/itr8Interval.ts", () => {
  it("itr8Interval(...) works properly", async () => {
    const clock = FakeTimers.install(); // don't forget to uninstall the clock in a finally block !

    try {
      const it = itr8Interval(10);
      clock.tick(35); // await sleep(35);

      // stop the interval, no new elements should be added to the iterator
      it.done();

      // wait some more but no new elements should be added as we stopped the interval
      clock.tick(15); // await sleep(15);

      // const itArray = await itr8ToArray(it);
      const itArray = await awaitPromiseWithFakeTimers(
        clock,
        itr8ToArray(it) as Promise<Array<number>>
      );
      assert.equal(itArray.length, 3);
      itArray.forEach((t) => assert(typeof t, "number"));
    } finally {
      clock.uninstall();
    }
  });
});
