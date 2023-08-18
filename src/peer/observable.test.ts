import { assert } from "chai";
import * as Stream from "stream";

import {
  itr8ToArray,
  itr8Range,
  itr8RangeAsync,
  itr8FromArray,
} from "../index.js";
import { itr8FromObservable, itr8ToObservable } from "./observable.js";
import { concatMap, from, of, delay as rxjsDelay } from "rxjs";
import { itr8ToReadableStream } from "./stream.js";

const a: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const b: string[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

////////////////////////////////////////////////////////////////////////////////
//
// The actual test suite starts here
//
////////////////////////////////////////////////////////////////////////////////

describe("peer/observable.ts", () => {
  it("itr8FromObservable works properly", async () => {
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = from(a).pipe(
      concatMap((item) => of(item).pipe(rxjsDelay(1))),
    );
    assert.deepEqual(await itr8ToArray(itr8FromObservable(observable)), a);
  });

  it("itr8FromObservable works properly", async () => {
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = from(a).pipe(
      concatMap((item) => of(item).pipe(rxjsDelay(1))),
    );
    assert.deepEqual(await itr8ToArray(itr8FromObservable(observable)), a);
  });

  it("itr8ToObservable works properly", async () => {
    // from(a) is enough in theory, but I wanted to spread it over time a bit, hence the pipe and delay stuff
    const observable = itr8ToObservable(itr8FromArray(a)).pipe(
      concatMap((item) => of(item).pipe(rxjsDelay(1))),
    );
    assert.deepEqual(await itr8ToArray(itr8FromObservable(observable)), a);
  });
});
