import { assert } from "chai";
import * as Stream from "stream";

import {
  itr8ToArray,
  itr8Range,
  average,
  groupPer,
  take,
  skip,
  map,
  filter,
  pipe,
} from "./index.js";
import { hrtime } from "process";

/**
 * A function that will produce a readable NodeJS stream based on an
 * array, where a new item will be pushed every 10ms.
 */
const arrayToStream = (arr: any[], timeBetweenChunks = 10) => {
  const readable = new Stream.Readable({ objectMode: true });

  readable._read = () => {
    // empty
  };

  arr.forEach((item, index) =>
    setTimeout(() => readable.push(item), index * timeBetweenChunks)
  );

  // no more data
  setTimeout(() => readable.push(null), arr.length * timeBetweenChunks);

  return readable;
};

/**
 * @param n the prime number you want (the 1st is 2, the 2nd is 3, the 3rd is 5 etc.)
 * @returns the prime number corresponding to the given index
 */
function nthPrime(n: number): number {
  const primes = [2];
  let i = 3;
  let count = 1;
  while (count < n) {
    let isPrime = true;
    for (let j = 0; j < primes.length; j++) {
      if (i % primes[j] === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(i);
      count++;
    }
    i += 2;
  }
  return primes[n - 1];
}

////////////////////////////////////////////////////////////////////////////////
//
// The actual test suite starts here
//
////////////////////////////////////////////////////////////////////////////////

describe("first test the util functions used in the test suite", () => {
  it("Check if arrayToStream really produces a readable nodejs stream", async () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const readStream = arrayToStream(arr);

    const resultOfReadingTheStream = await new Promise(
      (resolve /*, reject*/) => {
        let arrayRead: any[] = [];
        readStream.on("data", (data) => {
          arrayRead = [...arrayRead, data];
          // console.log('received data from stream', data);
        });
        readStream.on("end", () => resolve(arrayRead));
      }
    );

    assert.deepEqual(resultOfReadingTheStream, arr);
  });
});

describe("itr8 test suite", () => {
  describe("General perf and mem tests to prove the concept", () => {
    describe("Check speed", () => {
      it("compare the speed of native arrays with the iterator versions", () => {
        const rangeMax = 100;
        const myLimit = 5;

        const nthPrimeCallsIt: number[] = [];
        let resultIt: number[] = [];
        const avgDurationIt = pipe(
          itr8Range(1, 10),
          map((_x) => {
            const start = hrtime.bigint();
            resultIt = pipe(
              itr8Range(1, rangeMax),
              map((x) => {
                nthPrimeCallsIt.push(x);
                return nthPrime(x + 500);
              }),
              filter((x) => x % 10 === 3), // only keep the ones ending with 3
              skip(5),
              take(myLimit),
              itr8ToArray
            ) as number[];
            const duration = Number(hrtime.bigint() - start) / 1_000_000;
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value
        );

        const nthPrimeCallsArr: number[] = [];
        let resultArr: number[] = [];
        const avgDurationArr = pipe(
          itr8Range(1, 10),
          map((_x) => {
            const start = hrtime.bigint();
            resultArr = (itr8ToArray(itr8Range(1, rangeMax)) as number[])
              .map((x) => {
                nthPrimeCallsArr.push(x);
                return nthPrime(x + 500);
              })
              .filter((x) => x % 10 === 3) // only keep the ones ending with 3
              .slice(5)
              .slice(0, myLimit);
            const duration = Number(hrtime.bigint() - start) / 1_000_000;
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value
        );

        console.log(
          "        - [native arrays versus iterators]",
          "itr8 took",
          avgDurationIt,
          `(${resultIt.length} results)`,
          "array took",
          avgDurationArr,
          `(${resultArr.length} results)`
        );
        console.log(
          "        - [native arrays versus iterators]",
          "itr8 called nthPrime",
          nthPrimeCallsIt.length,
          "times",
          "-",
          "array called nthPrime",
          nthPrimeCallsArr.length,
          "times"
        );

        assert.equal(resultIt.length, resultArr.length);
        assert.deepEqual(resultIt, resultArr);
        assert.isBelow(nthPrimeCallsIt.length, nthPrimeCallsArr.length);

        // iterators should be faster than creating the intermediate arrays
        assert.isBelow(avgDurationIt, avgDurationArr);
      }).timeout(1000);
    });

    describe("Check a really large set", () => {
      it("when running over a really large set, we should not run out of memory", async () => {
        const mem = process.memoryUsage();
        console.log(
          "heap mem left",
          (mem.heapTotal - mem.heapUsed) / 1024 / 1024,
          "MB"
        );

        const words = [
          "one ------------------------------------------------------------",
          "two ------------------------------------------------------------",
          "three ----------------------------------------------------------",
          "four -----------------------------------------------------------",
          "five -----------------------------------------------------------",
          "six ------------------------------------------------------------",
          "seven ----------------------------------------------------------",
          "eight ----------------------------------------------------------",
          "nine -----------------------------------------------------------",
        ];
        function* syncGen() {
          while (true) {
            const word = words[Math.floor(Math.random() * 10)];
            yield `${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word}`;
          }
        }
        async function* asyncGen() {
          while (true) {
            const word = words[Math.floor(Math.random() * 10)];
            yield `${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word} ${word}`;
          }
        }

        const startIt = hrtime.bigint();
        const itSync = pipe(
          syncGen(),
          take(1_000_000),
          map((x) => (x.startsWith("nine") ? `9: ${x}` : x)),
          groupPer(10)
        ) as Iterator<string>;
        let syncCounter = 0;
        for (let x = itSync.next(); !x.done; x = await itSync.next()) {
          syncCounter++;
        }
        const durationIt = Number(hrtime.bigint() - startIt) / 1_000_000;

        console.log(
          "        - [mem usage for really large set]",
          "itr8 took",
          durationIt
        );

        assert.equal(syncCounter, 100_000);

        const startItAsync = hrtime.bigint();
        const itAsync = pipe(
          asyncGen(),
          take(1_000_000),
          map((x) => (x.startsWith("nine") ? `9: ${x}` : x)),
          groupPer(10)
        );
        let asyncCounter = 0;
        for (let x = await itAsync.next(); !x.done; x = await itAsync.next()) {
          asyncCounter++;
        }
        const durationItAsync =
          Number(hrtime.bigint() - startItAsync) / 1_000_000;

        console.log(
          "      - [mem usage for really large set]",
          "itr8 async took",
          durationItAsync
        );

        assert.equal(asyncCounter, 100_000);
      }).timeout(8_000);
    });
  });
});
