import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync, pipe } from "../..";
import { sleep } from "../../testUtils";
import { runningReduce } from "./runningReduce";

describe('operators/general/runningReduce.ts', () => {
  it('runningReduce(...) operator works properly', async () => {
    assert.deepEqual(
      pipe(
        itr8Range(0, 4),
        runningReduce({ reducer: (acc: number, cur: number) => acc + cur, initialValue: 0 }),
        itr8ToArray,
      ),
      [0, 1, 3, 6, 10],
    );

    assert.deepEqual(
      pipe(
        itr8Range(10, 15),
        // implement a simple 'count' by returning index + 1
        runningReduce({ reducer: (acc: number, cur: number, index: number) => index + 1, initialValue: undefined }),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5, 6],
    );

    // async
    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        runningReduce({ reducer: (acc: number, cur: number) => acc + cur, initialValue: 0 }),
        itr8ToArray,
      ),
      [0, 1, 3, 6, 10],
    );

    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        // implement a simple 'count' by returning index + 1
        runningReduce({ reducer: (acc: number, cur: number, index: number) => index + 1, initialValue: undefined }),
        itr8ToArray,
      ),
      [1, 2, 3, 4, 5],
    );

    // async reducer function works as well
    assert.deepEqual(
      await pipe(
        itr8RangeAsync(0, 4),
        runningReduce({
          reducer: async (acc: number, cur: number) => { await sleep(1); return acc + cur },
          initialValue: 0,
        }),
        itr8ToArray,
      ),
      [0, 1, 3, 6, 10],
    );

  });
});
