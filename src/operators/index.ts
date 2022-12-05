/**
 * This module will export ALL operators, easy if bundle size doesn't matter that much.
 *
 * ```import { operator } from 'itr8/operators'```
 *
 * **WATCH OUT**: importing the entire module requires all **peer dependencies** to be installed as well
 * (for example: parseJson has a peer dependency)
 *
 * If bundle size does matter, or if you don't need the peer dependencies, it is advised to
 * import more specifically what you need:
 * ```import { operator } from 'itr8/operators/operatorGroup/operatorName'```
 *
 * You could also import all from a single group with
 * ```import { operator } from 'itr8/operators/operatorGroup'```
 *
 * @module
 */
 
export * from './async/index';

export * from './boolean/index';

export * from './coding_decoding/index';

export * from './general/index';

export * from './numeric/index';

export * from './parse/index';

export * from './strings/index';

export * from './timeBased/index';
