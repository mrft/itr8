import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { count } from './count';

describe('operators/numeric/count.ts', () => {
  it('count(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8Range(1, 4).pipe(
        count(),
        itr8ToArray,
      ),
      [4],
    );

    // async
    assert.deepEqual(
      await itr8Range(10, -4).pipe(
        count(),
        itr8ToArray,
      ),
      [15],
    );
  });
});
