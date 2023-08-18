import { assert } from "chai";
import * as fs from "fs";
import { forEach, pipe, flatten, map, zip } from "../index.js";
import { itr8FromStream } from "./stream.js";
import { gunzip } from "./gunzip.js";

describe("operators/coding_decoding/gunzip.ts", () => {
  it("gunzip(...) operator works properly", async () => {
    // create an operator that will transform the utf-8 encoded buffer/Uint8Array to text
    const utf8ToString = () =>
      map((bytes: Buffer | ArrayBuffer) => bytes.toString("utf-8"));

    // RAW BYTES VERSION
    const gunzipped = pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt.gz")),
      gunzip(),
      flatten(),
    );

    await pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      flatten(),
      zip(gunzipped),
      forEach(([a, b]) => {
        // console.log('         gzip test equality:', a, ' ?= ', b);
        assert.deepEqual(a, b);
      }),
    );

    // DECODE FROM UTF8 to JS STRING VERSION
    const gunzippedString = pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt.gz")),
      gunzip(),
      utf8ToString(),
      flatten(),
    );

    await pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      utf8ToString(),
      flatten(),
      zip(gunzippedString),
      forEach(([a, b]) => {
        // console.log('         gzip test equality:', a, ' ?= ', b);
        assert.deepEqual(a, b);
      }),
    );
  });
});
