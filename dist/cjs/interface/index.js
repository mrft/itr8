"use strict";
/**
 * The interface module contains all helper functions to interface from or to
 * other representations.
 * This means simple data representations like arrays, objecs, Sets, Maps, strings, ...
 * but it also contains a few 'generators' that produce an iterator based on some
 * input parameters (like itr8Range and itr8Interval).
 *
 * Last but not least, it contains forEach which is 'the' tool to actually start
 * pulling items off of the iterator, and to initiate actions based on the data
 * they provide.
 *
 * REMARK: all interface functions that have dependencies (RxJS, NodeJS streams, ...) have been moved
 * to itr8/peer, which keeps this part of the library dependency-free, and theoretically usable
 * both in the browser and from NodeJS.
 *
 * This module will export ALL interface functions.
 *
 * @Example
 * ```
 * import { interfaceFn } from 'itr8'
 * ```
 *
 * You can also import more specifically what you need:
 * ```
 * import { interfaceFn } from 'itr8/interface/interfaceFn'
 * ```
 *
 * You can also import all interface functions with
 * ```
 * import { interfaceFn } from 'itr8/interface'
 * ```
 *
 * @module
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./forEach.js"), exports);
__exportStar(require("./itr8FromArray.js"), exports);
__exportStar(require("./itr8FromArrayAsync.js"), exports);
__exportStar(require("./itr8FromIterable.js"), exports);
__exportStar(require("./itr8FromIterator.js"), exports);
__exportStar(require("./itr8FromSingleValue.js"), exports);
__exportStar(require("./itr8FromSingleValueAsync.js"), exports);
__exportStar(require("./itr8FromString.js"), exports);
__exportStar(require("./itr8FromStringAsync.js"), exports);
__exportStar(require("./itr8Interval.js"), exports);
__exportStar(require("./itr8Pushable.js"), exports);
__exportStar(require("./itr8Range.js"), exports);
__exportStar(require("./itr8RangeAsync.js"), exports);
__exportStar(require("./itr8ToArray.js"), exports);
__exportStar(require("./itr8ToObject.js"), exports);
__exportStar(require("./itr8ToString.js"), exports);
__exportStar(require("./itr8ToMultiIterable.js"), exports);
//# sourceMappingURL=index.js.map