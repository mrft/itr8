import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync } from "../..";
import { split } from "./split";

describe('operators/general/split.ts', () => {
  it('split(...) operator works properly', async () => {
    const input = ['Hello', 'World', '!', 'Goodbye', 'Space', '!'];
    const input2 = ['H', 'e', 'l', 'l', 'o', 'W', 'o', 'r', 'l', 'd', '\n', 'G', 'o', 'o', 'd', 'b', 'y', 'e', 'S', 'p', 'a', 'c', 'e', '!'];

    // sync
    assert.deepEqual(
      itr8ToArray(split('!')(itr8FromArray(input))),
      [['Hello', 'World'], ['Goodbye', 'Space'], []],
    );

    assert.deepEqual(
      itr8ToArray(split('Hello')(itr8FromArray(input))),
      [[], ['World', '!', 'Goodbye', 'Space', '!']],
    );

    // async
    assert.deepEqual(
      await itr8ToArray(split('!')(itr8FromArrayAsync(input))),
      [['Hello', 'World'], ['Goodbye', 'Space'], []],
    );

    assert.deepEqual(
      await itr8ToArray(split('Hello')(itr8FromArrayAsync(input))),
      [[], ['World', '!', 'Goodbye', 'Space', '!']],
    );
  });
});
