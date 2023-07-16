import { promisify } from "util";
import { map } from "../operators/general/map.js";
import * as zlib from "zlib";
/**
 * GUNZIP the incoming data
 *
 * @returns a transiterator
 *
 * @category operators/coding_decoding
 */
const gunzip = () => map((data) => {
    if (typeof data === "number") {
        return promisify(zlib.gunzip)(Buffer.from([data]));
    }
    else {
        return promisify(zlib.gunzip)(data);
    }
});
export { gunzip };
//# sourceMappingURL=gunzip.js.map