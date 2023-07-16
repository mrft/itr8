import FakeTimers from "@sinonjs/fake-timers";
// import { awaitPromiseWithFakeTimers, sleep } from "../src/testUtils";
import { assert } from "chai";

describe("@sinonjs/fake-timers", () => {
  it("should behave as expected when using process.hrtime", async () => {
    const clock = FakeTimers.install();
    try {
      const start = process.hrtime.bigint() / BigInt(1_000_000);
      const start2 = Date.now();
      // await awaitPromiseWithFakeTimers(clock, sleep(50));
      clock.tick(50);
      const stop = process.hrtime.bigint() / BigInt(1_000_000);
      const duration = stop - start;
      const stop2 = Date.now();
      console.log(`start  ${start} stop  ${stop} duration ${duration}`);
      console.log(`start2 ${start2} stop2 ${stop2}`);
      assert.equal(stop2 - start2, 50, "Date.now() gives incorrect results");
      assert.equal(
        stop - start,
        BigInt(50),
        "process.hrtime gives incorrect results"
      );
    } finally {
      clock.uninstall();
    }
  });
});
