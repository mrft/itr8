# itr8 (pronounced "iterate")

[![Node.js CI](https://github.com/mrft/itr8/actions/workflows/node.js.yml/badge.svg)](https://github.com/mrft/itr8/actions/workflows/node.js.yml)

> **_"because programming should not be about solving the same problems over and over again"_**

**Installation**
```bash
    # install from npmjs.com
    npm install itr8
    # install directly from github
    npm install mrft/itr8
```
**Usage**
```typescript
// in an EcmaScript module - ESM (NodeJS or the browser)
import { ... } from "itr8";
// in a CommonJS module - CJS (NodeJS)
const itr8 = require("itr8/cjs");
```

**[itr8 source code](https://github.com/mrft/itr8)** can be found on github

**[itr8 documentation](https://mrft.github.io/itr8)** can be found at the itr8 github site.

**Table of Contents**

- [itr8](#itr8-pronounced-iterate)
  - [Getting started](#getting-started)
  - [What is it](#what-is-itr8)
  - [Who is this library for](#who-is-this-library-for)
  - [Roadmap](#roadmap)
- [Documentation](#documentation)
  - [API documentation](#api-documentation)
  - [What is a transIterator?](#what-is-a-transiterator)
  - [Writing your own operators](#writing-your-own-operators)
- [Inspiration](#inspiration)

## Getting started

```typescript
import {
  // interface
  itr8FromIterable,
  itr8Range,
  itr8ToArray,
  forEach,
  // operators
  map,
  filter,
  skip,
  take,
  lineByLine,
  // utils
  pipe,
  compose,
} from "itr8";

const inputArray = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

const resultArray = pipe(
  itr8FromIterable(inputArray), // the input iterator (= inputArray[Symbol.iterator]())
  map((x) => x * 2), // => 2 4 6 8 10 12 14 16 ... [34 36 38 ...]
  filter((x) => x % 3 === 0), // => 6 12 18 24 30 [36 42 ...]
  skip(2), // => 18 24 30 [36 42 ...]
  take(3), // => 18 24 30
  itr8ToArray
);
// 1) you should be aware that the values between square brackets will never actually be calculated
//    because only as many elements as needed will be pulled from the iterator!
//    (If you'd have written the same with array.filter, array.map etc. you'd have created
//    many 'intermediate arrays' - using more memory - and the calculations would have been
//    executed needlessly for all elements in the array)
// 2) you should also be aware that if 'itr8ToArray' was not there, nothing would have happened!
//    only when you start doing next() calls on the iterator something would actually be executed
// 3) due to the current lack of a pipe operator in JS we are using a pipe function so we can
//    read from left to right (or top to bottom), instead of right to left when applying functions
//    to the rsult of the previous function.
// 4) this pipe function can be used for any function, as long as they expect one argument each,
//    and as long as the output of the current matches the expected input of the next

// Now assume you need to apply the same algorithm to an asynchronous source (like a file or an api).
// In plain javascript you'd have to eiter load the entire file into an array (which could be
// problematic for large files), or rewrite your algorithm (which would typically have used
// array.map, array.filter) with other tools that help you with asynchronous code.
// But with itr8 that would simply become (assuming one number per line).
const resultArray2 = await pipe(
  itr8FromIterable(createReadStream("test.js", "utf8")), // readable streams are async iterables!
  lineByLine(), // interpret each line in the file as a single element
  map(Number.parseFloat), // turn the text into a number

  map((x) => x * 2), // => 2 4 6 8 10 12 14 16 ... [34 36 38 ...]
  filter((x) => x % 3 === 0), // => 6 12 18 24 30 [36 42 ...]
  skip(2), // => 18 24 30 [36 42 ...]
  take(3), // => 18 24 30
  itr8ToArray
);
// as you can see the actual algorithm did not change at all, we just had to 'await' the result
// because we are now using an asynchronous iterator as input!!!

// But we'd want to be able to reuse that algorithm, so it would be nice if we can store it as a
// function and apply it when needed.
// This is where the 'compose' function comes in handy.
// It will help you to easily create new 'operators' by combining existing operators.
const myOperator = () =>
  compose(
    map((x) => x * 2), // => 2 4 6 8 10 12 14 16 ... [34 36 38 ...]
    filter((x) => x % 3 === 0), // => 6 12 18 24 30 [36 42 ...]
    skip(2), // => 18 24 30 [36 42 ...]
    take(3) // => 18 24 30
  );
// 1) this is essentially the same as the totally unreadable
//    (iterator) => take(3)(skip(2)(filter((x) => x % 3 === 0)(map((x) => x * 2)(iterator))))
// 2) the compose function is also generic, so it will work for any functions expecting a single
//    parameter

// And with that, we can now simply do
const resultArray = pipe(
  itr8FromIterable(inputArray), // the input iterator
  myOperator(),
  itr8ToArray
);

// if we need to execute some code for every element of the resulting iterator, use forEach
// (which support both synchronous and asynchronous handlers, and allows you to easily set the
// allowed concurrency as well!)
pipe(
  itr8FromIterable(inputArray), // the input iterator
  myOperator(),
  forEach(
    async (e) => {
      const descr = await getElementFromDisk(id);
      console.log("element = ", descr);
    },
    { concurrency: 1 } // these options are optional (default concurrency is 1)
  )
);

// So now that we know that we can easily apply any operator to any iterator
// You just need to be aware of the various ways to create an iterator
// 1) create an iterator to start from with a utility function
const myIterator = () => itr8Range(0, 10_000_000);
// 2) OR create your own Iterator or AsyncIterator (for example with a generator function)
function* myGeneratorFunction() {
  for (let i = 0; i < 10_000_000; i++) {
    yield i;
  }
}
// 3) 'itr8FromIterable' is an easy way to get an iterator from many built-in data structures
const myOwnIterator = () => itr8FromIterable(myGeneratorFunction());

// we can use standard JS 'for ... of' to loop over an iterable, which works because every operator
// returns an IterableIterator (an iterator that returns itself when being asked to return an iterator)
// (but forEach is more powerful !)
// This means that it will actually execute code and start 'draining' the iterator
for (let x of pipe(
  itr8Range(1, 1000),
  filter((x) => x % 3 === 0)
)) {
  console.log(x);
}
```

You, can find some more [documentation](#documentation) further in this file or go straight to
[the github site about itr8](https://mrft.github.io/itr8)

You can see more working examples in the future in this [replit playground](https://replit.com/@mrft1/itr8-playground#index.ts)

## What is itr8

An experiment to create a **unified interface over both [synchronous](https://www.javascripttutorial.net/es6/javascript-iterator/) and [asynchronous iterators](https://www.javascripttutorial.net/es-next/javascript-asynchronous-iterators/)** such that the same iterator-operators (cfr. RxJS operators like filter, map, ...) can be used in various contexts (plain arrays, NodeJS streams, Observables, page-by-page database queries by writing an async generator function, page-by-age API queries, streams of events, ...).

This makes the code much more declarative (describing what to do rather than how to do it).

While working on this library, it became clear to me that many, many problems can simply be seen
as transforming one set of data into another set (which might be longer or shorter).

- A lexer or tokenizer is simply something that transforms a stream of characters or bytes into
  a stream of tokens.
- A parser can simply be seen as something that transforms a stream of tokens into a parse tree.
- A web application (cfr. The Elm Architecture, AppRun, Redux) can simply be seen as something
  that translates a stream of events into html output or a DOM tree.
  - So a web application engine simply has to define this transIterator, and allow the user to fill in the application-specific blanks: the initial state, generating new state based on the incoming event, and generating html from the state.
  - Can you see how redux middleware, could simply be seen as a transIterator that will be put between the event stream before the reducer gets called?
    - Adding a 'tap' for logging?
    - Some kind of debounce or throttle, would also be easy and if someone already wrote that (in any context, doesn't have to be related to redux at all), you could use that existing code.
  - Can you see how the redux reducer is simply the mapping function we have to pass into the 'map' operator, that translates [action, currentState] tuples into newState?

The library can also be used as a base for CSP (Communicating Simple Processes). By sharing
the itr8Pushable iterator between 2 processes, one process could use it to push information onto the
channel, and the other one can use the (async) next() call to pull the next message from
the channel. I have added an [example about CSP](#what-about-csp) below.

So unlike OO, where a new interface has to be invented for every new problem encountered, we basically agree on a simple protocol on how data will be delivered to and returned by all processing units, so we can focus on functionality rather than the interface.

**DISCLAIMER**: This is work in progress (including the docs), and although a fair amount of functionality seems to work, things might still change along the way...
It is mainly tested on NodeJS 16 currently, but should also work in the browser.

## Who is this library for?

If you ever found yourself in one of these situations, this library might be useful for you:

- You needed to do some filtering or mapping of some data (stored in an array for example), but the filter or map function is _asynchronous_. So instead of simply writing `array.filter(...).map(...)` you had to add a bunch of code to make it work like you wanted (maybe using sindresorhus' promise-fun here and there to keep things under control). As a result, your code suddenly becomes hard to read, even if the problem you needed to solve was actually quite simple.
- You have some data manipulation that works properly over a small array, but now you have to apply it on a a huge file that doesn't fit in memory, and now you need to entirely rewrite your code to handle this new situation.
- You need to get some data from an API that is 'page-oriented' (it only returns a limited number of results, and in order to get the next set of results you need to do another call). You need some manipulation on each single element of the set. Now you need to write additional logic to apply your algorithm to every element of each batch that you are processing that has nothing to do with the core problem you are trying to solve.
- You were thrilled by RxJS, but found out it cannot be used easily when the data comes in at a higher pace than you can handle (files, db, API) and implementing pushback in RxJS feels 'wrong'.
- You've tried to implement a transform stream in NodeJS but found it quite cumbersome.
- In general: when you have the feeling you have solved the same problem a few too many times.
- You've used another library like IxJS, iter-tools or HighlandJS, but don't know how to write your own 'operators' in one of them.

### Why not RxJS, IxJS, iter-tools, HighlandJS, ...?

- RxJS, being push-based, with no easy pushback mechanism would not solve the issue for me.
  On the other hand, any problem that RxJS will solve can also be solved with (async) iterators.
- IxJS I found too cumbersome (the docs were not clear enough for me), and I didn't see how to write my own operators (as opposed to RxJS that explains how to do that very well in the docs)
- iter-tools: same here, how to write your own operators?
- HighlandJS is stream based, which makes it NodeJS only (at least without browserify). Also, streams are kind of cumbersome, and the sync and async iterator protocols are dead simple and part of the standard.
- js-iterator: 'dot-chaining' has the disadvantage that you cannot simply add your own operators
  and I hate this 'you-can-only-do-what-already-exists-in-the library' situation.
- https://github.com/OliverJAsh/iterable-transformers/ is unfinished.

So, while all these libraries have their merit, none of them covered my needs well enough, so at a certain point things became clear enough in my head to write my own library.

### What about CSP?

To quickly show that async iterators can easily be used for CSP in javascript, and that this combines nicely with itr8, I have rewritten an example I found in the README of [jfet97/csp library](https://github.com/jfet97/csp) using itr8.
This way we don't need the while loop (forEach will take care of that), we don't modify the message but create a new one to send to the other side. itr8Pushable is used as the 'channel', and map, tap and delay transIterators implement the same functionality as is in the other example.
Also, there are no awaits in the code, because all the async plumbing is handled by the itr8 library so you can focus on the functionality.

```typescript
type TBall = { hits: number; status: string };

const wiff = itr8Pushable<TBall>();
const waff = itr8Pushable<TBall>();

const createBall = (): TBall => ({ hits: 0, status: "" });

const createBat = async (
  inbound: AsyncIterableIterator<TBall> & TPushable,
  outbound: AsyncIterableIterator<TBall> & TPushable
) => {
  pipe(
    inbound,
    map(({ hits, status }) => ({
      hits: hits + 1,
      status: status === "wiff!" ? "waff!" : "wiff!",
    })),
    tap(({ hits, status }) => {
      console.log(`🎾  Ball hit ${hits} time(s), ${status}`);
    }),
    delay(500), // assume it's going to take a bit to hit the ball
    forEach((b) => outbound.push(b)) // smash the ball back
  );
};

createBat(waff, wiff); // create a bat that will wiff waffs
createBat(wiff, waff); // create a bat that will waff wiffs

waff.push(createBall());
```

## Roadmap

The ROADMAP.md contains various ideas about possible additions to the library and how this
library could evolve in the future.
{@page ./ROADMAP.md}

# Documentation

## API documentation

Check https://mrft.github.io/itr8/modules.html to find developer documentation about all operators, interface functions and utility functions.

## What is a transIterator?

It is simply a function with an iterator as single argument which will return another iterator. So it transforms iterators, which is why I have called it transIterator (~transducers). The cool thing about it is that you can easily chain them together, by using the output of the first one as input of the next one and so on. You could compare this to piping in linux, where each tool typically reads from stdin, and outputs to stdout, and the pipe symbol makes ure that the output of the first program is used as input of the next one.

### What is the difference between a transIterator and an operator?

An operator is 'a function that generates a transIterator'. So for example filter(...) is an operator, because when called with an argument (the filter function) the result of that will be another function which is the transIterator.

## Writing your own operators

There are multiple options for writing your own operators. You can either build a new operator by
chaining a bunch of existing operators together, or you can write your own (ideally with the
powerMap operator).

### A new operator by combining existing operators

Let's use the same example as is used in the [RxJS tutorial](https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457#7b9e): a filterNil operator.

It can be created with the filter operator, like this:

```typescript
const filterNil = () => filter((x) => x !== undefined && x !== null);
```

Another example: a 'regroup' operator can be created by combining flatten and groupPer. This is where the `compose(...)` method will come in handy.
So to turn [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
You'll want the regroup(3) operator (3 being the new 'rowSize').

```typescript
const regroup = (rowSize: number) => compose(flatten(), groupPer(rowSize));
```

### Writing a new operator from scratch

We'll explain to you how to use the powerMap, which makes it easy to write operators whose output transIterators correctly handle both synchronous and asynchronous iterators.

When writing operators, we also have the _thenable_ and _forLoop_ utility functions, which are also meant to be able to write the same code, regardless whether the input is a normal value or a promise.

#### A simple example operator: filterNil

Let's show you the code right away:

```typescript
const filterNil = () =>
  powerMap<any, any>(
    (nextIn, state) => {
      if (nextIn.done) {
        return { done: true };
      } else if (nextIn.value === undefined || nextIn.value === null) {
        // nill so it's not done, but don't return a value
        return { done: false };
      } else {
        // not nill, so it's not done, and return the value
        return { done: false, value: nextIn.value };
      }
    },
    () => null // no state needed
  );
```

Now what is nextIn, and state?

- nextIn is simply the result of the next call of the incoming iterator. (The next call of an iterator always returns an object of the form `{ done: <true or false>, value: <current value> }`)
- state is used to store intermediate data, for example if you want to make a sum, the state will be the sum until now, or if you need to buffer things, state could be the array of things in the buffer.

What does that function return?

It returns an object that looks a lot like ...drum roll... the result of a next call of an iterator (_but it's not entirely the same!_). Make sure you've read and understood the [iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol)!

- if the output iterator will return no more elements it is `{ done:true }`
- if the output iterator is not done, but does not return anything based on the current value of the input iterator, the value is `{ done: false }`, without a value or `{ done: false, state: <newState\> }` if you need to update the state
- if the output iterator is not done, and it does need to return a value, it is `{ done: false, value: <output value\> }` (again with an optional state property if you need to pass state to the next step)
- if the output iterator is not done, and the current input iterator value would output _more than a single item_, it is `{ done: false, iterable: <your iterable\> }`. Any Iterable (or IterableIterator) will do. (That means in practice that you can use a _simple array_, but a _generator function_ will work as well, or some iterator that is the result of some input with a few itr8 operators applied to it).

Knowing all this we can break down the example:

- if the input iterator is done, we'll return that it's done
- if the input iterator's value is either null or undefined, we'll return that its not done, but won't provide a value
- otherwise we'll just pass the incoming thing unaltered
- we don't need state, so we never specify the state property

#### A slightly more advaced example operator: RepeatEach

Let's write an operator that repeats each value from the input iterator n times on the output iterator:

```typescript
const opr8RepeatEach = <TIn>(count: number) =>
  powerMap<TIn, TIn>(
    (nextIn, _state) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: (function* () {
          for (let i = 0; i < count; i++) {
            yield nextIn.value;
          }
        })(),
      };
    },
    () => undefined
  );
```

As you can see, we use the 'iterable' property here, and in order to easily generate an IterableIterator, we use an 'immediately invoked function expression'. This is important since a generator function generates an IterableIterator, so it should be called!

But you could also assign an array, because that is also an iterable. But beware that creating an intermediate array will use more memory (especially if the count is high)! I'll show you the same example with an array here:

```typescript
const opr8RepeatEach = <TIn>(count: number) =>
  powerMap<TIn, TIn>(
    (nextIn, _state) => {
      if (nextIn.done) {
        return { done: true };
      }
      return {
        done: false,
        iterable: Array.from(Array(count)).map((x) => nextIn.value),
      };
    },
    () => undefined
  );
```

#### An example operator that needs some state: total

What if we have an iterator that holds numbers and we want to calculate the total sum?
This can only be done by holding on to the 'sum so far', because with each new element we need to add the current value to the value we already have calculated.

```typescript
const total = () =>
  powerMap<number, number, { done: boolean; total: number }>(
    (nextIn, state) => {
      if (state.done) {
        return { done: true };
      } else if (nextIn.done) {
        return {
          done: false,
          value: state.total,
          state: { ...state, done: true },
        };
      }
      return {
        done: false,
        state: { ...state, total: state.total + nextIn.value },
      };
    },
    () => ({ done: false, total: 0 })
  );
```

Here you can see that we also specified the second argument of the powerMap function, which is the initialState (not done, and the total so far = 0).

So this iterator will only return a value on the output iterator once the input iterator has finished. Hence the 'done' flag on the state to indicate that we've seen the last element of the input iterator.

- When we see that we're done in the state (= the next call after the one where we finally sent a value to the output iterator) we'll send `{ done: true }`.
- When we see the last element of the input iterator, we don't modify the sum anymore, but send the total sum as the value, and indicate that there won't be any more values by setting the 'done' flag on the state
- In all other cases, we don't send a value, but we generate a new version of the state where the 'total' property is set to the current state's total + nextIn.value

#### I don't think that the operator I want can be built with the powerMap operator

If you have read the examples above, and you still don't see how to write your operator,
it could be that it cannot be written with the powerMap operator. (But to be honest,
at first I thought I had to write debounce and throttle by combining forEach with an
itr8Pushable, but later I realized that was not necessary, and I made a proper version
with powerMap operator which was passive again).

But if you are convinced that is the case, I advise you to look at the source code of
'prefetch' or 'mostRecent'.
Prefetch and mostRecent are actually returning a custom built iterator.

As long as your operator returns a function transforming the input iterator into another iterator,
you're good (and to be _itr8-approved_: always support both sync and async iterators as input, and if
possible, make sure that if the input iterator is synchronous, the output iterator is synchronous
as well).

#### Notes

- The function given to the powerMap operator can also be ASYNC (useful if you can only know the new state after an async operation).

- The function given to the powerMap operator can also return an ASYNC iterator (useful if you can only know each new elements after another async operation).

# Inspiration

This section contains background info and random thoughts on how I ended up writing this library, so you can skip this...

## What sparked the idea

The idea for this came from my search for a unified way to handle gets from an API, data from files, data in arrays, and I got frustrated that I needed to use HighlandJS for the file thing, but that I couldn't easily use that same library for handling stuff I got from an API in NodeJS as well as in the browser.

- RxJS, being push based and thus having no easy push-back mechanism, always seemed too limited to me for my use-case.
- Some people claim that 'a pull is 2 pushes', and so theoretically they can solve these problems with RxJS, but that somehow seemed way too complex for me.
- HighlandJS did a great job, but somehow streams always seemed to not be a good base (ever written a transform stream?) also due to streams being NodeJS specific.

Now all anyone has to do is write a generator function for his use case, and they are good to go.

It took me a while and a lot of reading to have a clear picture in my head of how I could unify everything I found online in one single solution.

Some things that I read that helped me to get a better understanding:

- [Design Patterns in Functional programming by Scott Wlaschin](https://www.youtube.com/watch?v=4jusLF_Xz7Q)
- [You Could Have Invented Monads! (And Maybe You Already Have.)](http://blog.sigfpe.com/2006/08/you-could-have-invented-monads-and.html)
- [Lossless backpressue in RxJS](https://itnext.io/lossless-backpressure-in-rxjs-b6de30a1b6d4)
- Stuff about CSP which triggered me to understand better where generator functions could be useful.
  - https://tgvashworth.com/2014/08/31/csp-and-transducers.html
  - https://medium.com/free-code-camp/csp-vs-rxjs-what-you-dont-know-1542cd5dd100
  - https://medium.com/javascript-scene/transducers-efficient-data-processing-pipelines-in-javascript-7985330fe73d
  - https://dev.to/rasmusvhansen/rxjs-transducer---harness-the-power-of-rxjs-operators-1ai8
  - https://github.com/rasmusvhansen/rxjs-transducer
  - https://benlesh.medium.com/rxjs-observable-interop-with-promises-and-async-await-bebb05306875

## The reasoning behind this library

Quote: "So, a transducer is a function that transforms a reducer into another reducer, opening the doors of composition."

And composition is what we all want, but there doesn't seem to be a single way to do things:

- Libraries like RxJS solve it by inventing something new called Observables.
- Using transform streams is cumbersome!
- Other libraries like HighlandJS do something similar to IxJS, but built upon NodeJS streams, which makes it non-browser-friendly (you'd need browserify).
- A project called rxjs-transducer exists that tries to reuse the RxJS 'operators' in other contexts, but it seems about arrays and not iterators at first sight.
- The current [proposal for iterator helpers](https://github.com/tc39/proposal-iterator-helpers)
  solves things the same way as they have been solved for arrays. The problem with this is that
  **the iterator must contain all available operators as properties**, which keeps people from writing
  reuseable new operators, thus people keep solving the same problems over and over again.
- [js-iterator](https://github.com/tenorviol/js-iterator) has the exact same problem (as does every library that uses dot-chaining)

There does not seem to be an easy way to treat all these as essentialy the same.
It also makes sense to use things that are part of the "standard" as much as possible, as it will produce less friction using it in multiple environments.

So here is another version of the schema on rxjs.dev that tries to explain what [RxJS Observables](https://rxjs.dev/guide/observable) are:

|          | Single            | Multiple                      |
| -------- | ----------------- | ----------------------------- |
| **Pull** | Function          | Iterator                      |
| **Push** | Callback function | ~~Observable~~ Async Iterator |

And the more I think about it, the lesser this schema makes sense to me at all, so maybe the schema should be something 3-dimensional and not 2-dimensional like:

- You can get multiple results separated in space or time. Separated in space would be an array, separated in time would be Iterators or Observable.
- A function can either return a result immediately or callback with the response. And that callback could be called once (Promise), or multiple times (Events and Observables).
- A function can always return the same result (stateless) or a different result each time (stateful).
  I should try to get that in a nice schema somehow.

My conclusion was: you could build something similar based on Iterators, and then you could create operators that work both on sync or async iterators, which solves all these problems with a single solution.
In my view, if we create a set of functions that take some arguments as input, and that produces functions transforming an existing iterator into a new iterator, we have all we need. And since it is pull-based it doesn't matter if the producer is faster, but it also means we can handle any situation that RxJS can handle, because it means we can definitely handle all 'reactive' cases where the producer is slower than the consumer.

But because not all iterators can produce the data synchronously, we will need to make sure all of them can handle _both synchronous and asynchronous_ iterators (where a 'next()' call will return a Promise). This will allow us to support streams, as well as Observables (+ all the basics like arrays). Actually [NodeJs streams are already AsyncIterables](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators) right now, so we don't even need a helper funtion to use them as a source!

So with a few utility functions that would make an iterator from its input (built-in iterables like array, string, stream, the arguments object, or other things that could easily be iterated over like Observables, ...). Also check [Built-In Iterables on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#built-in_iterables)

```typescript
itr8FromIterable(myArray);
itr8FromIterable(myString);
// streams are AsyncIterables, way easier than stream.on('data', ...)!!!
itr8FromIterable(someStream);

// or if you're into Observables
itr8FromObservable(someObservable);
```

We could then write a bunch of 'operators' which are simply functions taking an iterator
(+ some arguments) as input and returning another iterator as output.

```
function(...argumants) {
  return (itr:Iterator) => Iterator
}
```
