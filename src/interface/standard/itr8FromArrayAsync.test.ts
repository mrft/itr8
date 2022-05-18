import { assert } from "chai";
import { itr8FromArrayAsync } from "./itr8FromArrayAsync";

describe('interface/standard/itr8FromArrayAsync.ts', () => {
  it('itr8FromArrayAsync(...) can turn an array into an async iterator', async () => {
    const b = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const iterator: AsyncIterator<string> = itr8FromArrayAsync(b) as AsyncIterator<string>;

    const next = iterator.next();
    assert.isDefined(next.then);

    assert.strictEqual((await next).value, 'a');
    assert.strictEqual((await iterator.next()).value, 'b');
    assert.strictEqual((await iterator.next()).value, 'c');
    assert.strictEqual((await iterator.next()).value, 'd');
    assert.strictEqual((await iterator.next()).value, 'e');
    assert.strictEqual((await iterator.next()).value, 'f');
    assert.strictEqual((await iterator.next()).value, 'g');
    assert.strictEqual((await iterator.next()).value, 'h');
    assert.strictEqual((await iterator.next()).value, 'i');
    assert.strictEqual((await iterator.next()).value, 'j');
    assert.strictEqual((await iterator.next()).done, true);
  });
});
