import { assert } from 'chai';
import { itr8Pushable, itr8ToArray } from '../..';
import { sleep } from '../../testUtils';
import { debounce } from './debounce';

describe('operators/timeBased/debounce.ts', () => {
  it('debounce(...) operator works properly', async () => {
    const pushIt = itr8Pushable();
    setImmediate(async () => {
      pushIt.push(1);
      await sleep(1);
      pushIt.push(2);
      pushIt.push(3);
      await sleep(3);
      pushIt.push(4);

      await sleep(1);
      pushIt.push(5);

      await sleep(1);
      pushIt.push(6);
      pushIt.push(7);
      pushIt.push(8);
      pushIt.push(9);

      await sleep(4);
      pushIt.push(10);

      await sleep(3);
      pushIt.done();
    });
    assert.deepEqual(
      await itr8ToArray(
        pushIt.pipe(
          debounce(2),
        ),
      ),
      [1, 4, 10],
    );
  });
});
