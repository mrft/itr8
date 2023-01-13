import { assert } from 'chai';
import * as FakeTimers from '@sinonjs/fake-timers';
import { itr8Pushable, itr8ToArray } from '../..';
import { sleep } from '../../testUtils';
import { throttle } from './throttle';

describe('operators/timeBased/throttle.ts', () => {
  it('throttle(...) operator works properly', async () => {
    const clock = FakeTimers.install(); // don't forget to uninstall the clock in a finally block !
    try {
      const pushIt = itr8Pushable();
      setImmediate(async () => {
        pushIt.push(1);
        await sleep(1 * 5);
        pushIt.push(2);
        pushIt.push(3);
        await sleep(3 * 5);
        pushIt.push(4);
        await sleep(1 * 5);
        pushIt.push(5);
        await sleep(1 * 5);
        pushIt.push(6);
        await sleep(2 * 5);
        pushIt.push(7);
        await sleep(1 * 5);
        pushIt.push(8);
        pushIt.done();
      });

      const resultPromise = itr8ToArray(
        pushIt.pipe(
          throttle(3 * 5),
        ),
      );

      // now run all the clock ticks
      await clock.runAllAsync();

      // and then run the assertions
      assert.deepEqual(
        await resultPromise,
        [1, 4, 7],
      );
    } finally {
      clock.uninstall();
    }
  });
});
