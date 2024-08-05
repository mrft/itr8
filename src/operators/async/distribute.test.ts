import { assert } from "chai";
import { branchAndMerge } from "./distribute.js";
import { pipe } from "../../util/index.js";
import { map } from "./map.js";
import {
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { powerMap } from "./powerMap.js";
import { runningTotal } from "../numeric/runningTotal.js";
import { identity } from "./identity.js";

const repeatEach = <TIn>(count: number) =>
  powerMap<TIn, TIn, void>(
    (nextIn, _state) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: (function* () {
          for (let i = 0; i < count; i++) {
            yield nextIn.value;
          }
        })(),
      };
    },
    () => undefined,
  );

describe("operators/general/branchAndMerge.ts", () => {
  it("branchAndMerge(...) operator works properly with 1-to-1 transIterators", async () => {
    const resultAsyncSync = await pipe(
      itr8RangeAsync(1, 4),
      branchAndMerge(
        identity(),
        map((x) => x * 2),
        runningTotal(),
      ),
      itr8ToArray,
    );
    assert.deepEqual(
      resultAsyncSync,
      [
        [1, 2, 1],
        [2, 4, 3],
        [3, 6, 6],
        [4, 8, 10],
      ],
      "async input iterator with sync transIts version",
    );

    const resultAsyncAsync = await pipe(
      itr8RangeAsync(1, 4),
      branchAndMerge(
        identity(),
        map(async (x) => x * 2),
        runningTotal(),
      ),
      itr8ToArray,
    );
    assert.deepEqual(
      resultAsyncAsync,
      [
        [1, 2, 1],
        [2, 4, 3],
        [3, 6, 6],
        [4, 8, 10],
      ],
      "async input iterator with async transIts version",
    );

    const resultSyncAsync = await pipe(
      itr8Range(1, 4),
      branchAndMerge(
        identity(),
        map(async (x) => x * 2),
        runningTotal(),
      ),
      itr8ToArray,
    );
    assert.deepEqual(
      resultSyncAsync,
      [
        [1, 2, 1],
        [2, 4, 3],
        [3, 6, 6],
        [4, 8, 10],
      ],
      "sync input iterator with async transIts version",
    );

    const resultSyncSync = pipe(
      itr8Range(1, 4),
      branchAndMerge(
        identity(),
        map((x) => x * 2),
        runningTotal(),
      ),
      itr8ToArray,
    );
    assert.deepEqual(
      resultSyncSync,
      [
        [1, 2, 1],
        [2, 4, 3],
        [3, 6, 6],
        [4, 8, 10],
      ],
      "sync input iterator with sync transIts version",
    );
  });

  it.skip("branchAndMerge(...) operator works properly with transIterators that produce a different number of output values", async () => {
    // const result = await pipe(
    //   iteratorFactory(),
    //   branchAndMerge(
    //     map((x) => x * 2),
    //     runningTotal(),
    //   ),
    //   itr8ToArray,
    // );
    // assert.deepEqual(result, [[1, 2, 1], [2, 4, 3], [3, 6, 6], [4, 8, 10]]);
  });
});
