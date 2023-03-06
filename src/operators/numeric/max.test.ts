import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray } from "../..";
import { max } from "./max";

describe("operators/numeric/max.ts", () => {
  it("max(...) operator works properly", async () => {
    // sync
    assert.deepEqual(itr8ToArray(max()(itr8Range(1, 4))), [4]);

    // async
    assert.deepEqual(await itr8ToArray(max()(itr8RangeAsync(10, -4))), [10]);
  });
});
