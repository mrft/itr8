import { assert } from 'chai';
import { itr8Pushable, pipe } from '../..';
import { sleep } from '../../testUtils';
import { mostRecent } from './mostRecent';

describe('operators/async/mostRecent.ts', () => {
  it('mostRecent(...) operator works properly', async () => {
    const it = itr8Pushable<string>();
    const itOut = pipe(
      it,
      mostRecent('My initial value'),
    );

    await sleep(1);
    assert.deepEqual(await itOut.next(), { value: 'My initial value' });
    assert.deepEqual(await itOut.next(), { value: 'My initial value' });
    await sleep(1);
    assert.deepEqual(await itOut.next(), { value: 'My initial value' });

    it.push('2nd value');

    await sleep(1);
    assert.deepEqual(await itOut.next(), { value: '2nd value' });
    assert.deepEqual(await itOut.next(), { value: '2nd value' });

    it.push('third value');
    // sync so 'third value' promise not resolved yet
    assert.deepEqual(await itOut.next(), { value: '2nd value' }, 'third value promise should not be resolved here yet');
    await sleep(1);
    assert.deepEqual(await itOut.next(), { value: 'third value' });
    assert.deepEqual(await itOut.next(), { value: 'third value' });
    assert.deepEqual(await itOut.next(), { value: 'third value' });
    assert.deepEqual(await itOut.next(), { value: 'third value' });
    await sleep(1);
    assert.deepEqual(await itOut.next(), { value: 'third value' });

    // see evey value at least once!!!
    it.push('fourth value');
    it.push('fifth value');
    // sync so 'third value' promise not resolved yet
    assert.deepEqual(await itOut.next(), { value: 'third value' });
    await sleep(0);
    assert.deepEqual(await itOut.next(), { value: 'fourth value' });
    await sleep(0);
    assert.deepEqual(await itOut.next(), { value: 'fifth value' });

    it.done();
    // sync so 'done' promise not resolved yet
    assert.deepEqual(await itOut.next(), { value: 'fifth value' });
    await sleep(1);
    assert.deepEqual((await itOut.next()).done, true);
    assert.deepEqual((await itOut.next()).done, true);
    assert.deepEqual((await itOut.next()).done, true);

  });
});
