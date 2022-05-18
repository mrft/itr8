import { assert } from "chai";
import { itr8FromString } from "./itr8FromString";

describe('interface/standard/.ts', () => {
  it('itr8FromString(...) can turn a string into a sync iterator', () => {
    const iterator: Iterator<string> = itr8FromString('hello') as Iterator<string>;

    assert.strictEqual(iterator.next().value, 'h');
    assert.strictEqual(iterator.next().value, 'e');
    assert.strictEqual(iterator.next().value, 'l');
    assert.strictEqual(iterator.next().value, 'l');
    assert.strictEqual(iterator.next().value, 'o');
    assert.strictEqual(iterator.next().done, true);
  });
});
