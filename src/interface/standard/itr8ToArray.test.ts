import { assert } from "chai";
import { itr8ToArray } from "./itr8ToArray";

describe('interface/standard/itr8ToArray.ts', () => {
  it('itr8ToArray(...) can turn an iterator into an array', () => {
    const a = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    assert.deepEqual(
      itr8ToArray(a[Symbol.iterator]()),
      a,
    );
  });
});
