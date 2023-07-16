import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../../index.js";
import { skip } from "./skip.js";

describe("operators/general/skip.ts", () => {
  it("skip(...) operator works properly", () => {
    assert.deepEqual(itr8ToArray(skip(5)(itr8Range(1, 7))), [6, 7]);
  });
});
