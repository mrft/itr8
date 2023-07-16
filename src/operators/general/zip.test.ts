import { assert } from "chai";
import {
  itr8ToArray,
  itr8FromArray,
  itr8FromArrayAsync,
  pipe,
} from "../../index.js";
import { zip } from "./zip.js";

describe("operators/general/zip.ts", () => {
  it("zip(...) operator works properly", async () => {
    // sync source iterator, sync param iterator
    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 3, 4]),
        zip(itr8FromArray(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, "d"],
      ]
    );

    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 3]),
        zip(itr8FromArray(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]
    );

    assert.deepEqual(
      pipe(
        itr8FromArray([1, 2, 3, 4]),
        zip(itr8FromArray(["a", "b", "c"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, undefined],
      ]
    );

    // async source iterator, sync param iterator
    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3, 4]),
        zip(itr8FromArray(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, "d"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3]),
        zip(itr8FromArray(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3, 4]),
        zip(itr8FromArray(["a", "b", "c"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, undefined],
      ]
    );

    // sync source iterator, async param iterator
    assert.deepEqual(
      await pipe(
        itr8FromArray([1, 2, 3, 4]),
        zip(itr8FromArrayAsync(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, "d"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArray([1, 2, 3]),
        zip(itr8FromArrayAsync(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArray([1, 2, 3, 4]),
        zip(itr8FromArrayAsync(["a", "b", "c"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, undefined],
      ]
    );

    // async source iterator, async param iterator
    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3, 4]),
        zip(itr8FromArrayAsync(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, "d"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3]),
        zip(itr8FromArrayAsync(["a", "b", "c", "d"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync([1, 2, 3, 4]),
        zip(itr8FromArrayAsync(["a", "b", "c"])),
        itr8ToArray
      ),
      [
        [1, "a"],
        [2, "b"],
        [3, "c"],
        [4, undefined],
      ]
    );
  });
});
