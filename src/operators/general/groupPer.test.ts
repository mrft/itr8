import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../../index.js";
import { groupPer } from "./groupPer.js";

describe("operators/general/groupPer.ts", () => {
  it("groupPer(...) operator works properly", async () => {
    // sync
    assert.deepEqual(
      itr8ToArray(groupPer(3)(itr8Range(1, 7))),
      [[1, 2, 3], [4, 5, 6], [7]],
      "groupPer on sync iterator FAILED"
    );

    // async
    assert.deepEqual(
      await itr8ToArray(groupPer(3)(itr8RangeAsync(1, 7))),
      [[1, 2, 3], [4, 5, 6], [7]],
      "groupPer on async iterator FAILED"
    );
  });
});
