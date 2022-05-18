import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync, itr8Range, itr8RangeAsync } from "../..";
import { map } from "./map";

describe('operators/general/map.ts', () => {
  it('map(...) operator works properly', async () => {
    const plusOne = (a) => a + 1;
    const wrapString = (s) => `<-- ${s} -->`

    // map(plusOne)(itr8Range(4, 7));

    // synchronous
    assert.deepEqual(
      itr8ToArray(map(plusOne)(itr8Range(4, 7))),
      [5, 6, 7, 8],
      'map synchronous plusOne fails',
    );

    assert.deepEqual(
      itr8ToArray(map(wrapString)(itr8Range(4, 7))),
      ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      'map synchronous wrapString fails',
    );

    // asynchronous
    assert.deepEqual(
      await itr8ToArray(map(plusOne)(itr8RangeAsync(4, 7))),
      [5, 6, 7, 8],
      'map asynchronous plusOne fails',
    );

    assert.deepEqual(
      await itr8ToArray(map(wrapString)(itr8RangeAsync(4, 7))),
      ['<-- 4 -->', '<-- 5 -->', '<-- 6 -->', '<-- 7 -->'],
      'map asynchronous wrapString fails',
    );
  });
});
