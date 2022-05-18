import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { delay } from './delay';

describe('operators/timeBased/delay.ts', () => {
  it('delay(...) operator works properly (async operator created with an async nextFn function)', async () => {
    assert.deepEqual(
      await itr8ToArray(delay(10)(itr8Range(1, 7))),
      [1, 2, 3, 4, 5, 6, 7],
      'async opr8Delay on sync iterator fails',
    );

    // asynchronous
    assert.deepEqual(
      await itr8ToArray(delay(10)(itr8RangeAsync(1, 7))),
      [1, 2, 3, 4, 5, 6, 7],
      'async opr8Delay on async iterator fails',
    );
  });
});
