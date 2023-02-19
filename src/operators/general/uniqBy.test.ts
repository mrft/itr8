import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync, pipe } from "../..";
import { map } from "./map";
import { uniqBy } from "./uniqBy";

describe('operators/general/uniqBy.ts', () => {
  it('uniqBy(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]),
        uniqBy((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]),
        map((v) => ({ id: v })),
        uniqBy((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    );

    assert.deepEqual(
      pipe(
        itr8FromArray(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']),
        uniqBy((v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four'],
    );

    // async
    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]),
        uniqBy((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]),
        map((v) => ({ id: v })),
        uniqBy((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']),
        uniqBy((v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four'],
    );

  });
});
