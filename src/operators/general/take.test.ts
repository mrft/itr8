import { assert } from "chai";
import { itr8ToArray, itr8RangeAsync, itr8Range } from "../..";
import { take } from "./take";

describe("operators/general/take.ts", () => {
  it("take(...) operator works properly", async () => {
    // sync
    assert.deepEqual(
      itr8ToArray(take(5)(itr8Range(1, 7) as Iterator<number>)),
      [1, 2, 3, 4, 5]
    );

    assert.deepEqual(
      itr8ToArray(take(5)(itr8Range(1, 3) as Iterator<number>)),
      [1, 2, 3],
      "limit should return the entire input when the limit is set higher than the total nr of elements in the input"
    );

    // async
    assert.deepEqual(
      await itr8ToArray(take(5)(itr8RangeAsync(1, 7) as AsyncIterator<number>)),
      [1, 2, 3, 4, 5]
    );

    assert.deepEqual(
      await itr8ToArray(take(5)(itr8RangeAsync(1, 3) as AsyncIterator<number>)),
      [1, 2, 3],
      "limit should return the entire input when the limit is set higher than the total nr of elements in the input"
    );
  });
});
