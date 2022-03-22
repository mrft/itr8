# itr8

An experiment to create a unified interface over both [synchronous](https://www.javascripttutorial.net/es6/javascript-iterator/) and [asynchronous iterators](https://www.javascripttutorial.net/es-next/javascript-asynchronous-iterators/) such that the same iterator-operators (cfr. RxJS operators like filter, map, ...) can be used in various contexts (plain arrays, NodeJS streams, Observables, ...).

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

    // this will work as well (because pipe produces andther 'pipeable')
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
* Improving the speed, because that seems to have taken a hit after supporting all sync and async operator cases
* Add more operators

## What is a transIterator?

It is simply a function with an iterator as single argument which will return another iterator. So it transforms iterators, which is why I have called it transIterator (~transducers).

## Writing your own operators

There are 2 options to write your own operators. You can either build a new operator by chaining
a bunch of existing operators together, or hyou can write your own.

### A new operator by combining existing operators

Let's use the same example as is used in the [RxJS tutorial](https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457#7b9e): a filterNil operator.

It can be created with the filter operator, so:

```typescript
    const filterNil = filter((x) => x !== undefined && x !== null)
```

or by using the itr8Pipe method (useful for combining multiple operators):

```typescript
    const filterNil = itr8Pipe((filter((x) => x !== undefined && x !== null))
```

Another example: a 'redim' operator can be created by combining flatten and groupPer.
So to turn [ [ 1, 2 ], [ 3, 4 ], [ 5, 6 ] ] into [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
You'll want the redim(3) operator (3 being the new 'rowSize').

```typescript
    const redim = (rowSize:number) => itr8Pipe(
        flatten(),
        groupPer(rowSize),
    );
```




### Writing a new operator from scratch

Let's show you the code right away:

```typescript
    const filterNil = operatorFactory<void, any, any, null>(
        (nextIn, state, ...params) => (
            if (nextIn.done || (nextIn.value !== undefined && nextIn.value !== null)) {
                return [itr8FromSinglevalue(nextIn), state];
            } else {
                return [itr8FromArray([]), state];
            }
        ),
        null, // no initial state needed
    );
```

Now what is nextIn, state and param?

 * nextIn is simply the result of the next call of the incoming iterator. (The next call of an iterator always returns an object of the form { done: true or false, value: \<current value\> })
 * state is used to store intermediate data, for example if you want to make a sum, the state will be the sum until now, or if you need to buffer things, state could be the array of things in the buffer.
 * params is the argument that you can pass to your operator, like the number of elements in a limit operator, or the mapping function in a map operator

What does that function return?

It returns a tuple.
* The first element of the tuple is
A NEW ITERATOR
  * it should be generating values of the form { done: ..., value: ... }) to return as the response when next is being called
  * this iterator can be 'empty' if the current nextIn doesn't lead to a next on the output side (for example in a filter function)
  * this iterator can return many elements (for the same nextIn) if 1 element on the input side returns multiple elements on the output side (for example in a flatten function)
* The second element of the tuple is the new state (for example state + nextIn.value in case of a sum operator). Don't modify the state, produce anew state, and keep this function pure!

Knowing all this we can break down the example:
* if the input iterator is done, or its value is different from null or undefined, we'll just pass the incoming thing unaltered
* else we'll return [undefined, state] to indicate that this will not produce a value on our iterator
* we don't need state, so we always pass the incoming state unaltered

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
reuseable new operators, solving the same problems over and over again.

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

