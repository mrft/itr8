import { assert } from "chai";
import { itr8ToArray, itr8FromArray, itr8FromArrayAsync, itr8Range } from "../..";
import { repeatEach } from "./repeatEach";

describe('operators/general/repeatEach.ts', () => {
  it('repeatEach(...) operator works properly', async () => {
    assert.deepEqual(
      itr8FromArray([ 'hello', 'world', 'and', 'goodbye' ])
        .pipe(
          repeatEach(2),
          itr8ToArray,
        ),
      [ 'hello', 'hello', 'world', 'world', 'and', 'and', 'goodbye', 'goodbye' ],
    );
    assert.deepEqual(
      itr8FromArray([ 1, 2, 3, 4 ])
        .pipe(
          repeatEach(5),
          itr8ToArray,
        ),
      [ 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4 ],
    );

    assert.deepEqual(
      itr8FromArray([])
        .pipe(
          repeatEach(500),
          itr8ToArray,
        ),
      [],
    );


    assert.deepEqual(
      itr8Range(1, 10)
        .pipe(
          repeatEach(0),
          itr8ToArray,
        ),
      [],
    );

    assert.deepEqual(
      itr8Range(1, 10)
        .pipe(
          repeatEach(-10),
          itr8ToArray,
        ),
      [],
    );

  });
});
