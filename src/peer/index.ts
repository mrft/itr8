/**
 * This module will export ALL peer modules, that is all modules that have some peer dependency,
 * which will only allow them to be run in the right environment (NodeJS for streams) or when the
 * right peer dependencies are installed.
 *
 * **WATCH OUT**: importing the entire module requires all **peer dependencies** to be installed as well
 * (for example: observable has RxJS as a peer dependency)
 *
 * If bundle size does matter, or if you don't need the peer dependencies, it is advised to
 * import more specifically what you need:
 * ```import { operator } from 'itr8/peer/stream'```
 *
 * @module
 */

export * from './stream';

export * from './observable';

export * from './parseJson';
