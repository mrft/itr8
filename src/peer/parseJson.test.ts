import { assert } from 'chai';
import { intersperse, map, takeWhile, tap } from '../operators';
import { forEach, itr8ToArray, itr8RangeAsync, itr8Pushable, itr8FromIterable } from '../interface';
import { parseJson } from './parseJson';


const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

describe('operators/parse/parseJson.ts', () => {
  it('can parse json on an iterator', async () => {
    const jsonString = JSON.stringify({
      a: 'this is A',
      b: 2,
      l: ['zero', 'one', 'two', 'three'],
    });

    assert.deepEqual(
      await itr8FromIterable(jsonString).pipe(
        parseJson(['$.b']),
        itr8ToArray,
      ),
      [[2, '$.b']],
    );

    assert.deepEqual(
      await itr8FromIterable(jsonString).pipe(
        parseJson(['$.l.3']),
        itr8ToArray,
      ),
      [
        ['three', '$.l.3'],
      ],
    );

    assert.deepEqual(
      await itr8FromIterable(jsonString).pipe(
        parseJson(['$.*.*']),
        itr8ToArray,
      ),
      [
        ['zero', '$.l.0'],
        ['one', '$.l.1'],
        ['two', '$.l.2'],
        ['three', '$.l.3'],
      ],
    );

    // console.log('itr8RPushable');
    const nrOfResults = 100_000;

    const pushIt = itr8Pushable(100); // max 100 buffered items
    setTimeout(async () => {
      let c3 = 0;
      pushIt.push(`{ "meta": { "nrOfResults": ${nrOfResults} }, "results": [`);
      await itr8RangeAsync(0, nrOfResults - 1).pipe(
        map((x) => (JSON.stringify({ id: x, name: `prisoner no. ${x}` }))),
        intersperse(','),
        forEach(async (x) => {
          // if (c3 % 100_000 === 0) console.log('pushing', x);
          pushIt.push(x);
          c3++;
        }),
      );
      pushIt.push(']');
      pushIt.done();
    },
      1,
    );
    // console.log('======== Setting up foreach on pushIt');
    let counter = 0;
    let failed = false;
    await pushIt.pipe(
      parseJson(['$.results.*.name']),
      tap((x) => counter++),
      takeWhile((v) => {
        if (v[0].startsWith('prisoner no. ')) return true;
        failed = true;
        return false;
      }),
      forEach((value) => { // needed for draining the iterator !!!
        // if (counter % 100_000 === 0) console.log('                                            -> forEach', counter, value);
        // if (!failed && !value.startsWith('prisoner no. ')) {
        //   failed = true;
        //   assert.fail('value does not start with ´prisoner no.´ as expected');
        // };
      }),
    );
    assert.isFalse(failed);
    assert.equal(counter, nrOfResults);

  }).timeout(20_000);
});
