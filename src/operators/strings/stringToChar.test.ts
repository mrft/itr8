import { assert } from "chai";
import { itr8FromArray, itr8FromArrayAsync, itr8ToArray } from "../..";
import { stringToChar } from "./stringToChar";

describe("operators/strings/stringToChar.ts", () => {
  it("stringToChar(...) operator works properly", async () => {
    const input = ["Hello", "World", "\n", "Goodbye", "Space", "!"];
    const expected = [
      "H",
      "e",
      "l",
      "l",
      "o",
      "W",
      "o",
      "r",
      "l",
      "d",
      "\n",
      "G",
      "o",
      "o",
      "d",
      "b",
      "y",
      "e",
      "S",
      "p",
      "a",
      "c",
      "e",
      "!",
    ];

    // sync
    assert.deepEqual(
      itr8ToArray(stringToChar()(itr8FromArray(input))),
      expected
    );

    // async
    assert.deepEqual(
      await itr8ToArray(stringToChar()(itr8FromArrayAsync(input))),
      expected
    );
  });
});
