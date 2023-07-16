"use strict";
/**
 * The operator functions are the heart of the library!
 *
 * The operators produce the transIterators that can be chained together
 * in order to produce the desired behaviour.
 *
 * This module will export ALL operators.
 * @example
 * ```
 * import { operator } from 'itr8/operators'
 * ```
 *
 * You can also import more specifically what you need:
 * ```
 * import { operator } from 'itr8/operators/operatorGroup/operatorName'
 * ```
 *
 * You can also import all from a single group with
 * ```
 * import { operator } from 'itr8/operators/operatorGroup'
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
__exportStar(require("./async/index.js"), exports);
__exportStar(require("./boolean/index.js"), exports);
__exportStar(require("./coding_decoding/index.js"), exports);
__exportStar(require("./general/index.js"), exports);
__exportStar(require("./numeric/index.js"), exports);
// export * from './parse/index';
__exportStar(require("./strings/index.js"), exports);
__exportStar(require("./timeBased/index.js"), exports);
//# sourceMappingURL=index.js.map