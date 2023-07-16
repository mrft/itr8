"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gunzip = void 0;
const util_1 = require("util");
const map_js_1 = require("../operators/general/map.js");
const zlib = __importStar(require("zlib"));
/**
 * GUNZIP the incoming data
 *
 * @returns a transiterator
 *
 * @category operators/coding_decoding
 */
const gunzip = () => (0, map_js_1.map)((data) => {
    if (typeof data === "number") {
        return (0, util_1.promisify)(zlib.gunzip)(Buffer.from([data]));
    }
    else {
        return (0, util_1.promisify)(zlib.gunzip)(data);
    }
});
exports.gunzip = gunzip;
//# sourceMappingURL=gunzip.js.map