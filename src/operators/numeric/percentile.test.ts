import { assert } from "chai";
import { itr8Range, itr8RangeAsync, itr8ToArray, pipe } from "../../index.js";
import { percentile } from "./percentile.js";

describe("operators/numeric/percentile.ts", () => {
  it("percentile(...) operator works properly", async () => {
    /**
     * Naive implementation of the "nearest rank" method for tests.
     * https://en.wikipedia.org/wiki/Percentile#Calculation_methods
     *
     * @param percentile
     * @param input
     * @returns
     */
    function arrayPercentile(percentile: number, input: number[]) {
      const sorted = [...input].sort((a, b) => a - b);
      const rank = (percentile / 100) * input.length;
      return sorted[rank - 1];
    }

    // sync
    assert.deepEqual(pipe(itr8Range(1, 100), percentile(50), itr8ToArray), [
      arrayPercentile(50, itr8ToArray(itr8Range(1, 100)) as number[]),
    ]);

    assert.deepEqual(
      pipe(itr8Range(1, 100), percentile(90), itr8ToArray),
      // [90],
      [arrayPercentile(90, itr8ToArray(itr8Range(1, 100)) as number[])],
    );

    assert.deepEqual(
      pipe(itr8Range(1, 100), percentile(95), itr8ToArray),
      // [95],
      [arrayPercentile(95, itr8ToArray(itr8Range(1, 100)) as number[])],
    );

    // async
    assert.deepEqual(
      await pipe(itr8RangeAsync(1, 100), percentile(95), itr8ToArray),
      // [95],
      [arrayPercentile(95, itr8ToArray(itr8Range(1, 100)) as number[])],
    );
  });
});
