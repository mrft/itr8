# itr8

DISCLAIMER: This is work in progress (including the docs), and although a fair amount of functionality seems to work, things might still change along the way...

An experiment to create a unified interface over both [synchronous](https://www.javascripttutorial.net/es6/javascript-iterator/) and [asynchronous iterators](https://www.javascripttutorial.net/es-next/javascript-asynchronous-iterators/) such that the same iterator-operators (cfr. RxJS operators like filter, map, ...) can be used in various contexts (plain arrays, NodeJS streams, Observables, page-by-page database queries by writing an async generator function, page-by-age API queries, ...).

## Getting started

Install the module using npm
```bash
    npm install mrft/itr8
```

And then import it in your source code file:
```typescript
import * as itr8 from 'itr8'

// create an iterator to start from
const myIterator = itr8.itr8Range(0, 10_000_000); // or itr8.fromArray([...])

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

// use forEach to do something with every element (it will handle async handlers as well, you can even control the concurrency easily)
forEach(
  async (id) => {
    const descr = await getElementFromDisk(id);
    console.log('element = ', descr);
  },
)
(myTransformedIterator)
// TODO: should be pipeable into forEach like this:
// myTransformedIterator.pipe(
//   forEach((element) => {
//     console.log('element = ', element);
//   }),
// );

// we can use standard JS 'for ... of' to loop over an iterable
for (let x of myTransformedIterator2) {
  console.log(x);
}

// we can create a new 'transIterator' by combining some existing operators with a utility function
const transIt = itr8.itr8Pipe(
    itr8.map((x) => x / 2),
    itr8.filter((x) => x % 3 === 0),
    itr8.skip(5),
    itr8.limit(50),
);
// an 'operator' is a function that produces as transIterator
const myOperator = () => transIt;
```
You, can find some more [documentation](#documentation) further in this file.

## Who is this library for?

If you ever found yourself in one of these situations, this library might be useful for you:
 * You needed to do some filtering or mapping of some data (stored in an array for example), but the filter or map function is _asynchronous_. So instead of simply writing `araay.filter(...).map(...)` you had to add a bunch of code to make it work like you wanted (maybe using sindresorhus' promise-fun here and there to keep things under control). As a result, your code suddenly becomes hard to read, even if the problem you needed to solve was actually quite simple.
 * You have some data manipulation that works properly over a small array, but now you have to apply it on a a huge file that doesn't fit in memory, and now you need to entirely rewrite your code to handle this new situation.
 * You need to get some data from an API that is 'page-oriented' (it only returns a limited number of results, and in order to get the next set of results you need to do another call). You need some manipulation on each single element of the set. Now you need to write additional logic to apply your algorithm to every element of each batch that you are processing that has nothing to do with the core problem you are trying to solve.
 * You were thrilled by RxJS, but found out it cannot be used easily when the data comes in at a higher pace than you can handle (files, db, API) and implementing pushback in RxJS feels 'wrong'.
 * You've tried to implement a transform stream in NodeJS but found it quite cumbersome.
 * In general: when you have the feeling you have solved the same problem a few too many times.
 * You've used another library like IxJS, iter-tools or HighlandJS, but don't know how to write your own 'operators' in one of them.

### Why not RxJS, IxJS, iter-tools, HighlandJS, ...?

* RxJS, being push-based, with no easy pushback mechanism wold not solve the issue for me.
* IxJS I found too cumbersome (the docs were not clear enough for me), and I didn't see how to write my own operators (as opposed to RxJS that explains how to do that very well in the docs)
* iter-tools: same here, how to write your own operators?
* HighlandJS is stream based, which makes it NodeJS only (at least without browserify). Also, streams are kind of cumbersome,a dn the sync and async iterator protocols are dead simple and part of the standard.

So, while all these libraries have their merit, none of them convered my needs well enough, so at a certain point things became clear enough in my head to write my own library.

## TODO

* Piping should have better typing (like RxJS does it)
* Piping should only care whether the output type of the first and the input type of the next match
  so that we are not only limited to transIterators, this way the last steo of the pipe could be
  forEach. Right now calling forEach is still clunky.
* General code cleanup
* Writing more and better documentation
* Add more operators
  * debounce
  * throttle
  * ...
* Add more 'generators' for typical cases like file input, db paga-per-page processing?
* Further improve batch support: current implementation will grow and shrink batch size depending on the operation (filter could shrink batches significatnly for example, but batches with only a few elements don't have a very big advantage performance wise). Of course you could always `unBatch |> batch(size)` to force a new batch size, but it could be more efficient if the operatorFactory handles the batch size and keeps it constant throughtout the chain.


# Documentation

Also check https://mrft.github.io/itr8
## What is a transIterator?

It is simply a function with an iterator as single argument which will return another iterator. So it transforms iterators, which is why I have called it transIterator (~transducers).

### What is the difference between a transIterator and an operator?

An operator is 'a function that generates a transIterator'. So for example filter(...) is an operator, because when called with an argument (the filter function) the result of that will be another function which is the transIterator.

## Writing your own operators

There are 2 options to write your own operators. You can either build a new operator by chaining
a bunch of existing operators together, or you can write your own.

### A new operator by combining existing operators

Let's use the same example as is used in the [RxJS tutorial](https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457#7b9e): a filterNil operator.

It can be created with the filter operator, like this:

```typescript
const filterNil = () => filter((x) => x !== undefined && x !== null)
```

Another example: a 'regroup' operator can be created by combining flatten and groupPer. This is where the `itr8Pipe(...)` method will come in handy.
So to turn [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
You'll want the regroup(3) operator (3 being the new 'rowSize').

```typescript
const regroup = (rowSize:number) => itr8Pipe(
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
  * if the output iterator is not done, and the current input iterator value would output *more than a single item*, it is { done: false, iterable: \<your iterable\> }. Any Iterable (or IterableIterator) will do. (That means in practice that you can use a simple array, but a generator function will work as well, or some iterator that is the result of some input with a few itr8 operators applied to it).

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


# Inspiration

This section contains background info and random thoughts on how I ended up writing this library, so you can skip this...
## What sparked the idea

The idea for this came from my search for a unified way to handle gets from an API, data from files, data in arrays, and I got frustrated that I needed to use HighlandJS for the file thing, but that I couldn't easily use that same library for handling stuff I got from an API in NodeJS as well as in the browser.
* RxJS, being push based and thus having no easy push-back mechanism, always seemed too limited to me for my use-case.
* Some people claim that 'a pull is 2 pushes', and so theoretically they can solve these problems with RxJS, but that somehow seemed way too complex for me.
* HighlandJS did a great job, but somehow streams always seemed to not be a good base (ever written a transform stream?) also due to streams being NodeJS specific.

Now all anyone has to do is write a generator function for his use case, and they are good to go.

It took me a while and a lot of reading to have a clear picture in my head of how I could unify everything I found online in one single solution.

Some things that I read that helped me to get a better understanding:
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

## The reasoning behind this library

Quote: "So, a transducer is a function that transforms a reducer into another reducer, opening the doors of composition."

And composition is what we all want, but there doesn't seem to be a single way to do things:
* Libraries like RxJS (and IxJS for pull-based) solve it by inventing something new called Observables.
* Using transform streams is cumbersome!
* Other libraries like HighlandJS do something similar to IxJS, but built upon NodeJS streams, which makes it non-browser-friendly (you'd need browserify).
* A project called rxjs-transducer exists that tries to reuse the RxJS 'operators' in other contexts, but it seems about arrays and not iterators at first sight.
* The current [proposal for iterator helpers](https://github.com/tc39/proposal-iterator-helpers)
solves things the same way as they have been solved for arrays. The problem with this is that
**the iterator must contain all available operators as properties**, which keeps people from writing
reuseable new operators, thus people keep solving the same problems over and over again.

There does not seem to be an easy way to treat all these as essentialy the same.
It also makes sense to use things that are part of the "standard" as much as possible, as it will produce less friction using it in multiple environments.

So here is another version of the schema on rxjs.dev that tries to explain what [RxJS Observables](https://rxjs.dev/guide/observable) are:

|          | Single   | Multiple
| -------- | ------   | --------
| **Pull** | Function | Iterator
| **Push** | Callback function | ~~Observable~~ Async Iterator

And the more I think about it, the lesser this schema makes sense to me at all, so maybe the schema should be something 3-dimensional and not 2-dimensional like:
* You can get multiple results separated in space or time. Separated in space would be an array, separated in time would be Iterators or Observable.
* A function can either return a result immediately or callback with the response. And that callback could be called once (Promise), or multiple times (Events and Observables).
* A function can always return the same result (stateless) or a different result each time (stateful).
I should try to get that in a nice schema somehow.


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
