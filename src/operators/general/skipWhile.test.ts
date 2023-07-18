import { assert } from "chai";
import {
  itr8ToArray,
  itr8FromArray,
  pipe,
  itr8FromArrayAsync,
} from "../../index.js";
import { skipWhile } from "./skipWhile.js";

describe("operators/general/skipWhile.ts", () => {
  it("skipWhile(...) operator works properly", async () => {
    const srcArray = [1, 2, 3, 4, 1, 2, 6];
    assert.deepEqual(
      pipe(
        itr8FromArray(srcArray),
        skipWhile((x) => x < 4),
        itr8ToArray
      ),
      [4, 1, 2, 6],
      "skip some: sync input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile((x) => x < 4),
        itr8ToArray
      ),
      [4, 1, 2, 6],
      "skip some: async input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArray(srcArray),
        skipWhile(async (x) => x < 4),
        itr8ToArray
      ),
      [4, 1, 2, 6],
      "skip some: sync input, async whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile(async (x) => x < 4),
        itr8ToArray
      ),
      [4, 1, 2, 6],
      "skip some: async input, async whileFn fails"
    );

    // skip none
    assert.deepEqual(
      pipe(
        itr8FromArray(srcArray),
        skipWhile((x) => x > 1),
        itr8ToArray
      ),
      srcArray,
      "skip none: sync input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile((x) => x > 1),
        itr8ToArray
      ),
      srcArray,
      "skip none: async input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArray(srcArray),
        skipWhile(async (x) => x > 1),
        itr8ToArray
      ),
      srcArray,
      "skip none: sync input, async whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile(async (x) => x > 1),
        itr8ToArray
      ),
      srcArray,
      "skip none: async input, async whileFn fails"
    );

    // skip all
    assert.deepEqual(
      pipe(
        itr8FromArray(srcArray),
        skipWhile((x) => x > 0),
        itr8ToArray
      ),
      [],
      "skip all: sync input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile((x) => x > 0),
        itr8ToArray
      ),
      [],
      "skip all: async input, sync whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArray(srcArray),
        skipWhile(async (x) => x > 0),
        itr8ToArray
      ),
      [],
      "skip all: sync input, async whileFn fails"
    );

    assert.deepEqual(
      await pipe(
        itr8FromArrayAsync(srcArray),
        skipWhile(async (x) => x > 0),
        itr8ToArray
      ),
      [],
      "skip all: async input, async whileFn fails"
    );
  });
});
