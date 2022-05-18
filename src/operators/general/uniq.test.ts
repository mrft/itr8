import { assert } from "chai";
import { itr8ToArray, itr8RangeAsync, itr8Range, itr8FromArray, itr8FromArrayAsync } from "../..";
import { uniq } from "./uniq";

describe('operators/general/uniq.ts', () => {
  it('uniq(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        uniq(),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    // async
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        uniq(),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );
  });
});
