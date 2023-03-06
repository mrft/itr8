import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from "../..";
import { count } from "./count";

describe("operators/numeric/count.ts", () => {
  it("count(...) operator works properly", async () => {
    // sync
    assert.deepEqual(pipe(itr8Range(1, 4), count(), itr8ToArray), [4]);

    // async
    assert.deepEqual(await pipe(itr8Range(10, -4), count(), itr8ToArray), [15]);
  });
});
