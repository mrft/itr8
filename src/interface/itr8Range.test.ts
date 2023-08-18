import { assert } from "chai";
import { itr8Range } from "./itr8Range.js";
import { itr8ToArray } from "./itr8ToArray.js";

describe("interface/itr8Range.ts", () => {
  it("itr8Range(...) can generate a number producing iterator based on start and end indexes (and optionally a step value)", () => {
    assert.deepEqual(itr8ToArray(itr8Range(4, 7)), [4, 5, 6, 7]);

    assert.deepEqual(itr8ToArray(itr8Range(4, -1)), [4, 3, 2, 1, 0, -1]);

    assert.deepEqual(
      itr8ToArray(itr8Range(4, 7, 0.5)),
      [4, 4.5, 5, 5.5, 6, 6.5, 7],
    );

    // be forgiving about the sign of the step value
    assert.deepEqual(itr8ToArray(itr8Range(4, -3, -2)), [4, 2, 0, -2]);
    assert.deepEqual(itr8ToArray(itr8Range(4, -3, 2)), [4, 2, 0, -2]);
  });
});
