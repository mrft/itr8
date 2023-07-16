import { assert } from "chai";
import { itr8FromArray, itr8FromArrayAsync, itr8ToArray } from "../../index.js";
import { min } from "./min.js";

describe("operators/numeric/min.ts", () => {
  it("min(...) operator works properly", async () => {
    // sync
    assert.deepEqual(itr8ToArray(min()(itr8FromArray([1, 4, 7, 2]))), [1]);

    // async
    assert.deepEqual(
      await itr8ToArray(min()(itr8FromArrayAsync([1, -4, 7, 2]))),
      [-4]
    );
  });
});
