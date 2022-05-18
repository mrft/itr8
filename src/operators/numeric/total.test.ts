import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { total } from './total';

describe('operators/numeric/total.ts', () => {
  it('total(...) operator works properly', async () => {
    // sync
    assert.deepEqual(
      itr8ToArray(total()(itr8Range(1, 4))),
      [10],
    );

    // async
    assert.deepEqual(
      await itr8ToArray(total()(itr8RangeAsync(1, 4))),
      [10],
    );
  });
});
