import { promisify } from "util";
import { map } from "../general/map";
import * as zlib from "zlib";

/**
 * GUNZIP the incoming data
 *
 * @returns a transiterator
 *
 * @category operators/coding_decoding
 */
const gunzip = () =>
  map(
    (
      data: Buffer /*| TypedArray*/ | DataView | ArrayBuffer | string | number
    ) => {
      if (typeof data === "number") {
        return promisify(zlib.gunzip)(Buffer.from([data]));
      } else {
        return promisify(zlib.gunzip)(data);
      }
    }
  );

export { gunzip };
