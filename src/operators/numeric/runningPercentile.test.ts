import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from "../../index.js";
import { runningPercentile } from "./runningPercentile.js";

describe("operators/numeric/runningPercentile.ts", () => {
  it("runningPercentile(...) operator works properly", async () => {
    // sync
    assert.deepEqual(
      pipe(itr8Range(1, 10), runningPercentile(50), itr8ToArray),
      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    );

    // async
    assert.deepEqual(
      await pipe(itr8RangeAsync(1, 10), runningPercentile(90), itr8ToArray),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 9]
    );
  });
});
