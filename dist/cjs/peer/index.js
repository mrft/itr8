"use strict";
/**
 * This module will export ALL peer modules, that is all modules that have some peer dependency,
 * which will only allow them to be run in the right environment (NodeJS for streams) or when the
 * right peer dependencies are installed.
 *
 * **WATCH OUT**: importing the entire module requires all **peer dependencies** to be installed as well
 * (for example: observable has RxJS as a peer dependency)
 *
 * You could also import more specifically what you need:
 * ```
 * import { itr8FromStdIn } from 'itr8/peer/stream'
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
__exportStar(require("./stream.js"), exports);
__exportStar(require("./observable.js"), exports);
__exportStar(require("./parseJson.js"), exports);
//# sourceMappingURL=index.js.map