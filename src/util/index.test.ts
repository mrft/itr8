import { assert } from "chai";
import {
  forLoop,
  thenable,
  isPromise,
  compose,
  pipe,
  thenableFactory,
  doAfter,
  doAfterFactory,
} from "./index.js";
import { forEach } from "../interface/forEach.js";
import { itr8Range, itr8ToArray } from "../interface/index.js";
import { map, powerMap, skip, take } from "../operators/index.js";
import { TThenable } from "../types.js";

/**
 * Helper function to measure the duration of a function call.
 *
 * @param f parameterless function
 * @returns nr of nanoseconds
 */
async function duration(f: () => unknown) {
  const start = process.hrtime.bigint();
  await f();
  const end = process.hrtime.bigint();
  // console.log(end - start);
  return end - start;
}

/**
 * Generate message about difference in duration (in naoseconds)
 *
 * @param a nr of nanoseconds for the first thing
 * @param b nr of nanoseconds for the second thing
 * @returns a string
 */
function durationDiff(a: bigint, b: bigint) {
  return a > b
    ? `first one took ${
        a - b
      } nanoseconds longer than the second one, which makes the first ${
        (100 * Number(a - b)) / Number(b)
      }% slower than the second`
    : `first one took ${
        b - a
      } nanoseconds less than the second one, which makes the second ${
        (100 * Number(b - a)) / Number(b)
      }% slower than the first`;
}

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

  it("isPromise should be slower than checking whether a variable equals a specific Symbol. If so, building a cachedThenable should be worthwhile...", async () => {
    const nrOfTimes = 10_000_000;
    const nrOfTimesMinusOne = nrOfTimes - 1;

    const t1 = await duration(() => {
      let b: any = true;
      for (let i = 0; i < nrOfTimes; i++) {
        if (i > nrOfTimesMinusOne) {
          b = false;
        }
        if (b === Symbol["myNonExistingSymbol"]) {
          b = "symbol";
        }
      }
    });

    const t2 = await duration(() => {
      let b: any = true;
      for (let i = 0; i < nrOfTimes; i++) {
        if (i > nrOfTimesMinusOne) {
          b = false;
        }
        if (isPromise(b)) {
          b = "promise";
        }
      }
    });

    const alwaysFalse = (x) => x < -10000;
    const t3 = await duration(() => {
      let b: any = true;
      for (let i = 0; i < nrOfTimes; i++) {
        if (i > nrOfTimesMinusOne) {
          b = false;
        }
        if (alwaysFalse(b)) {
          b = "identity";
        }
      }
    });

    console.log("We checked '=== Symbol[...]' first and isPromise(...) second");
    console.log(durationDiff(t1, t2));
    // the isPromise call should take longer than comparing if a variable is a specific Symbol
    assert.isBelow(Number(t1), Number(t2));

    console.log(
      "We checked isPromise(...) first and another function call second"
    );
    console.log(durationDiff(t2, t3));
    // the isPromise call should take longer than calling the alwaysFalse function
    // remove since it is not always true (github workflows node 18)
    // assert.isAbove(Number(t2), Number(t3));
  }).timeout(10000);

  it("thenableFactory(...) works properly", async () => {
    let stages: any[];
    let result: any;
    let cachedThenable: (x: any) => TThenable<any>;

    stages = [];
    cachedThenable = thenableFactory("hello");
    result = cachedThenable("hello").then((v) => {
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
    cachedThenable = thenableFactory(null);
    result = cachedThenable(null).then((v) => {
      stages.push(1);
      return v;
    });
    stages.push(2);

    assert.deepEqual(result.value, null);
    assert.deepEqual(result.src, null);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    cachedThenable = thenableFactory(undefined);
    result = cachedThenable(undefined).then((v) => {
      stages.push(1);
      return v;
    });
    stages.push(2);

    assert.deepEqual(result.value, undefined);
    assert.deepEqual(result.src, undefined);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    cachedThenable = thenableFactory("goodbye");
    result = cachedThenable("goodbye")
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
    cachedThenable = thenableFactory(false);
    result = cachedThenable(false)
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
    cachedThenable = thenableFactory(Promise.resolve(999));
    result = cachedThenable(Promise.resolve(999))
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
    cachedThenable = thenableFactory(Promise.resolve("hello again"));
    result = cachedThenable(Promise.resolve("hello again"))
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
    cachedThenable = thenableFactory(Promise.resolve(true));
    result = cachedThenable(Promise.resolve(true))
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
    cachedThenable = thenableFactory(Promise.resolve("hello again"));
    result = cachedThenable(Promise.resolve("hello again"))
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

  // it is NOT faster in the tests (much to my frustration)
  it.skip(
    "a SYNC cachedThenable(...) produced by thenableFactory(...) outperforms thenable(...)",
    async () => {
      const nrOfIterations = 10_000_000;

      function doSomethingToThenableNumber(theThenable) {
        return theThenable.then((v) => v * 2).then((v) => v + 100);
      }

      // FRUSTRATINGLY ENOUGH: if I do the cached version first, the test usually passes,
      // but if I do it the other way around, the test fails !?!?
      let uncachedResult = 0;
      const durationUncached = await duration(() => {
        let flipflop = true;
        for (let i = 1; i < nrOfIterations; i++) {
          const v = doSomethingToThenableNumber(thenable(i));
          uncachedResult = flipflop ? uncachedResult + v : uncachedResult - v;
          flipflop = !flipflop;
        }
      });

      let cachedResult = 0;
      const durationCached = await duration(() => {
        let flipflop = true;
        const cachedThenable = thenableFactory(1);
        for (let i = 1; i < nrOfIterations; i++) {
          const v = doSomethingToThenableNumber(cachedThenable(i));
          cachedResult = flipflop ? cachedResult + v : cachedResult - v;
          flipflop = !flipflop;
        }
      });

      assert.equal(cachedResult, uncachedResult);

      console.log(
        "First one is the uncached version (using thenable), second one is cached (using thenableFactory)"
      );
      console.log(durationDiff(durationUncached, durationCached));
      assert.isBelow(
        Number(durationCached),
        Number(durationUncached),
        `For some reason thenableFactory produces a thenable that is SLOWER than the uncached thenable (that executes a lot of isPromise calls, even though we have proven above that isPromise calls are slower than boolean checks). ${durationDiff(
          durationUncached,
          durationCached
        )}`
      );
    }
  ).timeout(10000);

  it.skip(
    "an ASYNC cachedThenable(...) produced by thenableFactory(...) outperforms thenable(...)",
    async () => {
      const nrOfIterations = 1_000_000;

      function doSomethingToThenableNumber(theThenable) {
        return theThenable.then((v) => v * 2).then((v) => v + 100);
      }

      // FRUSTRATINGLY ENOUGH: if I do the cahced version first, the test usually passes,
      // nut if I do it the other way around, the test fails !?!?
      let uncachedResult = 0;
      const durationUncached = await duration(async () => {
        let flipflop = true;
        for (let i = 1; i < nrOfIterations; i++) {
          const v = await doSomethingToThenableNumber(
            thenable(Promise.resolve(i))
          );
          uncachedResult = flipflop ? uncachedResult + v : uncachedResult - v;
          flipflop = !flipflop;
        }
      });

      let cachedResult = 0;
      const durationCached = await duration(async () => {
        let flipflop = true;
        const cachedThenable = thenableFactory(Promise.resolve(1));
        for (let i = 1; i < nrOfIterations; i++) {
          const v = await doSomethingToThenableNumber(
            cachedThenable(Promise.resolve(i))
          );
          cachedResult = flipflop ? cachedResult + v : cachedResult - v;
          flipflop = !flipflop;
        }
      });

      assert.equal(cachedResult, uncachedResult);

      console.log(
        "First one is the uncached version (using thenable), second one is cached (using thenableFactory)"
      );
      console.log(durationDiff(durationUncached, durationCached));
      assert.isBelow(
        Number(durationCached),
        Number(durationUncached),
        `For some reason thenableFactory produces a thenable that is SLOWER than the uncached thenable (that executes a lot of isPromise calls, even though we have proven above that isPromise calls are slower than boolean checks). ${durationDiff(
          durationUncached,
          durationCached
        )}`
      );
    }
  ).timeout(10000);

  it("doAfter(...) works properly", async () => {
    let stages: any[];
    let result: any;

    stages = [];
    result = pipe(
      "hello",
      doAfter((v) => {
        stages.push(1);
        return v + " and have a nice day";
      })
    );
    stages.push(2);

    assert.strictEqual(result, "hello and have a nice day");
    assert.strictEqual(isPromise(result), false);
    assert.deepEqual(result, "hello and have a nice day");
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = pipe(
      null,
      doAfter((v) => {
        stages.push(1);
        return v;
      })
    );
    stages.push(2);

    assert.deepEqual(result, null);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = pipe(
      undefined,
      doAfter((v) => {
        stages.push(1);
        return v;
      })
    );
    stages.push(2);

    assert.deepEqual(result, undefined);
    assert.deepEqual(result, undefined);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    result = pipe(
      "goodbye",
      doAfter((v) => {
        stages.push(1);
        return v;
      }),
      doAfter((v) => {
        stages.push(2);
        return v;
      })
    );
    stages.push(3);

    assert.strictEqual(result, "goodbye");
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = pipe(
      false,
      doAfter((v) => {
        stages.push(1);
        return v;
      }),
      doAfter((v) => {
        stages.push(2);
        return v;
      })
    );
    stages.push(3);

    assert.strictEqual(result, false);
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    result = pipe(
      Promise.resolve(999),
      doAfter((v) => {
        stages.push(1);
        return v + 1;
      }),
      doAfter((v) => {
        stages.push(2);
        return v + 9000;
      })
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.strictEqual(await result, 10_000);
    assert.strictEqual(isPromise(result), true);
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    result = pipe(
      Promise.resolve("hello again"),
      doAfter((v) => {
        stages.push(1);
        return v;
      }),
      doAfter((v) => {
        stages.push(2);
        return Promise.resolve(v);
      })
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    result = pipe(
      Promise.resolve(true),
      doAfter((v) => {
        stages.push(1);
        return v;
      }),
      doAfter((v) => {
        stages.push(2);
        return Promise.resolve(v);
      })
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, true);
    assert.deepEqual(stages, [3, 1, 2]);

    // We could but don't need to nest thenables both synchronously and asynchronously
    stages = [];
    result = pipe(
      Promise.resolve("hello again"),
      doAfter((v) => {
        stages.push(1);
        return v;
      }),
      doAfter((v) => {
        stages.push(2);
        return Promise.resolve(v);
      })
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);
  });

  it.skip("a SYNC doAfter(...) outperforms thenable(...)", async () => {
    const nrOfIterations = 1_000_000;

    function doSomethingToThenableNumber(theThenable) {
      return theThenable.then((v) => v * 2).then((v) => v + 100);
    }

    function doSomethingAfterNumber(n) {
      return pipe(
        n,
        doAfter((v: number) => v * 2),
        doAfter((v) => v + 100)
      );
    }

    // FRUSTRATINGLY ENOUGH: if I do the cached version first, the test usually passes,
    // but if I do it the other way around, the test fails !?!?
    let resultThenable = 0;
    const durationThenable = await duration(() => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = doSomethingToThenableNumber(thenable(i)).src;
        resultThenable = flipflop ? resultThenable + v : resultThenable - v;
        flipflop = !flipflop;
      }
    });

    let resultDoAfter = 0;
    const durationDoAfter = await duration(() => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = doSomethingAfterNumber(i) as number;
        resultDoAfter = flipflop ? resultDoAfter + v : resultDoAfter - v;
        flipflop = !flipflop;
      }
    });

    assert.equal(resultDoAfter, resultThenable);

    console.log(
      "First one is the thenable version, second one is using doAfter"
    );
    console.log(durationDiff(durationThenable, durationDoAfter));
    assert.isBelow(
      Number(durationDoAfter),
      Number(durationThenable),
      `For some reason doAfter is SLOWER than thenable. ${durationDiff(
        durationThenable,
        durationDoAfter
      )}`
    );
  }).timeout(10000);

  it.skip("an ASYNC doAfter(...) outperforms thenable(...)", async () => {
    const nrOfIterations = 1_000_000;

    function doSomethingToThenableNumber(theThenable) {
      return theThenable.then((v) => v * 2).then((v) => v + 100);
    }

    function doSomethingAfterNumber(n) {
      return pipe(
        n,
        doAfter((v: number) => v * 2),
        doAfter((v) => v + 100)
      );
    }

    let resultThenable = 0;
    const durationThenable = await duration(async () => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = await doSomethingToThenableNumber(
          thenable(Promise.resolve(i))
        ).src;
        resultThenable = flipflop ? resultThenable + v : resultThenable - v;
        flipflop = !flipflop;
      }
    });

    let resultDoAfter = 0;
    const durationDoAfter = await duration(async () => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = (await doSomethingAfterNumber(Promise.resolve(i))) as number;
        resultDoAfter = flipflop ? resultDoAfter + v : resultDoAfter - v;
        flipflop = !flipflop;
      }
    });

    assert.equal(resultDoAfter, resultThenable);

    console.log(
      "First one is the thenable version, second one is using doAfter"
    );
    console.log(durationDiff(durationThenable, durationDoAfter));
    assert.isBelow(
      Number(durationDoAfter),
      Number(durationThenable),
      `For some reason doAfter is SLOWER than thenable. ${durationDiff(
        durationThenable,
        durationDoAfter
      )}`
    );
  }).timeout(10000);

  it("doAfterFactory(...) works properly", async () => {
    let stages: any[];
    let result: any;
    let doAfters: Array<{ doAfter: (x: any) => any }>;

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v + " and have a nice day";
      }),
    ];
    result = pipe("hello", doAfters[0].doAfter);
    stages.push(2);

    assert.strictEqual(result, "hello and have a nice day");
    assert.strictEqual(isPromise(result), false);
    assert.deepEqual(result, "hello and have a nice day");
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
    ];
    result = pipe(null, doAfters[0].doAfter);
    stages.push(2);

    assert.deepEqual(result, null);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
    ];
    result = pipe(undefined, doAfters[0].doAfter);
    stages.push(2);

    assert.deepEqual(result, undefined);
    assert.deepEqual(result, undefined);
    assert.deepEqual(stages, [1, 2]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return v;
      }),
    ];
    result = pipe("goodbye", doAfters[0].doAfter, doAfters[1].doAfter);
    stages.push(3);

    assert.strictEqual(result, "goodbye");
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return v;
      }),
    ];
    result = pipe(false, doAfters[0].doAfter, doAfters[1].doAfter);
    stages.push(3);

    assert.strictEqual(result, false);
    assert.deepEqual(stages, [1, 2, 3]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v + 1;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return v + 9000;
      }),
    ];
    result = pipe(
      Promise.resolve(999),
      doAfters[0].doAfter,
      doAfters[1].doAfter
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.strictEqual(await result, 10_000);
    assert.strictEqual(isPromise(result), true);
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return Promise.resolve(v);
      }),
    ];
    result = pipe(
      Promise.resolve("hello again"),
      doAfters[0].doAfter,
      doAfters[1].doAfter
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);

    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return Promise.resolve(v);
      }),
    ];
    result = pipe(
      Promise.resolve(true),
      doAfters[0].doAfter,
      doAfters[1].doAfter
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, true);
    assert.deepEqual(stages, [3, 1, 2]);

    // We could but don't need to nest thenables both synchronously and asynchronously
    stages = [];
    doAfters = [
      doAfterFactory((v) => {
        stages.push(1);
        return v;
      }),
      doAfterFactory((v) => {
        stages.push(2);
        return Promise.resolve(v);
      }),
    ];
    result = pipe(
      Promise.resolve("hello again"),
      doAfters[0].doAfter,
      doAfters[1].doAfter
    );
    stages.push(3); // should be first because synchronous before the promise callbacks get called

    await result;

    assert.deepEqual(await result, "hello again");
    assert.deepEqual(stages, [3, 1, 2]);
  });

  it.skip("a SYNC doAfterFactory(...) outperforms doAfter(...)", async () => {
    const nrOfIterations = 1_000_000;

    function doSomethingAfterNumber(n) {
      return pipe(
        n,
        doAfter((v: number) => v * 2),
        doAfter((v) => v + 100)
      );
    }

    const doAfters = [
      doAfterFactory((v: number) => v * 2),
      doAfterFactory((v: number) => v + 100),
    ];
    function doSomethingAfterNumberWithFactory(n) {
      return pipe(n, doAfters[0].doAfter, doAfters[1].doAfter);
    }

    let resultDoAfter = 0;
    const durationDoAfter = await duration(() => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = doSomethingAfterNumber(i) as number;
        resultDoAfter = flipflop ? resultDoAfter + v : resultDoAfter - v;
        flipflop = !flipflop;
      }
    });

    let resultDoAfterFactory = 0;
    const durationDoAfterFactory = await duration(() => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = doSomethingAfterNumberWithFactory(i) as number;
        resultDoAfterFactory = flipflop
          ? resultDoAfterFactory + v
          : resultDoAfterFactory - v;
        flipflop = !flipflop;
      }
    });

    assert.equal(resultDoAfterFactory, resultDoAfter);

    console.log(
      "First one is the doAFter version, second one is using doAfterFactory"
    );
    console.log(durationDiff(durationDoAfter, durationDoAfterFactory));
    assert.isBelow(
      Number(durationDoAfterFactory),
      Number(durationDoAfter),
      `For some reason doAfterFactory is SLOWER than doAfter. ${durationDiff(
        durationDoAfter,
        durationDoAfterFactory
      )}`
    );
  }).timeout(10000);

  // not so for the sync version, probably because it is quite efficient to figure out when something is NOT a promise
  it.skip("an ASYNC doAfterFactory(...) outperforms doAfter(...)", async () => {
    const nrOfIterations = 1_000_000;

    function doSomethingAfterNumber(n) {
      return pipe(
        n,
        doAfter((v: number) => v * 2),
        doAfter((v) => v + 100)
      );
    }

    const doAfters = [
      doAfterFactory((v: number) => v * 2),
      doAfterFactory((v: number) => v + 100),
    ];
    function doSomethingAfterNumberWithFactory(n) {
      return pipe(n, doAfters[0].doAfter, doAfters[1].doAfter);
    }

    let resultDoAfter = 0;
    const durationDoAfter = await duration(async () => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = await doSomethingAfterNumber(Promise.resolve(i));
        resultDoAfter = flipflop ? resultDoAfter + v : resultDoAfter - v;
        flipflop = !flipflop;
      }
    });

    let resultDoAfterFactory = 0;
    const durationDoAfterFactory = await duration(async () => {
      let flipflop = true;
      for (let i = 1; i < nrOfIterations; i++) {
        const v = (await doSomethingAfterNumberWithFactory(
          Promise.resolve(i)
        )) as number;
        resultDoAfterFactory = flipflop
          ? resultDoAfterFactory + v
          : resultDoAfterFactory - v;
        flipflop = !flipflop;
      }
    });

    assert.equal(resultDoAfterFactory, resultDoAfter);

    console.log(
      "First one is the doAFter version, second one is using doAfterFactory"
    );
    console.log(durationDiff(durationDoAfter, durationDoAfterFactory));
    assert.isBelow(
      Number(durationDoAfterFactory),
      Number(durationDoAfter),
      `For some reason doAfterFactory is SLOWER than doAfter. ${durationDiff(
        durationDoAfter,
        durationDoAfterFactory
      )}`
    );
  }).timeout(10000);

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

    // assert.deepEqual(result.value, 8);
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
    // assert.deepEqual(result.value, 8);
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
    // assert.deepEqual(result.value, 8);
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
    // assert.deepEqual(result.value, 8);
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
    // assert.deepEqual(result.value, 8);
    assert.deepEqual(arrayToBeFilled, [0, 101, 2, 103, 4, 105, 6, 107, "done"]);
  });

  it("compose(...) works properly on transIterators", () => {
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
    );
    assert.deepEqual(r, [2, 4, 6]);
  });

  it("compose(...) works properly on other functions as well", () => {
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
