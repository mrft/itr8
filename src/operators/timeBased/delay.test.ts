import { assert } from 'chai';
import * as FakeTimers from '@sinonjs/fake-timers';
import { itr8Range, itr8RangeAsync, itr8ToArray } from '../..';
import { delay } from './delay';

describe('operators/timeBased/delay.ts', () => {
  it('delay(...) operator works properly (async operator created with an async nextFn function)', async () => {

    const clock = FakeTimers.install(); // don't forget to uninstall the clock in a finally block !
    try {
      const itr8toArrayDelayedBy10WithSyncInputPromise = itr8ToArray(delay(10)(itr8Range(1, 7)));

      // now run all the clock ticks
      await clock.runAllAsync();

      // and then run all the assertions
      assert.deepEqual(
        await itr8toArrayDelayedBy10WithSyncInputPromise,
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on sync iterator fails',
      );

      const itr8toArrayDelayedBy10WithAsyncInputPromise = itr8ToArray(delay(10)(itr8RangeAsync(1, 7)));
      // now run all the clock ticks and uninstall the fake clock
      await clock.runAllAsync();

      // asynchronous
      assert.deepEqual(
        await itr8toArrayDelayedBy10WithAsyncInputPromise,
        [1, 2, 3, 4, 5, 6, 7],
        'async opr8Delay on async iterator fails',
      );
    } finally {
      clock.uninstall();
    }
  });
});
