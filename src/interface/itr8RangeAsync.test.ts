import { assert } from "chai";
import { isPromise } from "../util/index.js";
import { itr8RangeAsync } from "./itr8RangeAsync.js";
import { itr8ToArray } from "./itr8ToArray.js";

describe("interface/.ts", () => {
  it("itr8RangeAsync(...) can generate a number producing iterator based on start and end indexes (and optionally a step value)", async () => {
    const it = itr8RangeAsync(4, 7, 0.5);
    const next = it.next();
    assert.strictEqual(isPromise(next), true);

    assert.deepEqual(await itr8ToArray(itr8RangeAsync(4, 7)), [4, 5, 6, 7]);

    assert.deepEqual(
      await itr8ToArray(itr8RangeAsync(4, -1)),
      [4, 3, 2, 1, 0, -1]
    );

    assert.deepEqual(
      await itr8ToArray(itr8RangeAsync(4, 7, 0.5)),
      [4, 4.5, 5, 5.5, 6, 6.5, 7]
    );

    // be forgiving about the sign of the step value
    assert.deepEqual(
      await itr8ToArray(itr8RangeAsync(4, -3, -2)),
      [4, 2, 0, -2]
    );
    assert.deepEqual(
      await itr8ToArray(itr8RangeAsync(4, -3, 2)),
      [4, 2, 0, -2]
    );
  });
});
