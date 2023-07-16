/**
 * To solve some problems you need to know what the next element(s) is (are) going
 * to be, or look back at the previous value(s).
 *
 * so instead of returning the simple value of the incoming iterator, an object will be returned
 * that looks like this:
 * ```typescript
 *  {
 *    value: 'the current value',
 *    next: [ 'next value', 'next + 1 value' ],
 *    previous: [ 'previous value', 'previous - 1 value' ],
 *  }
 * ```
 *
 * @example
 * ```typescript
 * // the output of: find src \( -type d -printf "%p/\n" , ! -type d -print \)
 * const str = `src/
 * src/interface/
 * src/interface/itr8ToArray.ts
 * src/interface/itr8Pushable.ts
 * src/interface/index.ts
 * src/peer/
 * src/peer/observable.ts
 * src/peer/parseJson.ts
 * src/types.ts
 * src/index.ts
 * src/operators/
 * src/operators/numeric/
 * src/operators/numeric/max.ts
 * src/operators/numeric/min.ts
 * src/operators/numeric/average.ts
 * src/operators/numeric/total.ts
 * src/operators/strings/
 * src/operators/strings/lineByLine.ts
 * src/operators/strings/stringToChar.ts
 * src/operators/general/
 * src/operators/general/uniq.ts
 * src/operators/general/reduce.ts
 * src/operators/general/split.ts
 * src/operators/boolean/
 * src/operators/boolean/every.ts
 * src/operators/boolean/some.ts
 * src/operators/index.ts`;
 *
 * const printableTreeView = pipe(
 *   itr8FromString(str),
 *   lineByLine(),
 *   peek(),
 *   // parse the string into a data structure (peeking to next to fill the isLastInLevel & isVeryLast flags)
 *   map(({value, next, prev}) => {
 *     const valueSplit = value.split('/');
 *     const isDir = value.endsWith('/');
 *     const pathLength = valueSplit.length - (isDir ? 2 : 1);
 *     const nextIsDir = next[0]?.endsWith('/');
 *     const nextPathLength = next[0]?.split('/').length - (nextIsDir ? 2 : 1);
 *     const isLastInLevel = nextPathLength < pathLength;
 *     const isVeryLast = next.length === 0;
 *     return { isDir, name: valueSplit[pathLength], level: pathLength, isLastInLevel, isVeryLast };
 *   }),
 *   // turn the data structure into a new string
 *   map(({ isDir, name, level, isLastInLevel, isVeryLast }) => {
 *     const padding = pipe(
 *       itr8FromSingleValue(' │ ')
 *       repeatEach(level - 1),
 *       itr8ToString,
 *     );
 *
 *     const line = !(isLastInLevel || isVeryLast)
 *                ? ' ├─'
 *                : ' └─' // (!isVeryLast ? ' └─' : '─┴─')
 *     ;
 *
 *     const filename = `${isDir ? '📁' : '📄'} ${name}`;
 *
 *     return `${padding}${level > 0 ? line : ''}${filename}`;
 *   }),
 *   intersperse('\n'),
 *   itr8ToString,
 * )
 * // =>
 * // 📁 src
 * //  ├─📁 interface
 * //  │  ├─📄 itr8ToArray.ts
 * //  │  ├─📄 itr8Pushable.ts
 * //  │  └─📄 index.ts
 * //  ├─📁 peer
 * //  │  ├─📄 observable.ts
 * //  │  └─📄 parseJson.ts
 * //  ├─📄 types.ts
 * //  ├─📄 index.ts
 * //  ├─📁 operators
 * //  │  ├─📁 numeric
 * //  │  │  ├─📄 max.ts
 * //  │  │  ├─📄 min.ts
 * //  │  │  ├─📄 average.ts
 * //  │  │  └─📄 total.ts
 * //  │  ├─📁 strings
 * //  │  │  ├─📄 lineByLine.ts
 * //  │  │  └─📄 stringToChar.ts
 * //  │  ├─📁 general
 * //  │  │  ├─📄 uniq.ts
 * //  │  │  ├─📄 reduce.ts
 * //  │  │  └─📄 split.ts
 * //  │  ├─📁 boolean
 * //  │  │  ├─📄 every.ts
 * //  │  │  └─📄 some.ts
 * //  │  └─📄 index.ts
 * ```
 *
 * @category operators/general
 */
declare const peek: <TIn>(peekForward?: number, peekBackward?: number) => import("../../types.js").TTransIteratorSyncOrAsync<TIn, {
    value: TIn;
    previous: TIn[];
    next: TIn[];
}>;
export { peek };
