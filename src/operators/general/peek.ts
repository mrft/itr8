import { powerMap } from "./powerMap.js";

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
const peek = <TIn>(peekForward = 1, peekBackward = 1) =>
  powerMap<
    TIn,
    { value: TIn; previous: TIn[]; next: TIn[] },
    { previous: TIn[]; current: TIn; next: TIn[] }
  >(
    (nextIn, state) => {
      if (nextIn.done) {
        // drain what's left of the next elements
        if (state.next.length === 0 || peekForward === 0) {
          return {
            done: true,
            state: {
              current: Symbol["ITR8_NO_CURRENT"],
              next: [],
              previous: state.previous,
            },
          };
        } else {
          const [firstOfNext, ...restOfNext] = state.next;

          const newState = {
            current: firstOfNext,
            next: restOfNext || [],
            previous: [state.current, ...state.previous].slice(
              0,
              peekBackward as number
            ),
          };
          return {
            done: false,
            value: {
              value: newState.current,
              next: newState.next,
              previous: newState.previous,
            },
            state: newState,
          };
        }
      } else {
        // NOT nextIn.done
        if (state.next.length < peekForward) {
          const newState = {
            current: state.current, // still Symbol['ITR8_NO_CURRENT'] until we have enough next values
            next: [...state.next, nextIn.value].slice(0, peekForward as number),
            previous: state.previous,
          };
          return { done: false, state: newState };
        } else {
          // the 'normal' case in the middle of a flow
          const [firstOfNext, ...restOfNext] = state.next;
          const current = peekForward === 0 ? nextIn.value : firstOfNext;
          const newState = {
            current,
            next: [...(restOfNext || []), nextIn.value].slice(
              0,
              peekForward as number
            ),
            previous: (state.current === Symbol["ITR8_NO_CURRENT"]
              ? state.previous
              : [state.current, ...(state.previous || [])]
            ).slice(0, peekBackward as number),
          };
          return {
            done: false,
            value: {
              value: newState.current,
              next: newState.next,
              previous: newState.previous,
            },
            state: newState,
          };
        }
      }
    },
    () => ({
      // hasPrevious: false,
      previous: [],
      current: Symbol["ITR8_NO_CURRENT"],
      next: [],
      // hasNext
    })
  );
// const peek = (amountNext: number, amountPrevious: number = 0) => {

//   // return <T>(it: Iterator<T> | AsyncIterator<T>):Iterator<T> | AsyncIterator<T> => {
//   //   let inputs:Array<Promise<IteratorResult<T>> | IteratorResult<T>> = [];
//   //   let isAsyncInput:boolean;
//   //   const addInputIfNeeded = async () => {
//   //     if (inputs.length < amount) {
//   //       if (isAsyncInput && inputs.length > 0) await inputs[0];
//   //       const next = it.next();
//   //       if (isPromise(next)) {
//   //         // console.log('     add another (async) input, current nr of inputs = ', inputs.length, ' < ', amount);
//   //         isAsyncInput = true;
//   //         next.then((n) => {
//   //           if (!n.done) {
//   //             // console.log('  then: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
//   //             addInputIfNeeded();
//   //           }
//   //         });
//   //       }
//   //       inputs.push(next);
//   //     }
//   //   }

//   //   const retVal = {
//   //     [Symbol.asyncIterator]: () => retVal as AsyncIterableIterator<T>,
//   //     [Symbol.iterator]: () => retVal as IterableIterator<T>,
//   //     next: () => {
//   //       // console.log('  next: call addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
//   //       addInputIfNeeded();
//   //       if (inputs.length > 0) {
//   //         const [firstInput, ...remainingInputs] = inputs;
//   //         inputs = remainingInputs;
//   //         // console.log('  next: call 2 to addInputIfNeeded(), current nr of inputs = ', inputs.length, ' < ', amount);
//   //         addInputIfNeeded();
//   //         // console.log('  next: return ', firstInput);
//   //         return firstInput;
//   //       }
//   //       return isAsyncInput
//   //         ? Promise.resolve({ done: true, value: undefined }) as Promise<IteratorResult<T>>
//   //         : { done: true, value: undefined } as IteratorResult<T>;
//   //     }
//   //   };

//   //   return itr8FromIterator(retVal as any);
//   // }
// };

export { peek };
