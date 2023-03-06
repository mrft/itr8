import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray } from "../..";
import { runningTotal } from "./runningTotal";

describe("operators/numeric/runningTotal.ts", () => {
  it("runningTotal(...) operator works properly", async () => {
    // sync
    assert.deepEqual(
      itr8ToArray(runningTotal()(itr8Range(1, 4))),
      [1, 3, 6, 10]
    );

    // async
    assert.deepEqual(
      await itr8ToArray(runningTotal()(itr8RangeAsync(1, 4))),
      [1, 3, 6, 10]
    );
  });
});
