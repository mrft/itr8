/**
 * This module will export ALL operators, easy if package size doesn't matter that much.
 *
 * If package size does matter, it could be better to
 * ```import { operator } from './operatorGroup/operatorName'```
 *
 * You could also import all from a single group with
 * ```import { operator } from './operatorGroup'```
 *
 * @module
 */
export * from './parse'

// the following should be moved to their respective categories instead of in this single big file!
export * from '../transIterators'