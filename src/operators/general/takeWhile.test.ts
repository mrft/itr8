import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8FromStringAsync } from "../..";
import { takeWhile } from "./takeWhile";
import { tap } from "./tap";

describe('operators/general/takeWhile.ts', () => {
  it('takeWhile(...) operator works properly', async () => {
    let tappedValues:any;

    tappedValues = [];
    assert.deepEqual(
      itr8Range(0, 7).pipe(
        tap((v) => { tappedValues.push(v) }),
        takeWhile((x) => x < 5),
        itr8ToArray,
      ),
      [0, 1, 2, 3, 4],
    );
    // making sure the input iterator doesn't get called more often than is needed
    assert.deepEqual(tappedValues, [0, 1, 2, 3, 4, 5]);

    tappedValues = [];
    assert.deepEqual(
      await itr8FromStringAsync("Hello World!").pipe(
        tap((v) => { tappedValues.push(v) }),
        takeWhile((x) => x !== 'o'),
        itr8ToArray,
      ),
      ['H', 'e', 'l', 'l'],
    );
    // making sure the input iterator doesn't get called more often than is needed
    assert.deepEqual(tappedValues, ['H', 'e', 'l', 'l', 'o']);

  });
});
