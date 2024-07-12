import { assert } from "chai";
import { pipe } from "../../util/index.js";
import {
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { runningTotal } from "../numeric/runningTotal.js";
import { identity } from "./identity.js";

describe("operators/general/identity.ts", () => {
  it("identity(...) operator works properly with 1-to-1 transIterators", async () => {
    const resultAsync = await pipe(
      itr8RangeAsync(1, 4),
      identity(),
      identity(),
      itr8ToArray,
    );
    assert.deepEqual(resultAsync, [1, 2, 3, 4], "async input iterator version");

    const resultSync = pipe(
      itr8Range(1, 4),
      identity(),
      identity(),
      itr8ToArray,
    );
    assert.deepEqual(resultAsync, [1, 2, 3, 4], "async input iterator version");
  });

  it.skip("branchAndMerge(...) operator works properly with transIterators that produce a different number of output values", async () => {
    // const result = await pipe(
    //   iteratorFactory(),
    //   branchAndMerge(
    //     map((x) => x * 2),
    //     runningTotal(),
    //   ),
    //   itr8ToArray,
    // );
    // assert.deepEqual(result, [[1, 2, 1], [2, 4, 3], [3, 6, 6], [4, 8, 10]]);
  });
});
