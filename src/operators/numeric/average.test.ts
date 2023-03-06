import { assert } from "chai";
import { itr8FromArrayAsync, itr8Range, itr8ToArray, pipe } from "../..";
import { average } from "./average";

describe("operators/numeric/average.ts", () => {
  it("average(...) operator works properly", async () => {
    // sync
    assert.deepEqual(pipe(itr8Range(1, 10), average(), itr8ToArray), [5.5]);

    // async
    assert.deepEqual(
      await pipe(itr8FromArrayAsync([1, 2, 2, 4, 3]), average(), itr8ToArray),
      [2.4]
    );
  });
});
