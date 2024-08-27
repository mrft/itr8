import { assert } from "chai";
import { distribute } from "./distribute.js";
import { pipe } from "../../util/index.js";
import {
  itr8Range,
  itr8RangeAsync,
  itr8ToArray,
} from "../../interface/index.js";
import { tap } from "../general/tap.js";
import { map } from "../general/map.js";
describe("operators/async/distribute.ts", () => {
  it("distribute(...) operator works properly", async () => {
    // test with synchronous input, but at this time the output will always be asynchronous
    // this should change in a future version

    //#region test the synchronous input iterator (without awaits)
    {
      /**
       * the array where we keep track of what has been read from the input iterator
       * (so we can test that it is as passive as possible)
       */
      const readFromInput: Array<number> = [];
      const iterator = pipe(
        itr8Range(1, 8),
        tap((x) => readFromInput.push(x)),
        map((x) => [x % 2 ? "odd" : "even", x] as [string, number]),
        distribute(),
      ) as unknown as IterableIterator<[string, number]>;
      const [oddCategory, oddIterator] = iterator.next().value;
      assert.equal(oddCategory, "odd");
      assert.deepEqual(readFromInput, [1]);
      assert.equal(oddIterator.next().value, 1);
      assert.deepEqual(readFromInput, [1]);
      assert.equal(oddIterator.next().value, 3);
      assert.deepEqual(readFromInput, [1, 2, 3]);
      assert.equal(oddIterator.next().value, 5);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);

      const [evenCategory, evenIterator] = iterator.next().value;
      assert.equal(evenCategory, "even");
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);

      // in order to figure out that there are no more categories, the entite input iterator needs to be read
      assert.equal(iterator.next().done, true);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5, 6, 7, 8]);

      assert.equal(evenIterator.next().value, 2);
      assert.equal(evenIterator.next().value, 4);
      assert.equal(evenIterator.next().value, 6);

      assert.equal(
        (await oddIterator.next()).value,
        7,
        "last value of oddIterator",
      );
      assert.equal(oddIterator.next().done, true);

      assert.equal(evenIterator.next().value, 8, "last value of evenIterator");
      assert.equal(evenIterator.next().done, true);
    }
    //#endregion test the synchronous input iterator (without awaits)

    //#region test the asynchronous input iterator (with awaits)
    {
      /**
       * the array where we keep track of what has been read from the input iterator
       * (so we can test that it is as passive as possible)
       */
      const readFromInput: Array<number> = [];
      const iterator = pipe(
        itr8RangeAsync(1, 8),
        tap((x) => readFromInput.push(x)),
        map<number, [string, number]>((x) => [x % 2 ? "odd" : "even", x]),
        distribute(),
      );
      const [oddCategory, oddIterator] = (await iterator.next()).value;
      assert.equal(oddCategory, "odd");
      assert.deepEqual(readFromInput, [1]);
      assert.equal((await oddIterator.next()).value, 1);
      assert.deepEqual(readFromInput, [1]);
      assert.equal((await oddIterator.next()).value, 3);
      assert.deepEqual(readFromInput, [1, 2, 3]);
      assert.equal((await oddIterator.next()).value, 5);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);

      const [evenCategory, evenIterator] = (await iterator.next()).value;
      assert.equal(evenCategory, "even");
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);
      assert.equal((await evenIterator.next()).value, 2);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);
      assert.equal((await evenIterator.next()).value, 4);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5]);
      assert.equal((await evenIterator.next()).value, 6);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5, 6]);

      assert.equal(
        (await oddIterator.next()).value,
        7,
        "last value of oddIterator",
      );
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5, 6, 7]);
      assert.equal((await oddIterator.next()).done, true);
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5, 6, 7, 8]);

      assert.equal(
        (await evenIterator.next()).value,
        8,
        "last value of evenIterator",
      );
      assert.deepEqual(readFromInput, [1, 2, 3, 4, 5, 6, 7, 8]);
      assert.equal((await evenIterator.next()).done, true);

      assert.equal((await iterator.next()).done, true);
    }
    //#endregion test the asynchronous input iterator (with awaits)
  });
});
