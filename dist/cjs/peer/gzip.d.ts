/// <reference types="node" />
/**
 * GZIP the incoming data
 *
 * @returns a transIterator
 *
 * @category operators/coding_decoding
 */
declare const gzip: () => import("../types.js").TTransIteratorSyncOrAsync<string | number | ArrayBuffer | DataView | Buffer, Buffer>;
export { gzip };
