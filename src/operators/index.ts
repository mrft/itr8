/**
 * This module will export ALL operators, easy if bundle size doesn't matter that much.
 *
 * If bundle size does matter, it could be better to
 * ```import { operator } from 'itr8/operators/operatorGroup/operatorName'```
 *
 * You could also import all from a single group with
 * ```import { operator } from 'itr8/operators/operatorGroup'```
 *
 * @module
 */
 
export * from './async/index';

export * from './batch/index';

export * from './boolean/index';

export * from './coding_decoding/index';

export * from './general/index';

export * from './numeric/index';

export * from './parse/index';

export * from './strings/index';

export * from './timeBased/index';
