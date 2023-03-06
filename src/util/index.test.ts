import { assert } from "chai";
import { hrtime } from "process";
import { forLoop, thenable, isPromise, compose, pipe } from ".";
import { forEach } from "../interface/forEach";
import { itr8Range, itr8ToArray } from "../interface/index";
import { map, skip, take } from "../operators";

describe("./util/index.ts", () => {
  it("thenable(...) works properly", async () => {
    let stages: any[];
    let result: any;

    stages = [];
    result = thenable("hello").then((v) => {
      stages.push(1);
      return v;
    });
    stages.push(2);

    assert.strictEqual(result.value, "hello");
    assert.strictEqual(isPromise(result.src), false);
    assert.notStrictEqual(result, "hello");
    assert.deepEqual(result.src, "hello");
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = thenable(null).then((v) => {
      stages.push(1);
      return v;
    });
    stages.push(2);

    assert.deepEqual(result.value, null);
    assert.deepEqual(result.src, null);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = thenable(undefined).then((v) => {
      stages.push(1);
      return v;
    });
    stages.push(2);

    assert.deepEqual(result.value, undefined);
    assert.deepEqual(result.src, undefined);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = thenable("goodbye")
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3);

    assert.strictEqual(result.value, "goodbye");
    assert.strictEqual(result.src, "goodbye");
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = thenable(false)
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3);

    assert.strictEqual(result.value, false);
    assert.strictEqual(result.src, false);
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = thenable(Promise.resolve(999))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return v;
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.strictEqual(await result, 999);
    assert.strictEqual(isPromise(result.src), true);
    assert.strictEqual(await result.src, 999);
    assert.strictEqual(result.value, 999);
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    result = thenable(Promise.resolve("hello again"))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(await result.src, "hello again");

    assert.deepEqual(result.value, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    result = thenable(Promise.resolve(true))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, true);
    assert.deepEqual(await result.src, true);

    assert.deepEqual(result.value, true);
    assert.deepEqual(stages, [3, 1, 2]);

    // We could but don't need to nest thenables both synchronously and asynchronously
    stages = [];
    result = thenable(Promise.resolve("hello again"))
      .then((v) => {
        stages.push(1);
        return v;
      })
      .then((v) => {
        stages.push(2);
        return Promise.resolve(v);
      });
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(result.value, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);
  });

  it("forLoop(...) works properly", async () => {
    let arrayToBeFilled: any[];
    let result: any;

    // all sync
    arrayToBeFilled = [];
    result = forLoop(
      () => 0,
      (i) => i < 8,
      (i) => i + 1,
      (i) => {
        if (i % 2 === 0) {
          arrayToBeFilled.push(i);
        } else {
          arrayToBeFilled.push(i + 100);
        }
      }
    );

    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107]);

    // async initialState
    arrayToBeFilled = [];
    result = forLoop(
      async () => 0,
      (i) => i < 8,
      (i) => i + 1,
      (i) => {
        if (i % 2 === 0) {
          arrayToBeFilled.push(i);
        } else {
          arrayToBeFilled.push(i + 100);
        }
      }
    ).then((v) => {
      arrayToBeFilled.push("done");
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result.src;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, "done"]);

    // async afterEach test
    arrayToBeFilled = [];
    result = forLoop(
      () => 0,
      async (i) => i < 8,
      (i) => i + 1,
      (i) => {
        if (i % 2 === 0) {
          arrayToBeFilled.push(i);
        } else {
          arrayToBeFilled.push(i + 100);
        }
      }
    ).then((v) => {
      arrayToBeFilled.push("done");
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, "done"]);

    // async afterEach state update
    arrayToBeFilled = [];
    result = forLoop(
      () => 0,
      (i) => i < 8,
      async (i) => i + 1,
      (i) => {
        if (i % 2 === 0) {
          arrayToBeFilled.push(i);
        } else {
          arrayToBeFilled.push(i + 100);
        }
      }
    ).then((v) => {
      arrayToBeFilled.push("done");
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, "done"]);

    // async body
    arrayToBeFilled = [];
    result = forLoop(
      () => 0,
      (i) => i < 8,
      (i) => i + 1,
      async (i) => {
        if (i % 2 === 0) {
          arrayToBeFilled.push(i);
        } else {
          arrayToBeFilled.push(i + 100);
        }
      }
    ).then((v) => {
      arrayToBeFilled.push("done");
      return v;
    });

    assert.isTrue(isPromise(result.src));
    await result;
    assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, "done"]);
  });

  it("compose(...) works properly", () => {
    const transIt = compose(
      skip<number>(5),
      take(10),
      map((x) => x * 2)
    );

    const result: number[] = itr8ToArray(
      transIt(itr8Range(1, 1000))
    ) as number[];

    assert.equal(result[0], 6 * 2);
    assert.equal(result.length, 10);

    const transIt2 = compose(
      skip<number>(5),
      take(10),
      map((x) => x * 2)
    );

    const result2: number[] = itr8ToArray(
      transIt2(itr8Range(1, 1000))
    ) as number[];

    assert.equal(result2[0], 6 * 2);
    assert.equal(result2.length, 10);

    assert.deepEqual(
      pipe(
        itr8Range(1, 1000),
        take(3),
        map((x) => x * 2),
        itr8ToArray
      ),
      [2, 4, 6]
    );

    const r: any[] = [];
    pipe(
      itr8Range(1, 1000),
      take(3),
      map((x) => x * 2),
      forEach((x) => {
        r.push(x);
      })
    ),
      assert.deepEqual(r, [2, 4, 6]);
  });

  it("compose(...) works properly", () => {
    const plusOne = (x: number) => x + 1;
    const timesTwo = (x: number) => x * 2;

    const plusOneTimesTwo = compose(plusOne, timesTwo);

    assert.equal(plusOneTimesTwo(3), 8);

    assert.equal(timesTwo(plusOne(3)), 8);
  });

  it("pipe(...) works properly", () => {
    const plusOne = (x: number) => x + 1;
    const timesTwo = (x: number) => x * 2;
    const square = (x: number) => x * x;

    // the next line should not compile due to proper type checking if the functions are chainable
    // pipe("hello", plusOne);
    // pipe( 3, plusOne, Number.parseFloat);

    assert.equal(pipe(3, plusOne, timesTwo), timesTwo(plusOne(3)));
    assert.equal(
      pipe(3, plusOne, timesTwo, square, Number.isInteger),
      Number.isInteger(square(timesTwo(plusOne(3))))
    );
  });
});
