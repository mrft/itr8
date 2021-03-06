# itr8

* pronounced "iterate"
* [itr8 source code](https://github.com/mrft/itr8) can be found on github
* [itr8 documentation](https://mrft.github.io/itr8) can be found at the itr8 github site.

An experiment to create a **unified interface over both [synchronous](https://www.javascripttutorial.net/es6/javascript-iterator/) and [asynchronous iterators](https://www.javascripttutorial.net/es-next/javascript-asynchronous-iterators/)** such that the same iterator-operators (cfr. RxJS operators like filter, map, ...) can be used in various contexts (plain arrays, NodeJS streams, Observables, page-by-page database queries by writing an async generator function, page-by-age API queries, streams of events, ...).

This makes the code much more declarative (describing what to do rather than how to do it).

While working on this library, it became clear to me that many, many problems can simply be seen
as transforming one set of data into another set (which might be longer or shorter).
* A lexer or tokenizer is simply something that transforms a stream of characters or bytes into
a stream of tokens.
* A parser can simply be seen as something that transforms a stream of tokens into a parse tree.
* A web application (cfr. The Elm Architecture, AppRun, Redux) can simply be seen as something
that translates a stream of events into html output or a DOM tree.
  * So a web application engine simply has to define this transIterator, and allow the user to fill in the application-specific blanks: the initial state, generating new state based on the incoming event, and generating html from the state.
  * Can you see how redux middleware, could simply be seen as a transIterator that will be put between the event stream before the reducer gets called?
    * Adding a 'tap' for logging?
    * Some kind of debounce or throttle, would also be easy and if someone already wrote that (in any context, doesn't have to be related to redux at all), you could use that existing code.
  * Can you see how the redux reducer is simply the mapping function we have to pass into the 'map' operator, that translates [action, currentState] tuples into newState?

I think the library can also be used a as a base for CSP (Communicating Simple Processes). By sharing
the itr8Pushable iterator between 2 processes, one process could use it to push information onto the
channel, and the other one can use the (async) next() call to pull the next message from
the channel.

So unlike OO, where a new interface has to be invented for every new problem encountered, we basically agree on a simple protocol on how data will be delivered to and returned by all processing units, so we can focus on functionality rather than the interface.

DISCLAIMER: This is work in progress (including the docs), and although a fair amount of functionality seems to work, things might still change along the way...
It is tested on NodeJS 16 (the use of ```import { isPromise } from 'util/types';``` causes it not to work in NodejS 12 for example)

**Table of Contents**
* [itr8](#itr8)
  * [Getting started](#getting-started)
  * [Who is this library for](#who-is-this-library-for)
  * [Roadmap](#roadmap)
* [Documentation](#documentation)
  * [What is a transIterator?](#what-is-a-transiterator)
  * [Writing your own operators](#writing-your-own-operators)
* [Inspiration](#inspiration)

## Getting started

Install the module using npm
```bash
    npm install mrft/itr8
```

And then import it in your source code file:
```typescript
import { itr8Range, itr8FromIterator, itr8Pipe, itr8FromArray, itr8ToArray } from 'itr8'
import { map, filter, skip, limit, forEach } from 'itr8/operators'

// create an iterator to start from with a utility function
const myIterator = () => itr8Range(0, 10_000_000); // or itr8FromArray([...])

// or create your own Iterator or AsyncIterator (for example with a generator function)
function* myGeneratorFunction() {
  for (let i = 0; i < 10_000_000; i++) {
    yield i;
  }
}
// 'itr8FromIterator' is only needed to make .pipe work which is just very convenient
const myOwnIterator = () => itr8FromIterator(myGeneratorFunction());

// All iterables returned by itr8 are also 'pipeable', meaning that each returned iterator also exposes a pipe function to add other operators to the chain
const myTransformedIterator = myIterator()
    .pipe(
        map((x) => x / 2),
        filter((x) => x % 3 === 0),
        skip(5),
        limit(50),
    )
);

// this will work as well (because pipe produces another 'pipeable')
const myTransformedIterator2 = myIterator()
    .pipe(map((x) => x / 2))
    .pipe(filter((x) => x % 3 === 0))
    .pipe(skip(5))
    .pipe(limit(50))
);

// use forEach to do something with every element (it will handle async handlers as well, you can even control the concurrency easily)
myTransformedIterator.pipe(
  forEach(
    async (id) => {
      const descr = await getElementFromDisk(id);
      console.log('element = ', descr);
    },
  )
)

// or simply pipe everything together including the forEach at the end!
myIterator().pipe(
  map((x) => x / 2),
  filter((x) => x % 3 === 0),
  skip(5),
  limit(50),
  forEach(
    async (id) => {
      const descr = await getElementFromDisk(id);
      console.log('element = ', descr);
    },
  ),
);

// we can use standard JS 'for ... of' to loop over an iterable
for (let x of myTransformedIterator2) {
  console.log(x);
}

// we can create a new 'transIterator' by combining some existing operators with a utility function
const transIt = itr8Pipe(
    map((x) => x / 2),
    filter((x) => x % 3 === 0),
    skip(5),
    limit(50),
);
// an 'operator' is a function that produces a transIterator
const myOperator = () => transIt;

const myTransformedIterator = myIterator().pipe(
  myOperator(),
);
// myIterator.pipe(transIt) would work as well but always using 'operators' would be a good convention

// Note that myTransformedIterator doesn't execute any code, it is only when using forEach
// or a 'for (x of myTransformedIterator)' loop that you'll actually start digesting the iterator!
```
You, can find some more [documentation](#documentation) further in this file or go straight to
[the github site about itr8](https://mrft.github.io/itr8)

You can see more working examples in the future in this [replit playground](https://replit.com/@mrft1/itr8-playground#index.ts)

## Who is this library for?

If you ever found yourself in one of these situations, this library might be useful for you:
 * You needed to do some filtering or mapping of some data (stored in an array for example), but the filter or map function is _asynchronous_. So instead of simply writing `array.filter(...).map(...)` you had to add a bunch of code to make it work like you wanted (maybe using sindresorhus' promise-fun here and there to keep things under control). As a result, your code suddenly becomes hard to read, even if the problem you needed to solve was actually quite simple.
 * You have some data manipulation that works properly over a small array, but now you have to apply it on a a huge file that doesn't fit in memory, and now you need to entirely rewrite your code to handle this new situation.
 * You need to get some data from an API that is 'page-oriented' (it only returns a limited number of results, and in order to get the next set of results you need to do another call). You need some manipulation on each single element of the set. Now you need to write additional logic to apply your algorithm to every element of each batch that you are processing that has nothing to do with the core problem you are trying to solve.
 * You were thrilled by RxJS, but found out it cannot be used easily when the data comes in at a higher pace than you can handle (files, db, API) and implementing pushback in RxJS feels 'wrong'.
 * You've tried to implement a transform stream in NodeJS but found it quite cumbersome.
 * In general: when you have the feeling you have solved the same problem a few too many times.
 * You've used another library like IxJS, iter-tools or HighlandJS, but don't know how to write your own 'operators' in one of them.

### Why not RxJS, IxJS, iter-tools, HighlandJS, ...?

* RxJS, being push-based, with no easy pushback mechanism would not solve the issue for me.
  On the other hand, any problem that RxJS will solve can also be solved with (async) iterators.
* IxJS I found too cumbersome (the docs were not clear enough for me), and I didn't see how to write my own operators (as opposed to RxJS that explains how to do that very well in the docs)
* iter-tools: same here, how to write your own operators?
* HighlandJS is stream based, which makes it NodeJS only (at least without browserify). Also, streams are kind of cumbersome, and the sync and async iterator protocols are dead simple and part of the standard.
* js-iterator: 'dot-chaining' has the disadvantage that you cannot simply add your own operators
  and I hate this 'you-can-only-do-what-already-exists-in-the library' situation.

So, while all these libraries have their merit, none of them convered my needs well enough, so at a certain point things became clear enough in my head to write my own library.

## Roadmap

The ROADMAP.md contains various ideas about possible additions to the library and how this
library could evolve in the future.
{@page ROADMAP.md}

# Documentation

Also check https://mrft.github.io/itr8
## What is a transIterator?

It is simply a function with an iterator as single argument which will return another iterator. So it transforms iterators, which is why I have called it transIterator (~transducers).

### What is the difference between a transIterator and an operator?

An operator is 'a function that generates a transIterator'. So for example filter(...) is an operator, because when called with an argument (the filter function) the result of that will be another function which is the transIterator.

## Writing your own operators

There are multiple options for writing your own operators. You can either build a new operator by
chaining a bunch of existing operators together, or you can write your own (ideally with the
itr8OperatorFactory function).

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
const filterNil = itr8OperatorFactory<void, any, any, null>(
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
    () => null, // no state needed
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
const opr8RepeatEach: itr8OperatorFactory<number, any, any, void>(
  (nextIn, state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: (function* () { for (let i = 0; i < count; i++) { yield nextIn.value; } })(),
    };
  },
  () => undefined,
);
```

As you can see, we use the 'iterable' property here, and in order to easily generate an IterableIterator, we use an 'immediately invoked function expression'. This is important since a generator function generates an Iterableiterator, so it should be called!

But you could also assign an array, because that is also an iterable. But beware that creating an intermediate array will use more memory! I'll show you the same example with an array here:

```typescript
const repeatEach: itr8OperatorFactory<number, any, any, void>(
  (nextIn, state, count) => {
    if (nextIn.done) {
      return { done: true };
    }
    return {
      done: false,
      iterable: Array.from(Array(count)).map(x => nextIn.value),
    };
  },
  () => undefined,
);
```

#### An example operator that needs some state: total

What if we have an iterator that holds numbers and we want to calculate the total sum?
This can only be done by holding on to the 'sum so far', because with each new element we need to add the current value to the value we already have calculated.

```typescript
const total = itr8OperatorFactory<void, number, number, { done: boolean, total: number }>(
  (nextIn: IteratorResult<any>, state:{ done: boolean, total: number }) => {
    if (state.done) {
      return { done: true };
    } else if (nextIn.done) {
      return { done: false, value: state.total, state: { ...state, done: true } };
    }
    return { done: false, state: { ...state, total: state.total + nextIn.value } };
  },
  () => ({ done: false, total: 0 }),
);
```

Here you can see that we also specified the second argument of the itr8OperatorFactory function, which is the initialSate (not done, and the total so far = 0).

So this iterator will only return a value on the output iterator once the input iterator has finished. Hence the 'done' flag on the state to indicate that we've seen the last element of the input iterator.
* When we see that we're done in the state (= the next call after the one where we finally sent a value to the output iterator) we'll send { done: true }.
* When we see the last element of the input iterator, we don't modify the sum anymore, but send the total sum as the value, and indicate that there won't be any more values by setting the 'done' flag on the state
* In all other cases, we don't send a value, but we generate a new version of the state where the 'total' property is set to the current state's total + nextIn.value

#### I don't think that the operator I want can be built with the operatorFactory

If you have read the examples above, and you still don't see how to write your operator,
it could be that it cannot be written with the itr8OperatorFactory. (But to be honest,
at first I thought I had to write debounce and throttle by combining forEach with an
itr8Pushable, but later I realized that was not necessary, and I made a proper version
with itr8OperatorFactory which was passive again).

But if you are convinced that is the case, I advise you to look at the source code of
'prefetch' or 'mostRecent'.
Prefetch and mostRecent are actually returning a custom built iterator.

As long as your operator returns a function transforming the input iterator into another iterator,
you're good (and try to be polite: always support both sync and async iterators as input, and if
possible, make sure that if the input iterator is synchronous, the output iterator is synchronous
as well, and wrap it with itr8FromIterator so .pipe(...) can be used on the result).

#### Notes

* The function given to itr8OperatorFactory can also be ASYNC (useful if you can only know the new state after an async operation).

* The function given to itr8OperatorFactory can also return an ASYNC iterator (useful if you can only know each new elements after another async operation).


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
* Libraries like RxJS solve it by inventing something new called Observables.
* Using transform streams is cumbersome!
* Other libraries like HighlandJS do something similar to IxJS, but built upon NodeJS streams, which makes it non-browser-friendly (you'd need browserify).
* A project called rxjs-transducer exists that tries to reuse the RxJS 'operators' in other contexts, but it seems about arrays and not iterators at first sight.
* The current [proposal for iterator helpers](https://github.com/tc39/proposal-iterator-helpers)
solves things the same way as they have been solved for arrays. The problem with this is that
**the iterator must contain all available operators as properties**, which keeps people from writing
reuseable new operators, thus people keep solving the same problems over and over again.
* [js-iterator](https://github.com/tenorviol/js-iterator) has the exact same problem (as does every library that uses dot-chaining)

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
In my view, if we create a set of functions that take some arguments as input, and that produces functions transforming an existing iterator into a new iterator, we have all we need. And since it is pull-based it doesn't matter if the producer is faster, but it also means we can handle any situation that RxJS can handle, because it means we can definitely handle all 'reactive' cases where the producer is slower than the consumer.

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
