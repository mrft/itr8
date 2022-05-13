/**
 * The interface module contains some helper functions to connect to other
 * 'streaming' tools (api's or libraries that are using a similar concept).
 *
 * Currently we support RxJS Observables and NodeJS streams.
 *
 * @module
 */

export * from './observable';

export * from './stream';