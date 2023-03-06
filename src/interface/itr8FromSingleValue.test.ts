import { assert } from "chai";
import { itr8FromSingleValue } from "./itr8FromSingleValue";

describe("interface/.ts", () => {
  it("itr8FromSingleValue(...) can turn a single value into a sync iterator", () => {
    const b = [1, 2, 7, "string"];
    const iterator: Iterator<string> = itr8FromSingleValue(
      b
    ) as Iterator<string>;

    assert.strictEqual(iterator.next().value, b);

    assert.strictEqual(iterator.next().done, true);
  });
});
