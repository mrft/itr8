import { assert } from "chai";
import {
  itr8ToArray,
  itr8FromArray,
  itr8FromArrayAsync,
  itr8Range,
  pipe,
} from "../../index.js";
import { repeat } from "./repeat.js";

describe("operators/general/repeat.ts", () => {
  it("repeat(...) operator works properly", async () => {
    assert.deepEqual(
      pipe(
        itr8FromArray(["hello", "world", "and", "goodbye"]),
        repeat(2),
        itr8ToArray,
      ),
      ["hello", "world", "and", "goodbye", "hello", "world", "and", "goodbye"],
    );
    assert.deepEqual(
      await pipe(itr8FromArrayAsync([1, 2, 3, 4]), repeat(5), itr8ToArray),
      [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    );

    assert.deepEqual(pipe(itr8FromArray([]), repeat(500), itr8ToArray), []);

    assert.deepEqual(pipe(itr8Range(1, 10), repeat(0), itr8ToArray), []);

    assert.deepEqual(pipe(itr8Range(1, 10), repeat(-10), itr8ToArray), []);
  });
});
