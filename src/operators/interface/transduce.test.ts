import { assert } from "chai";
import { filter, itr8OperatorFactory, itr8Pipe, itr8Range, itr8RangeAsync, itr8ToArray, map, skip, take, total } from "../..";
import { transduce } from "./transduce";

import * as transducersJs from 'transducers-js';
import { hrtime } from "process";
import { hrtimeToMilliseconds } from "../../testUtils";
import { count } from "../numeric/count";

function isReduced(x) {
  return x?.['@@transducer/reduced']; // (x instanceof Reduced) || (x && x['@@transducer/reduced']);
}

const transducerRepeat = (n:number) => (xform) => ({
  '@@transducer/init': () => xform['@@transducer/init'](),
  '@@transducer/result': (v) => xform['@@transducer/result'](v),
  '@@transducer/step': (result, input) => {
    let r = result;
    for (let i = 0; i < n; i++) {
      r = xform['@@transducer/step'](r, input);
      if (isReduced(r)) {
        break;
      }
    }
    return r;
  }
});

const opr8RepeatEach = itr8OperatorFactory<number, any, void, number>(
  (nextIn, _state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
    };
  },
  () => undefined,
);


describe('operators/interface/transduce.ts', () => {
  it('transduce(...) operator works properly', async () => {
    const isEven = (a) => a % 2 === 0;
    const moreThan5 = (a) => a > 5;

    const { comp } = transducersJs;

    assert.deepEqual(
      itr8Range(0, 2).pipe(
        transduce(transducerRepeat(2)),
        itr8ToArray
      ),
      [0, 0, 1, 1, 2, 2],
    );

    assert.deepEqual(
      itr8Range(0, 7).pipe(
        transduce(transducersJs.filter(isEven)),
        itr8ToArray
      ),
      [0, 2, 4, 6],
    );




    const startItr8 = hrtime();
    const [totalItr8] = itr8Range(-50_000, 50_000).pipe(
      filter(isEven),
      map((x) => `${x} Mississippi`),
      skip(5),
      take(49_000),
      opr8RepeatEach(3),
      count(),
      itr8ToArray,
    );
    const durationItr8 = hrtimeToMilliseconds(hrtime(startItr8));

    console.log('[transduce]       transIterators take', durationItr8, 'ms and return ', totalItr8);

    const startTransduce = hrtime();
    const [totalTransduce] = itr8Range(-50_000, 50_000).pipe(
      transduce(
        comp(
          transducersJs.filter(isEven),
          transducersJs.map((x) => `${x} Mississippi`),
          transducersJs.drop(5),
          transducersJs.take(49_000),
          transducerRepeat(3),
        ),
      ),
      count(),
      itr8ToArray,
    );
    const durationTransduce = hrtimeToMilliseconds(hrtime(startTransduce));

    console.log('[transduce] TRANSDUCERS          take', durationTransduce, 'ms and return ', totalTransduce);

    const startItr8Async = hrtime();
    const [totalItr8Async] = await itr8RangeAsync(-50_000, 50_000).pipe(
      filter(isEven),
      map((x) => `${x} Mississippi`),
      skip(5),
      take(49_000),
      opr8RepeatEach(3),
      count(),
      itr8ToArray,
    );
    const durationItr8Async = hrtimeToMilliseconds(hrtime(startItr8Async));

    console.log('[transduce] async transIterators take', durationItr8Async, 'ms and return ', totalItr8Async);

    const startTransduceAsync = hrtime();
    const [totalTransduceAsync] = await itr8RangeAsync(-50_000, 50_000).pipe(
      transduce(
        comp(
          transducersJs.filter(isEven),
          transducersJs.map((x) => `${x} Mississippi`),
          transducersJs.drop(5),
          transducersJs.take(49_000),
          transducerRepeat(3),
        ),
      ),
      count(),
      itr8ToArray,
    );
    const durationTransduceAsync = hrtimeToMilliseconds(hrtime(startTransduceAsync));

    console.log('[transduce] TRANSDUCERS async    take', durationTransduceAsync, 'ms and return ', totalTransduceAsync);

    console.log('[transduce] transducers vs transIterators time %: SYNC ', Math.round(100 * durationTransduce / durationItr8), '% ASYNC', Math.round(100 * durationTransduceAsync / durationItr8Async), '%');

  }).timeout(2000);
});
