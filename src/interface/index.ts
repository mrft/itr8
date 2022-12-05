/**
 * The interface module contains all helper functions to interface from or to
 * other representations.
 * This means simple data representations like arrays, objecs, Sets, Maps, strings, ...
 * but also other 'streaming' tools - api's or libraries that are using a similar concept -
 * like RxJS or NodeJS streams or ...
 *
 * This module will export ALL interface functions, easy if bundle size doesn't matter that much.
 * @example
 * ```import { interfaceFn } from 'itr8'```
 *
 * WATCH OUT: importing the entire module requires all peer dependencies to be installed as well
 * (for example: interface/observable has RxJS as a peer dependency)
 * If bundle size does matter, it could be better to
 * ```import { interfaceFn } from 'itr8/interface/interfaceGroup/interfaceFn'```
 *
 * You could also import all from a single group with
 * ```import { interfaceFn } from 'itr8/interface/interfaceGroup'```
 * @module
 */

export * from './standard/index';

export * from './observable';

export * from './stream';