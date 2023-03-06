import { assert } from "chai";
import * as fs from "fs";
import { forEach, pipe } from "../..";
import { itr8FromStream } from "../../peer/stream";
import { flatten } from "../general/flatten";
import { zip } from "../general/zip";
import { gunzip } from "./gunzip";
import { gzip } from "./gzip";

describe("operators/coding_decoding/gzip.ts", () => {
  it("gzip(...) operator works properly", async () => {
    // test by gzipping and gunzipping again and comparing with the input file
    const gzippedUnzipped = pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      flatten(),
      gzip(),
      gunzip(),
      flatten()
    );

    await pipe(
      itr8FromStream(fs.createReadStream("./test/lorem_ipsum.txt")),
      flatten(),
      zip(gzippedUnzipped),
      forEach(([a, b]) => {
        // console.log('         gzip test equality:', a, ' ?= ', b);
        assert.deepEqual(a, b);
      })
    );
  }).timeout(2_000);
});
