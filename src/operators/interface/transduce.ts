import { powerMap } from "../general/powerMap";

type TTransformer = {
  "@@transducer/init": () => unknown;
  "@@transducer/result": (result) => unknown;
  "@@transducer/step": (result, input) => unknown;
  "@@transducer/reduced"?: boolean; // for short circuiting
  "@@transducer/value"?: unknown; // value when reduced = true
};

/**
 * If you're a fan of transducers, this operator allows you to use any existing transducers
 * that adhere to the [Official spec for transformer protocol](https://github.com/cognitect-labs/transducers-js#transformer-protocol)
 *
 * > transducers return transformers when invoked
 * (with another transformer as argument)
 *
 * So for 'map', the result of calling map(mapFn) will be a transducer, and calling the transducer
 * on a transformer, produces another transformer.
 *
 * We'll allow you to also easily apply these transformers (which can be the result of multiple
 * composed transducers) to an iterator. It's very similar to itr8, yet slightluy different.
 *
 * Oh, and they turn out to be fast, so if it's raw performance you're after, they might help...
 *
 * @example
 * ```typescript
 * import * as transducersJs from 'transducers-js';
 *
 * pipe(
 *   itr8Range(-50_000, 50_000),
 *   transduce(
 *     transducersJs.comp(
 *       transducersJs.filter(isEven),
 *       transducersJs.map((x) => `${x} Mississippi`),
 *       transducersJs.drop(5),
 *       transducersJs.take(49_000),
 *       transducerRepeat(3),
 *     ),
 *   ),
 *   forEach((v) => console.log(v)), // log to stdout 147000 times something like '... Mississippi'
 * );
 * ```
 *
 * @category operators/interface
 */
const transduce = <TIn>(transducer: (TTransformer) => TTransformer) =>
  powerMap<
    TIn,
    TIn,
    { toArrayTransformer: TTransformer; transformer: TTransformer }
  >(
    (nextIn, state) => {
      // state will hold the current transformer
      if (state.transformer["@@transducer/reduced"] === true)
        return { done: true, value: state.transformer["@@transducer/value"] };
      if (nextIn.done) return { done: true };

      const newResult: unknown[] = [];
      (state.toArrayTransformer as any).curResult = newResult;
      state.transformer["@@transducer/result"](
        state.transformer["@@transducer/step"](newResult, nextIn.value)
      );

      if (state.transformer["@@transducer/reduced"])
        return { done: true, value: state.transformer["@@transducer/value"] };

      return { done: false, iterable: newResult, state };
    },
    () => {
      // our transform function passed into the transformer should fill an array with results
      const toArrayTransformer: TTransformer & { curResult: unknown[] } = {
        curResult: [],
        "@@transducer/init": () => [],
        "@@transducer/result": (result) => toArrayTransformer.curResult,
        "@@transducer/step": function (result, input) {
          return toArrayTransformer.curResult.push(input);
        },
        // "@@transducer/reduced": true, // for short circuiting
        // "@@transducer/value": 'some value', // value when reduced = true
      };

      const state = {
        toArrayTransformer,
        transformer: transducer(toArrayTransformer),
      };
      return state;
    }
  );

export { transduce };
