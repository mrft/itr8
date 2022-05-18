import { assert } from "chai";
import { itr8FromSingleValueAsync } from "./itr8FromSingleValueAsync";

describe('interface/standard/.ts', () => {
  it('itr8FromSingleValueAsync(...)can turn a single value into an async iterator', async () => {
    const b = { someKey: 'value', otherKey: true, thirdKey: 234 };
    const iterator: AsyncIterator<string> = itr8FromSingleValueAsync(b) as AsyncIterator<string>;

    const next = iterator.next();
    assert.isDefined(next.then);

    assert.strictEqual((await next).value, b);

    assert.strictEqual((await iterator.next()).done, true);
  });
});
