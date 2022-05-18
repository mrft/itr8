import { assert } from 'chai';
import { itr8FromArray, itr8FromArrayAsync, itr8ToArray } from '../..';
import { dedup } from './dedup';
import { map } from './map';

describe('operators/general/dedup.ts', () => {
  it('dedup(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        dedup((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 3, 4, 1, 5, 3, 2, 1],
    );

    assert.deepEqual(
      itr8FromArray([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        map((v) => ({ id: v })),
        dedup((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 3 }, { id: 4 }, { id: 1 }, { id: 5 },
        { id: 3 }, { id: 2 }, { id: 1 }],
    );

    assert.deepEqual(
      itr8FromArray(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'])
      .pipe(
        dedup((v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four', 'six', 'seven', 'nine', 'ten'],
    );

    // async
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        dedup((v) => v),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 3, 4, 1, 5, 3, 2, 1],
    );

    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 2, 3, 4, 3, 3, 4, 1, 5, 3, 2, 1]).pipe(
        map((v) => ({ id: v })),
        dedup((v) => v.id - 7),
        itr8ToArray,
      ),
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 3 }, { id: 4 }, { id: 1 }, { id: 5 },
        { id: 3 }, { id: 2 }, { id: 1 }],
    );

    // also async mapFn is supported !!!
    assert.deepEqual(
      await itr8FromArrayAsync(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']).pipe(
        dedup(async (v) => v.length),
        itr8ToArray,
      ),
      ['one', 'three', 'four', 'six', 'seven', 'nine', 'ten'],
    );

  });
});
