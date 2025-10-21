import { assert } from "chai";
import { itr8ToArray, itr8Range, itr8RangeAsync } from "../../index.js";
import { chain } from "./chain.js";

function* generateEmptySyncIterator(): Iterator<number> {}

async function* generateEmptyAsyncIterator(): AsyncIterator<number> {}


describe("operators/general/chain.ts", () => {
  it("chain(...) operator works properly", async () => {
    assert.deepEqual(
      itr8ToArray(chain(itr8Range(4, 6))(itr8Range(1, 3))),
      [1, 2, 3, 4, 5, 6]
    );

    assert.deepEqual(
      itr8ToArray(
        chain(generateEmptySyncIterator())(itr8Range(1, 3))
      ),
      [1, 2, 3]
    );
    assert.deepEqual(
      itr8ToArray(
        chain(itr8Range(4, 6))(generateEmptySyncIterator())
      ),
      [4, 5, 6]
    );

    assert.deepEqual(
      await itr8ToArray(chain(itr8RangeAsync(4, 6))(itr8RangeAsync(1, 3))),
      [1, 2, 3, 4, 5, 6]
    );
  });

  it("chain(...) operator works properly when one iterator is synchronous and the other one is asynchroous", async () => {
    assert.deepEqual(
      await itr8ToArray(chain(itr8RangeAsync(4, 6))(itr8Range(1, 3))),
      [1, 2, 3, 4, 5, 6]
    );

    assert.deepEqual(
      await itr8ToArray(chain(itr8Range(4, 6))(itr8RangeAsync(1, 3))),
      [1, 2, 3, 4, 5, 6]
    );

    assert.deepEqual(
      await itr8ToArray(chain(generateEmptySyncIterator())(itr8RangeAsync(1, 3))),
      [1, 2, 3]
    );

    assert.deepEqual(
      await itr8ToArray(
        chain(generateEmptyAsyncIterator())(itr8Range(1, 3))
      ),
      [1, 2, 3]
    );
  });
});
