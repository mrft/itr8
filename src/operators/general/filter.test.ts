import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../../index.js";
import { filter } from "./filter.js";

describe("operators/general/filter.ts", () => {
  it("filter(...) operator works properly", async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(
      itr8ToArray(filter(isEven)(itr8Range(0, 7))),
      [0, 2, 4, 6],
    );

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await itr8ToArray(filter(moreThan5)(itr8RangeAsync(0, 7))),
      [6, 7],
    );
  });

  it("filter(...) operator works properly with an async filter function", async () => {
    const isEvenAsync = async (a) => a % 2 === 0;
    assert.deepEqual(
      await itr8ToArray(filter(isEvenAsync)(itr8Range(0, 7))),
      [0, 2, 4, 6],
    );

    const moreThan5Async = async (a) => a > 5;
    assert.deepEqual(
      await itr8ToArray(filter(moreThan5Async)(itr8RangeAsync(0, 7))),
      [6, 7],
    );
  });
});
