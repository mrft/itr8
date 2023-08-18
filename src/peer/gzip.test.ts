import { assert } from "chai";
import * as fs from "fs";
import { forEach, pipe, flatten, zip } from "../index.js";
import { itr8FromStream } from "./stream.js";
import { gzip } from "./gzip.js";
import { gunzip } from "./gunzip.js";

describe("operators/coding_decoding/gzip.ts", () => {
  it("gzip(...) operator works properly", async () => {
    // test by gzipping and gunzipping again and comparing with the input file
    const gzippedUnzipped = pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      flatten(),
      gzip(),
      gunzip(),
      flatten(),
    );

    await pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      flatten(),
      zip(gzippedUnzipped),
      forEach(([a, b]) => {
        // console.log('         gzip test equality:', a, ' ?= ', b);
        assert.deepEqual(a, b);
      }),
    );
  }).timeout(2_000);
});
