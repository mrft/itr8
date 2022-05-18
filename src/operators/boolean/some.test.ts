import { assert } from 'chai';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { some } from './some';

describe('operators/boolean/some.ts', () => {
  it('some(...) operator works properly', async () => {
    const isEven = (a) => a % 2 === 0;
    assert.deepEqual(
      itr8Range(0, 7).pipe(
        some(isEven),
        itr8ToArray
      ),
      [true],
    );

    const moreThan5 = (a) => a > 5;
    assert.deepEqual(
      await itr8RangeAsync(4, -3).pipe(
        some(moreThan5),
        itr8ToArray
      ),
      [false],
    );
  });
});
