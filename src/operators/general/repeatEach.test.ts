import { assert } from "chai";
import {
  itr8ToArray,
  itr8FromArray,
  itr8FromArrayAsync,
  itr8Range,
  pipe,
} from "../..";
import { repeatEach } from "./repeatEach";

describe("operators/general/repeatEach.ts", () => {
  it("repeatEach(...) operator works properly", async () => {
    assert.deepEqual(
      pipe(
        itr8FromArray(["hello", "world", "and", "goodbye"]),
        repeatEach(2),
        itr8ToArray
      ),
      ["hello", "hello", "world", "world", "and", "and", "goodbye", "goodbye"]
    );
    assert.deepEqual(
      pipe(itr8FromArray([1, 2, 3, 4]), repeatEach(5), itr8ToArray),
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4]
    );

    assert.deepEqual(pipe(itr8FromArray([]), repeatEach(500), itr8ToArray), []);

    assert.deepEqual(pipe(itr8Range(1, 10), repeatEach(0), itr8ToArray), []);

    assert.deepEqual(pipe(itr8Range(1, 10), repeatEach(-10), itr8ToArray), []);
  });
});
