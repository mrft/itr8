import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../..";
import { skip } from "./skip";

describe('operators/general/skip.ts', () => {
  it('skip(...) operator works properly', () => {
    assert.deepEqual(
      itr8ToArray(skip(5)(itr8Range(1, 7))),
      [6, 7],
    );
  });
});
