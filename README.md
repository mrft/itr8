# itr8

An experiment to create a unified interface over both [synchronous](https://www.javascripttutorial.net/es6/javascript-iterator/) and [asynchronous iterators](https://www.javascripttutorial.net/es-next/javascript-asynchronous-iterators/) such that the same iterator-operators (cfr. RxJS operators like filter, map, ...) can be used in various contexts (plain arrays, NodeJS streams, Observables, page-by-page database queries by writing an async generator function, page-by-age API queries, ...).

## Getting started

    npm install mrft/itr8

```typescript
import * as itr8 from 'itr8'

// create an iterator to start from
const myIterator = itr8.range(0, 10_000_000); // or itr8.fromArray([...])

// due to the current lack of the |> operator
// we'll create our combined 'trans-iterator' with a utility function
const transIt = itr8.itr8Pipe(
    itr8.map((x) => x / 2),
    itr8.filter((x) => x % 3 === 0),
    itr8.skip(5),
    itr8.limit(50),
);

// we can use standard JS 'for ... of' to loop over an iterable
for (let x of transIt(myIterator)) {
  console.log(x);
}

// All iterables returned by itr8 are also 'pipeable', meaning that each returned iterator also exposes a pipe function to add other operators to the chain
const myTransformedIterator = itr8.itr8Proxy(myIterator)
    .pipe(
        itr8.map((x) => x / 2),
        itr8.filter((x) => x % 3 === 0),
        itr8.skip(5),
        itr8.limit(50),
    )
);

// this will work as well (because pipe produces another 'pipeable')
const myTransformedIterator2 = itr8.itr8Proxy(myIterator)
    .pipe(itr8.map((x) => x / 2))
    .pipe(itr8.filter((x) => x % 3 === 0))
    .pipe(itr8.skip(5))
    .pipe(itr8.limit(50))
);
```

## TODO

* Finish the forEach, so it can:
  * just work regardless whether the input iterator is sync or async
  * can be an asynchronous function, making sure it will wait for the previous one to finish before taking the next (one of my frustrations with array.forEach)
  * can be given options that allow for (limited or unlimited) parallelism
* General code cleanup
* Writing more and better documentation
* Add more operators
* Add more 'generators' for typical cases like file input, db paga-per-page processing?
* Investigate if performance can be improved for async iterators by batching multiple records together in one promise, without exposing this to the user, such that they don't have to change their algorithm (= the chain of operators).
  * Why: async is slower due to going thrpough the event loop multiple times, but if we put multiple items of the source stream together, the number of 'awaits' would drop significantly which should produce a big speedup (especially with long pipes of sync operators that happen to be called on an asyncronous input stream).
  * I don't feel that supporting somethng weird like a SemiAsyncIterator (that can either produce the next value synchronously or return a promise) would be a good idea.
  * I am thinking about just adding batch(size) and isBatch() operators (and maybe unBatch or deBatch to output the result as single items, and maybe reBatch for changing the batch size efficiently?) in the pipeline which would do the following: add an extra flag property to the iterator that is being produced such that the rest of the operators will know that the iterable they get as input actually represents single elements, such that the user should not 'think' in terms of the batchesbut in single elements (you don't want to force someone to change their algorithm significantly just for performance optimisations)
    * batch(size) would take 'size' elements from the input and output batches of that size (+ add the flag so the next operator knows this)
    * isBatch() would just add the flag, which is kind of like adding a flatten in between (already containing 'arrays' as the value in each next()'s value), but because you keep the elements together should be more efficient
    * unBatch would effectively again produce an asyc iterator that outputs all the elements separately (if you wnat to use the iterator somewhere else, and not solely this library)
    * reBatch would be like creating a new batch size (maybe input and output batch sizes differ) but not by using flatten().group() as that would produces an iterator outputting all elements separately in between, and that is not very efficient.

## What is a transIterator?

It is simply a function with an iterator as single argument which will return another iterator. So it transforms iterators, which is why I have called it transIterator (~transducers).

## Writing your own operators

There are 2 options to write your own operators. You can either build a new operator by chaining
a bunch of existing operators together, or you can write your own.

### A new operator by combining existing operators

Let's use the same example as is used in the [RxJS tutorial](https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457#7b9e): a filterNil operator.

It can be created with the filter operator, like this:

```typescript
const filterNil = filter((x) => x !== undefined && x !== null)
```

Another example: a 'regroup' operator can be created by combining flatten and groupPer. This is where the `itr8Pipe(...)` method will come in handy.
So to turn [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
You'll want the regroup(3) operator (3 being the new 'rowSize').

```typescript
const redim = (rowSize:number) => itr8Pipe(
    flatten(),
    groupPer(rowSize),
);
```

### Writing a new operator from scratch

#### A simple example operator: filterNil

Let's show you the code right away:

```typescript
const filterNil = operatorFactory<void, any, any, null>(
    (nextIn, state, ...params) => (
        if (nextIn.done) {
            return { done: true };
        } elseif (nextIn.value === undefined || nextIn.value === null)) {
            // nill so it's not done, but don't return a value
            return { done: false };
        } else {
            // not nill, so it's not done, and return the value
            return { done: false, value: nextIn.value };
        }
    ),
    null, // no state needed
);
```

Now what is nextIn, state and param?

 * nextIn is simply the result of the next call of the incoming iterator. (The next call of an iterator always returns an object of the form { done: \<true of false\>, value: \<current value\> })
 * state is used to store intermediate data, for example if you want to make a sum, the state will be the sum until now, or if you need to buffer things, state could be the array of things in the buffer.
 * params is the argument that you can pass to your operator, like the number of elements in a limit operator, or the mapping function in a map operator

What does that function return?

It returns an object that looks a lot like ...drum roll... the result of a next call of an iterator
  * if the output iterator will return no more elements it is { done:true }
  * if the output iterator is not done, but does not return anything based on the current value of the input iterator, the value is { done: false }, without a value or { done: false, state: \<newState\> } if you need to update the state
  * if the output iterator is not done, and it does need to return a value, it is { done: false, value: \<output value\> } (again with an optional state property if you need to pass state to the next step)
  * if the output iterator is not done, and the current input iterator value would output *more than a single item*, it is { done: false, iterable: \<your iterable\> }. Any Iterable (or IterableIterator) will do 

Knowing all this we can break down the example:
* if the input iterator is done, we'll return that it's done
* if the input iterator's value is either null or undefined, we'll return that its not done, but won't provide a value
* otherwise we'll just pass the incoming thing unaltered
* we don't need state, so we never specify the state property

#### A slightly more advaced example operator: RepeatEach

Let's write an operator that repeats each value from the input iterator n times on the output iterator:

```typescript
const opr8RepeatEach: operatorFactory<number, any, any, void>(
  (nextIn, state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
    };
  },
  undefined,
);
```

As you can see, we use the 'iterable' property here, and in order to easily generate an IterableIterator, we use an 'immediately invoked function expression'. This is important since a generator function generates an Iterableiterator, so it should be called!

But you could also assign an array, because thet is also an iterable. But beware that creating an intermediate array will use more memory! I'll show you the same example with an array here:

```typescript
const repeatEach: operatorFactory<number, any, any, void>(
  (nextIn, state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: Array.from(Array(count)).map(x => nextIn.value),
    };
  },
  undefined,
);
```

#### An example operator that needs some state: total

What if we have an iterator that holds numbers and we want to calculate the total sum?
This can only be done by holding on the the 'sum so far', because with each new element we need to add the current value to the value we already have calculated.

```typescript
const total = operatorFactory<void, number, number, { done: boolean, total: number }>(
  (nextIn: IteratorResult<any>, state:{ done: boolean, total: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.total, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, total: state.total + nextIn.value } };
  },
  { done: false, total: 0 },
);
```

Here you can see that we also specified the second argument of the operatorFactory function, which is the initialSate (not done, and the total so far = 0).

So this iterator will only return a value on the output iterator once the input iterator has finished. Hence the 'done' flag on the state to indicate that we've seen the last element of the input iterator.
* When we see that we're done in the state (= the next call after the one where we finally sent a value to the output iterator) we'll send { done: true }.
* When we see the last element of the input iterator, we don't modify the sum anymore, but send the total sum as the value, and indicate that there won't be any more values by setting the 'done' flag on the state
* In all other cases, we don't senda value, but we generate a new version of the state where the 'total' property is set to the current state's total + nextIn.value

#### Notes

* The function given to operatorFactory can also be ASYNC (useful if you can only know the new state after an async operation).

* The function given to operatorFactory can also return an ASYNC iterator (useful if you can only know each new elements after another async operation).

## The reasoning behind it
Quote: "So, a transducer is a function that transforms a reducer into another reducer, opening the doors of composition."

And composition is what we all want, but there doesn't seem to be a single way to do things:
* Libraries like RxJS (and IxJS for pull-based) solve it by inventing something new called Observables, and it doesn't seem easy to build your own operators.
* Using transform streams is cumbersome!
* Other libraries like HighlandJS do something similar to IxJS, but built upon NodeJS streams, which makes it non-browser-friendly (you'd need browserify).
* A project called rxjs-transducer exists that tries to reuse the RxJS 'operators' in other contexts, but it seems about arrays and not iterators at first sight.
* The current [proposal for iterator helpers](https://github.com/tc39/proposal-iterator-helpers)
solves things the same way as they have been solved for arrays. The problem with this is that
**the iterator must contain all available operators as properties**, which keeps people from writing
reuseable new operators, thus people keep solving the same problems over and over again.

There does not seem to be an easy way to treat all these as essentialy the same.
It also makes sense to use things that are part of the "standard" as much as possible, as it will produce less friction using it in multiple environments.

So here is *my own* version of the schema on rxjs.dev that tries to explain what [RxJS Observables](https://rxjs.dev/guide/observable) are:

|          | Single   | Multiple
| -------- | ------   | --------
| **Pull** | Function | Iterator
| **Push** | Promise  | ~~Observable~~ Async Iterator

My conclusion was: you could build something similar based on Iterators, and then you could create operators that work both on sync or async iterators, which solves all these problems with a single solution.
In my view, if we create a set of functions that take some arguments as input, and that produces functions transforming an existing iterator into a new iterator, we have all we need.

But because not all iterators can produce the data synchronously, we will need to make sure all of them can handle *both synchronous and asynchronous* iterators (where a 'next()' call will return a Promise). This will allow us to support streams, as well as Observables (+ all the basics like arrays). Actually [NodeJs streams are already AsyncIterables](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators) right now, so we don't even need a helper funtion to use them as a source!

So with a few utility functions that would make an iterator from its input (array, stream, Observable, ...).

    itr8FromArray(something)
    itr8FromStream(someStream) // not really needed
    itr8FromObservable(someStream)

We could then write a bunch of 'operators' which are simply functions taking an iterator
(+ some arguments) as input and returning another iterator as output.

function(...argumants) {
    return (itr:Iterator) => Iterator
}

# Thoughts

It would be ideal if we could use the |> syntax so we could chain them in a readable way, but until that is the case, a pipe function that takes a number of tuples containing the operator and its arguments and links them together would solve that issue (like it's done in RxJS and many other places).

    map(
      filter(
        itr,
        isEven,
      ),
      incrementBy5,
    )

is harder to read than

    itr |> filter(isEven) |> map(incrementBy5)

but for now tha .pipe(...operator) method and itr8Pipe(...operators) will be a good enough alternative.
# Inspiration

The idea for this came from my search for a unified way to handle gets from an API, data from files, data in arrays, and I got frustrated that I needed to use HighlandJS for the file thing, but that I couldn't easily use that same library for handling stuff I got from an API in NodeJS as well as in the browser.
* RxJS, being push based and thus having no easy push-back mechanism, always seemed too limited to me for my use-case.
* Some people claim that 'a pull is 2 pushes', and so theoretically they can solve these problems with RxJS, but that somehow seemed way too complex for me.
* HighlandJS did a great job, but somehow streams always seemed to not be a good base (ever written a transform stream?) also due to streams being NodeJS specific.

Now all anyone has to do is write a generator function for his use case, and they are good to go.

It took me a while and a lot of reading to have a clear picture in my head of how I could unify everything I found online in one single solution.

Stuff that I read that helped me to get a better understanding:
* [Design Patterns in Functional programming by Scott Wlaschin](https://www.youtube.com/watch?v=4jusLF_Xz7Q)
* [You Could Have Invented Monads! (And Maybe You Already Have.)](http://blog.sigfpe.com/2006/08/you-could-have-invented-monads-and.html)
* [Lossless backpressue in RxJS](https://itnext.io/lossless-backpressure-in-rxjs-b6de30a1b6d4)
* Stuff about CSP which triggered me to understand better where generator functions could be useful.
  * https://tgvashworth.com/2014/08/31/csp-and-transducers.html
  * https://medium.com/free-code-camp/csp-vs-rxjs-what-you-dont-know-1542cd5dd100
  * https://medium.com/javascript-scene/transducers-efficient-data-processing-pipelines-in-javascript-7985330fe73d
  * https://dev.to/rasmusvhansen/rxjs-transducer---harness-the-power-of-rxjs-operators-1ai8
  * https://github.com/rasmusvhansen/rxjs-transducer
  * https://benlesh.medium.com/rxjs-observable-interop-with-promises-and-async-await-bebb05306875

