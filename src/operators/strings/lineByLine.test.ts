import { assert } from "chai";
import {
  itr8FromArray,
  itr8FromArrayAsync,
  itr8ToArray,
  pipe,
} from "../../index.js";
import { lineByLine } from "./lineByLine.js";

describe("operators/strings/lineByLine.ts", () => {
  it("lineByLine(...) operator works properly", async () => {
    const input1 = [
      "H",
      "e",
      "l",
      "l",
      "o",
      " ",
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
      " ",
      "S",
      "p",
      "a",
      "c",
      "e",
      "!",
    ];
    const expected1 = ["Hello World", "Goodbye Space!"];

    const input2 = ["0", "1", "\n", "0", "2", "\n", "\n", "\n", "0", "5", "\n"];
    const expected2 = ["01", "02", "", "", "05", ""];

    const input3 = ["Hel", "lo\nWorld\n\nGo", "od", "by", "e", "\nSpace", "!"];
    const expected3 = ["Hello", "World", "", "Goodbye", "Space!"];

    const input4 = [
      "Hel",
      "lo<br>World<br><br>Go",
      "od",
      "by",
      "e",
      "<br>Space",
      "!",
    ];
    const expected4 = ["Hello", "World", "", "Goodbye", "Space!"];

    // sync
    assert.deepEqual(
      pipe(itr8FromArray(input1), lineByLine(), itr8ToArray),
      expected1
    );

    assert.deepEqual(
      pipe(itr8FromArray(input2), lineByLine(), itr8ToArray),
      expected2
    );

    assert.deepEqual(
      pipe(itr8FromArray(input3), lineByLine(), itr8ToArray),
      expected3
    );

    assert.deepEqual(
      pipe(itr8FromArray(input4), lineByLine("<br>"), itr8ToArray),
      expected4
    );

    // async
    assert.deepEqual(
      await pipe(itr8FromArrayAsync(input1), lineByLine(), itr8ToArray),
      expected1
    );

    assert.deepEqual(
      await pipe(itr8FromArray(input2), lineByLine(), itr8ToArray),
      expected2
    );

    assert.deepEqual(
      await pipe(itr8FromArrayAsync(input3), lineByLine(), itr8ToArray),
      expected3
    );

    assert.deepEqual(
      await pipe(itr8FromArrayAsync(input4), lineByLine("<br>"), itr8ToArray),
      expected4
    );
  });
});
