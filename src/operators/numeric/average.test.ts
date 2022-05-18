import { assert } from 'chai';
import { itr8FromArrayAsync, itr8Range, itr8ToArray } from '../..';
import { average } from './average';

describe('operators/numeric/average.ts', () => {
  it('average(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8Range(1, 10).pipe(
        average(),
        itr8ToArray
      ),
      [5.5],
    );

    // async
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 4, 3]).pipe(
        average(),
        itr8ToArray
      ),
      [2.4],
    );
  });
});
