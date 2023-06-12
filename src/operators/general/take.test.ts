import { assert } from "chai";
import { itr8ToArray, itr8RangeAsync, itr8Range, pipe, forEach } from "../..";
import { take } from "./take";

describe("operators/general/take.ts", () => {
  it("take(...) operator works properly", async () => {
    // sync
    assert.deepEqual(
      pipe(itr8Range(1, 7), take(5), itr8ToArray),
      [1, 2, 3, 4, 5]
    );

    assert.deepEqual(
      pipe(itr8Range(1, 3), take(5), itr8ToArray),
      [1, 2, 3],
      "limit should return the entire input when the limit is set higher than the total nr of elements in the input"
    );

    // async
    assert.deepEqual(
      await itr8ToArray(take(5)(itr8RangeAsync(1, 7) as AsyncIterator<number>)),
      [1, 2, 3, 4, 5]
    );

    assert.deepEqual(
      await itr8ToArray(take(5)(itr8RangeAsync(1, 3) as AsyncIterator<number>)),
      [1, 2, 3],
      "limit should return the entire input when the limit is set higher than the total nr of elements in the input"
    );

    const it = itr8Range(1, 100);
    const transformedIt = pipe(it, take(5));
    // pull the transformedIterator 10 times (last 5 times should return done: true)
    pipe(
      itr8Range(0, 10),
      forEach((x) => {
        transformedIt.next();
      })
    );
    assert.deepEqual(
      it.next().value,
      6,
      "only the given amount should be pulled from the incoming iterator and not an element more"
    );

    const itAsync = itr8RangeAsync(1, 100);
    const transformedItAsync = pipe(itAsync, take(5));
    // pull the transformedIterator 10 times (last 5 times should return done: true)
    await pipe(
      itr8Range(0, 10),
      forEach(async (x) => {
        await transformedItAsync.next();
      })
    );
    assert.deepEqual(
      (await itAsync.next()).value,
      6,
      "only the given amount should be pulled from the incoming (async) iterator and not an element more"
    );
  });
});
