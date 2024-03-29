/// <reference types="node" />
/**
 * GUNZIP the incoming data
 *
 * @returns a transiterator
 *
 * @category operators/coding_decoding
 */
declare const gunzip: () => import("../types.js").TTransIteratorSyncOrAsync<string | number | ArrayBuffer | DataView | Buffer, Buffer>;
export { gunzip };
