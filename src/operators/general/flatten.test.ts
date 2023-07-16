import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync } from "../../index.js";
import { flatten } from "./flatten.js";

describe("operators/general/flatten.ts", () => {
  it("flatten(...) operator works properly", async () => {
    const arrayToBeFlattened = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    const flattenedArray = [1, 2, 3, 4, 5, 6];

    // sync
    assert.deepEqual(
      itr8ToArray(flatten()(itr8FromArray(arrayToBeFlattened))),
      flattenedArray,
      "flatten on sync iterator FAILED"
    );

    // async
    assert.deepEqual(
      await itr8ToArray(flatten()(itr8FromArrayAsync(arrayToBeFlattened))),
      flattenedArray,
      "flatten on async iterator FAILED"
    );
  });
});
