import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync, pipe } from "../..";
import { sort } from "./sort";

describe('operators/general/sort.ts', () => {
  it('sort(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8ToArray(sort()(itr8FromArray([1, 4, 7, 2]))),
      [1, 2, 4, 7],
    );

    // async
    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([{ v: 1 }, { v: -4 }, { v: 7 }, { v: 2 }]),
        sort((a: { v: number }, b: { v: number }) => a.v - b.v),
        itr8ToArray,
      ),
      [{ v: -4 }, { v: 1 }, { v: 2 }, { v: 7 }],
    );
  });
});
