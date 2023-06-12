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
export * from "./async/index";
export * from "./boolean/index";
export * from "./coding_decoding/index";
export * from "./general/index";
export * from "./numeric/index";
export * from "./strings/index";
export * from "./timeBased/index";
