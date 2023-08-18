import { assert } from "chai";
import {
  itr8ToArray,
  itr8FromArray,
  itr8FromArrayAsync,
  pipe,
} from "../../index.js";
import { intersperse } from "./intersperse.js";

describe("operators/general/intersperse.ts", () => {
  it("intersperse(...) operator works properly", async () => {
    assert.deepEqual(
      pipe(
        itr8FromArray(["hello", "world", "and", "goodbye"]),
        intersperse("|"),
        itr8ToArray,
      ),
      ["hello", "|", "world", "|", "and", "|", "goodbye"],
    );
    assert.deepEqual(
      pipe(itr8FromArray([1, 2, 3, 4]), intersperse(true), itr8ToArray),
      [1, true, 2, true, 3, true, 4],
    );

    assert.deepEqual(
      pipe(itr8FromArray([]), intersperse(true), itr8ToArray),
      [],
    );
  });
});
