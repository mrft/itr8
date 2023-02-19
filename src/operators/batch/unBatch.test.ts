import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from '../..';
import { asNoBatch } from './asNoBatch';
import { batch } from './batch';
import { unBatch } from './unBatch';

describe('operators/batch/unBatch.ts', () => {
  it('unbatch(...) operator works properly', async () => {
    // sync
    const itSync = pipe(itr8Range(1, 9), batch(3));
    assert.isTrue(itSync['itr8Batch']);
    // assert.isTrue(it[Symbol.for('itr8Batch')]);
    assert.deepEqual(
      pipe(
        itSync,
        unBatch(),
        // as no batch to be sure (because itr8ToArray supports batches, so you wouldn't see a difference!)
        asNoBatch(),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      'synchronous batch fails',
    );

    // async
    const itAsync = pipe(itr8RangeAsync(1, 9), batch(3));
    assert.isTrue(itAsync['itr8Batch']);
    // assert.isTrue(it[Symbol.for('itr8Batch')]);
    assert.deepEqual(
      await pipe(
        itAsync,
        unBatch(),
        // as no batch to be sure (because itr8ToArray supports batches, so you wouldn't see a difference!)
        asNoBatch(),
        itr8ToArray
      ),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      'asynchronous batch fails',
    );
  });
});
