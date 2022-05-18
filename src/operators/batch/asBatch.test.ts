import { assert } from 'chai';
import { itr8FromArray, itr8FromArrayAsync, itr8ToArray } from '../..';
import { asBatch } from './asBatch';
import { asNoBatch } from './asNoBatch';

describe('operators/batch/asBatch.ts', () => {
  it('asBatch(...) operator works properly', async () => {
    // sync
    const itSync = itr8FromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).pipe(asBatch());
    assert.isTrue(itSync['itr8Batch']);
    // assert.isTrue(it[Symbol.for('itr8Batch')]);
    assert.deepEqual(
      itr8ToArray(itSync.pipe(asNoBatch())),
      [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
      'map synchronous plusOne fails',
    );

    // async
    const itAsync = itr8FromArrayAsync([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).pipe(asBatch());
    assert.isTrue(itAsync['itr8Batch']);
    // assert.isTrue(it[Symbol.for('itr8Batch')]);
    assert.deepEqual(
      await itr8ToArray(itAsync.pipe(asNoBatch())),
      [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
      'map asynchronous plusOne fails',
    );
  });
});
