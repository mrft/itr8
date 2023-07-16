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
export * from "./async/index.js";
export * from "./boolean/index.js";
export * from "./coding_decoding/index.js";
export * from "./general/index.js";
export * from "./numeric/index.js";
// export * from './parse/index';
export * from "./strings/index.js";
export * from "./timeBased/index.js";
//# sourceMappingURL=index.js.map