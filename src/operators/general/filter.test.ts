import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../..";
import { filter } from "./filter";

describe("operators/general/filter.ts", () => {
  it("filter(...) operator works properly", async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(
      itr8ToArray(filter(isEven)(itr8Range(0, 7))),
      [0, 2, 4, 6]
    );

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await itr8ToArray(filter(moreThan5)(itr8RangeAsync(0, 7))),
      [6, 7]
    );
  });
});
