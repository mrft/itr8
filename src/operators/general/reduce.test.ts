import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync, pipe } from "../..";
import { reduce } from "./reduce";
import { sleep } from '../../testUtils';

describe('operators/general/reduce.ts', () => {
  it('reduce(...) operator works properly', async () => {
    assert.deepEqual(
      pipe(
        itr8Range(0, 4),
        reduce({ reducer: (acc: number, cur: number) => acc + cur, initialValue: 0 }),
        itr8ToArray,
      ),
      [10],
    );

    assert.deepEqual(
      pipe(
        itr8Range(1, 999),
        // implement a simple 'count' by returning index + 1
        reduce({ reducer: (acc: number, cur: number, index: number) => index + 1, initialValue: undefined }),
        itr8ToArray,
      ),
      [999],
    );

    // async
    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        reduce({ reducer: (acc: number, cur: number) => acc + cur, initialValue: 0 }),
        itr8ToArray,
      ),
      [10],
    );

    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        // implement a simple 'count' by returning index + 1
        reduce({ reducer: (acc: number, cur: number, index: number) => index + 1, initialValue: undefined }),
        itr8ToArray,
      ),
      [5],
    );

    // async reducer function works as well
    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        reduce({
          reducer: async (acc: number, cur: number) => { await sleep(1); return acc + cur },
          initialValue: 0,
        }),
        itr8ToArray,
      ),
      [10],
    );

  });
});
