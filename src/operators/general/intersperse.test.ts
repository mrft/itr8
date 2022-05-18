import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync } from "../..";
import { intersperse } from "./intersperse";

describe('operators/general/intersperse.ts', () => {
  it('intersperse(...) operator works properly', async () => {
    assert.deepEqual(
      itr8FromArray([ 'hello', 'world', 'and', 'goodbye' ])
        .pipe(
          intersperse('|'),
          itr8ToArray,
        ),
      [ 'hello', '|', 'world', '|', 'and', '|', 'goodbye' ],
    );
    assert.deepEqual(
      itr8FromArray([ 1, 2, 3, 4 ])
        .pipe(
          intersperse(true),
          itr8ToArray,
        ),
      [ 1, true, 2, true, 3, true, 4 ],
    );

    assert.deepEqual(
      itr8FromArray([])
        .pipe(
          intersperse(true),
          itr8ToArray,
        ),
      [],
    );
  });
});
