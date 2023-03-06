import { assert } from "chai";
import * as Stream from "stream";

import {
  itr8ToArray,
  itr8Range,
  itr8FromIterator,
  average,
  groupPer,
  take,
  skip,
  map,
  filter,
  pipe,
} from "./";
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
 * process.hrtime() method can be used to measure execution time, but returns an array
 *
 * @param {Array<Integer>} hrtime tuple [seconds, nanoseconds]
 * @returns the input translated to milliseconds
 */
function hrtimeToMilliseconds([seconds, nanoseconds]: [
  number,
  number
]): number {
  return seconds * 1000 + nanoseconds / 1000000;
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
        const rangeMax = 20_000;
        const myLimit = 200;

        let resultIt: number[] = [];
        const avgDurationIt = pipe(
          itr8Range(0, 10),
          map((_x) => {
            const start = hrtime();
            resultIt = pipe(
              itr8Range(1, rangeMax),
              map((x) => x / 2),
              filter((x) => x % 3 === 0),
              skip(5),
              take(myLimit),
              itr8ToArray
            ) as number[];
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value
        );

        let resultArr: number[] = [];
        const avgDurationArr = pipe(
          itr8Range(0, 10),
          map((_x) => {
            const start = hrtime();
            resultArr = (itr8ToArray(itr8Range(1, rangeMax)) as number[])
              .map((x) => x / 2)
              .filter((x) => x % 3 === 0)
              .slice(5)
              .slice(0, myLimit);
            const duration = hrtimeToMilliseconds(hrtime(start));
            return duration;
          }),
          average(),
          (it) => (it.next() as IteratorResult<number>).value
        );

        console.log(
          "      - [native arrays versus iterators]",
          "itr8 took",
          avgDurationIt,
          `(${resultIt.length} results)`,
          "array took",
          avgDurationArr,
          `(${resultArr.length} results)`
        );

        assert.equal(resultIt.length, resultArr.length);
        assert.deepEqual(resultIt, resultArr);

        // iterators should be faster than creating the intermediate arrays
        assert.isBelow(avgDurationIt, avgDurationArr);
      }).timeout(2000);
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

        const startIt = hrtime();
        const itSync = pipe(
          itr8FromIterator(syncGen()),
          take(1_000_000),
          map((x) => (x.startsWith("nine") ? `9: ${x}` : x)),
          groupPer(10)
        ) as Iterator<string>;
        let syncCounter = 0;
        for (let x = itSync.next(); !x.done; x = await itSync.next()) {
          syncCounter++;
        }
        const durationIt = hrtimeToMilliseconds(hrtime(startIt));

        console.log(
          "      - [mem usage for really large set]",
          "itr8 took",
          durationIt
        );

        assert.equal(syncCounter, 100_000);

        const startItAsync = hrtime();
        const itAsync = pipe(
          itr8FromIterator(asyncGen()),
          take(1_000_000),
          map((x) => (x.startsWith("nine") ? `9: ${x}` : x)),
          groupPer(10)
        );
        let asyncCounter = 0;
        for (let x = await itAsync.next(); !x.done; x = await itAsync.next()) {
          asyncCounter++;
        }
        const durationItAsync = hrtimeToMilliseconds(hrtime(startItAsync));

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
