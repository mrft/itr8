import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { runningPercentile } from './runningPercentile';

describe('operators/numeric/runningPercentile.ts', () => {
  it('runningPercentile(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8Range(1, 10).pipe(
        runningPercentile(50),
        itr8ToArray
      ),
      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    );

    // async
    assert.deepEqual(
      await itr8RangeAsync(1, 10).pipe(
        runningPercentile(90),
        itr8ToArray
      ),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 9],
    );
  });
});
