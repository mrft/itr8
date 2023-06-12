/// <reference types="node" />
/**
 * **REMARK**: based upon @streamparser/json, but added as a peer dependency,
 * so if you want to use this don't forget to
 * ```npm install @streamparser/json```
 * in your project as well.
 *
 * This operator will take an iterator of strings, Uint8Arrays or Buffers
 * and will produce an iterator of [json object, path string] pairs.
 *
 * The parameter, an array of paths to emit, can be used to filter out only
 * the things that interest you.
 * Defaults to undefined which emits everything. The paths are intended to support
 * jsonpath although at the time being it only supports the root object selector ($)
 * and subproperties selectors including wildcards ($.a, $.\*, $.a.b, , $.\*.b, etc).
 *
 * @example
 * ```typescript
 *  pipe(
 *    itr8FromIterable('{ someprop: { id: '123' }, results: [ 'a', 'b', 'c' ] }'),
 *    parseJson(['$.results.*']),
 *      // => [ ['a', '$.results.0'], ['b', '$.results.1'], ['c', '$.results.2'] ]
 *    map(([j]) => j),
 *      // => [ 'a', 'b', 'c' ] (useful if you don't care about the path)
 *  );
 * ```
 *
 * It is built using the [@streamparser/json](https://github.com/juanjoDiaz/streamparser-json)
 * library, and reduced to its bare essence.
 *
 * @param params
 * @returns tuples [ value, path ]
 *
 * @category peer/parseJson
 */
declare const parseJson: (params: Array<string>) => import("../types").TTransIteratorSyncOrAsync<string | Uint8Array | Buffer, Record<string, any>>;
export { parseJson };
