import { assert } from "chai";
import { itr8FromStringAsync } from "./itr8FromStringAsync.js";

describe("interface/itr8FromStringAsync.ts", () => {
  it("itr8FromStringAsync(...) can turn a string into an async iterator", async () => {
    const iterator: AsyncIterator<string> = itr8FromStringAsync(
      "hello",
    ) as AsyncIterator<string>;

    const next = iterator.next();
    assert.isDefined(next.then);

    assert.strictEqual((await next).value, "h");
    assert.strictEqual((await iterator.next()).value, "e");
    assert.strictEqual((await iterator.next()).value, "l");
    assert.strictEqual((await iterator.next()).value, "l");
    assert.strictEqual((await iterator.next()).value, "o");
    assert.strictEqual((await iterator.next()).done, true);
  });
});
