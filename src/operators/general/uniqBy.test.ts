import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync } from "../..";
import { map } from "./map";
import { uniqBy } from "./uniqBy";

describe('operators/general/uniqBy.ts', () => {
  it('uniqBy(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        uniqBy((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    assert.deepEqual(
      itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        map((v) => ({ id: v })),
        uniqBy((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    );

    assert.deepEqual(
      itr8FromArray(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']).pipe(
        uniqBy((v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four'],
    );

    // async
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        uniqBy((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        map((v) => ({ id: v })),
        uniqBy((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    );

    assert.deepEqual(
      await itr8FromArrayAsync(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']).pipe(
        uniqBy((v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four'],
    );

  });
});
