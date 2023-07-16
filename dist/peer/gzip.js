import { promisify } from "util";
import * as zlib from "zlib";
import { map } from "../operators/general/map.js";
/**
 * GZIP the incoming data
 *
 * @returns a transIterator
 *
 * @category operators/coding_decoding
 */
const gzip = () => map((data) => {
    if (typeof data === "number") {
        return promisify(zlib.gzip)(Buffer.from([data]));
    }
    else {
        return promisify(zlib.gzip)(data);
    }
});
export { gzip };
//# sourceMappingURL=gzip.js.map