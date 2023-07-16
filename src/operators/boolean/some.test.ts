import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from "../../index.js";
import { some } from "./some.js";

describe("operators/boolean/some.ts", () => {
  it("some(...) operator works properly", async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(pipe(itr8Range(0, 7), some(isEven), itr8ToArray), [true]);

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await pipe(itr8RangeAsync(4, -3), some(moreThan5), itr8ToArray),
      [false]
    );
  });
});
