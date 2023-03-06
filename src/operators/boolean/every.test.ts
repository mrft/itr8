import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from "../..";
import { every } from "./every";

describe("operators/boolean/every.ts", () => {
  it("every(...) operator works properly", async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(pipe(itr8Range(0, 7), every(isEven), itr8ToArray), [
      false,
    ]);

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await pipe(itr8RangeAsync(10, 35), every(moreThan5), itr8ToArray),
      [true]
    );
  });
});
