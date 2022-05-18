import { assert } from 'chai';
import { itr8FromArrayAsync, itr8Range, itr8ToArray } from '../..';
import { runningAverage } from './runningAverage';

describe('operators/numeric/runningAverage.ts', () => {
  it('runningAverage(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8Range(1, 10).pipe(
        runningAverage(),
        itr8ToArray
      ),
      [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5],
    );

    // async
    assert.deepEqual(
      await itr8FromArrayAsync([1, 2, 2, 4, 3]).pipe(
        runningAverage(),
        itr8ToArray
      ),
      [1, 1.5, 1.6666666666666667, 2.25, 2.4],
    );
  });

});
