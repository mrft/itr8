# ROADMAP

This is a bunch of ideas of things to add or change.

## Entirely remove all OO-style stuff (especially .pipe)

I first implemented a .pipe function on every iterator that the library would return,
but that makes the iterators returned by the lib 'special' instead of being simple and plain
(sync or async) iterators.
This does not make sense if we state that we want to embrace this standard.
It is also not necessary, because we only need a generic pipe(...) function instead of an object
method. That way, we can pipe everything (not just things related to this library), and it will
be easy to replace once the pipe syntax is fanally added to javascript (possibly '|>').

So instead of writing.

```typescript
itr8FromIterator(standardIterator).pipe(...)
```

it will simply become:

```typescript
pipe(standardIterator, ...);
// This is fully generic
const plusOne = (x) => x + 1;
const timesThree = (x) => x * 3;
pipe(4, plusOne, timesThree) === timesThree(plusOne(4)); // returns the actual result (15)
```

and and a compose function wil also be added to easily create (without executing it) a new function
that is the result of applying the second one to the output of the first one.

```typescript
const plusOneTimesThree = compose(plusOne, timesThree); // returns a function!
plusOneTimesThree(4) === 15;
```

## Provide a cli-tool?

Just an idea: when a user does `npm i -g mrft/itr8` he should be able to run itr8 on the command-line.
Then all operators should be available to him, so it can be used as a CLI tool to manipulate data.
By default stdin could be used for input (maybe parsed lineByLine by default?)

Think something like:

```bash
FILE="myLargeFile.jsonl.gz"
zcat "$FILE" | itr8 "[ filter(l => l.length), map(l => JSON.parse(l)), map(o => o.key)]"
# or we could make it more 'CLI-like' and allow parameters to be used with the names of the operators
zcat "$FILE" | itr8 --filter "l => l.length" --map "JSON.parse" --map "o => o.key"
# or maybe use a, b, c as default param names and only write the function body for function arguments?
zcat "$FILE" | itr8 --filter "a.length" --map "JSON.parse(a)" --map "a.key"
```

## Maybe we can use asciiflow to add some schema's to the documentation?

https://asciiflow.com

## Make it usable both in NodeJS and in the browser

Currently we use modeul: "CommonJS" in tsconfig.json, but ideally it should be ES2015
so that the compiled typescript code can be used unmodified both in NodeJS and in the
browser without forcing users to have build tools like webpack or browserify in between.

## Support the 'official' transducer/transformer spec?

The way transducers have been implemented in Ramda and a few other libraries has always confused
me (as in you really have to dig into it to really understand how they work).

James Long has a great explanation about **separation of concerns** in [his article about Transducers.js](https://archive.jlongster.com/Transducers.js--A-JavaScript-Library-for-Transformation-of-Data).
He argues that **iterate, transform and build** are three separate problems, and that transducers decouple this in such away that the transform can be used on any data structure.
To quote him:

> These are completely separate concerns, and yet most transformations in JavaScript are tightly coupled with specific data structures. Transducers decouples this and you can apply all the available transformations on any data structure.

Something he also mentions in the final notes of the post that is [introducing his transducers.js library](https://archive.jlongster.com/Transducers.js--A-JavaScript-Library-for-Transformation-of-Data#Final-Notes)

> Lazy sequences are something I think should be added to transducers.js in the future. (edit: well, this paragraph isn't exactly true, but we'll have to explain laziness more in the future)

I think that itr8 also decouples this, but in a different way: with transducers you'd need to implement another protocol (the most important method being 'step')

The [transformer protocol](https://github.com/cognitect-labs/transducers-js#transformer-protocol) requires you to add these methods on any data structure that wants to play along, or to define a transformation:

```
{
  '@@transducer/init': () => 'some inital value';
  '@@transducer/result': (r) => r;
  '@@transducer/step': (acc, cur) => ...;
}
```

In itr8, we assume that anything can be made iterable (even push-streams, by buffering). The thing about push-streams is: if a stream is push-based and the receiving end can't handle the speed, you'd get in trouble eventually, so we can safely assume that any push-based stream, can be buffered and pulled from, because the puller will be fast enough, and the buffer will always be near-empty anyway.

With this assumption in mind, we actually don't decouple iteration from transformation, but we do decouple iteration from 'build'.
First of all: maybe you don't want to 'build something' in the end, but simply perform actions based on each item, and secondly: it feels like everything can easily be made iterable, and I think it's equally easy to build something from an iterator in most cases. Besides: with transducers it also looks as if you somehow have to make it compatible with some kind of spec to make it iterable, so we might as well agree that that protocol will always be the iterator protocol. The 'step' function feels very much like the 'next' function of an iterator anyway.

So for me personally, I feel like there is less new things to learn - given you know how the iterator protocol works (it's simple, well-supported and widely used, so we might as well embrace it).

So instead of trying to be entirely agnostic about the source, I think we end up with something that's even easier to understand (maybe that's just me of course) because we assume the source to always be the same thing, an iterator. It gives us one less degree of freedom, which makes for one less thing to explain or worry about in my opinion.

Another post trying to explain transducers: https://medium.com/@shaadydawood/transducers-functional-transducers-async-transducers-e0ec65964fc2
Check out: https://www.npmjs.com/package/functional-pipelines

### What are the consequences for itr8?

It looks like itr8 has chosen a different path, by composing iterators instead of operators.

Could we think of another protocol that allows us to compose 'operators' that looks more like the iterator protocol?
I mean: if the signature would be

```typescript
(inValue: [{ done: boolean; value?: any }, state]) => [
  { done: boolean, value: any },
  state,
];
```

they could very easily be composed, but unfortunately our output format is more complex
as in: we also allow 'iterable'.
Of course we could change that to disallow iterable, and put that responsibility in the hands of
the developer => he should keep the iterator in the state and return all values as long as there are any?
It could be done, and if we do that, we'd have operators that are as easy to compose as the ones from the transducer protocol, and some people might find that easier to understand than the way transducers are implemented, because both done (or 'reduced' in transducer terms) and the value
are returned.
There's still a problem with 'state' being inside the inValue and outValue, because it belongs to a specific operator, so state should be kept 'locally' somehow in that case (this.state).

### Some ideas to also make our 'transformers' (the nextFn we currently pass to itr8OperatorFactory) composable

If we compose the transformations rather than the iterators, we might be able to gain some performance, but I find writing transducers cumbersome, because you have to think about 'writing a function that gets another function as input' and how to combine them.
When writing the nextFn for the itr8OperatorFactory, we don't care about how they will be composed
as that will be done for us, so we only have to think about what an input element produces on the output side, which is quite easy most of the time. Adding that extra complexity of havng to call "the other function" somewhere adds a mental burden that I find too high, which might be part of the reason transducers haven't really been embraced by the masses.

**Why would I try composing the transformers then instead of the iterators?**

For performance reasons: once 1 element in the chain is async, every iterator that comes behind it will necessarily become async, causing for a lot of functions being put onto the event loop (This also means that each 'transIterator' is running a lot of code to check whether the input iterator is sync or async). I have actually proven (in the 'transduce' operator tests) that transducer based version of the same operations (filter, map, repeat, ...) was quite a lot faster (probably because of the single intermediate iterator, and probably also because all the transducers are synchronous, so there are way less isPromise checks, but maybe in general, because the transducers call the next transducer there are less intermediate allocations of new data structures?)
If we combine the transformations into 1 single method, we'd end up with a single 'intermediate' iterator that executes a single function - in case everything is synchronous - for every element in the stream.

So I have been trying to figure out a way to also make our 'transformers' composable, without changing how they work. So instead of relying on a theoretical model, I would provide helper functions to make composing possible, while maintaining the easy-to-use interface. So while (or maybe just because) theoretically less advanced than transducers, we might end up with something that is easier to use, which in my view is really important. (if we find a way to compose them, we might also find a way to turn them into actual transformers for a transducer as well, in which case we might also have helped the transducer-loving world forward)

````typescript
// Transformer spec defines these methods on an object
// init:
// step:
// result:
// reduced:
// value:

// processing fn:
  step(prevOut, curIn) => newOut

// map:
  nextFn(nextIn, state) => {
    return { done: false, value: state.mapFn(nextIn.value) }
  }
// filter
  nextFn(nextIn, state) => {
    return state.filterFn(nextIn.value) ? nextIn : { done: false }
  }

// nextFn returns a nextIn and to compose we'd need a function
// that takes a nextFn and produces another nextFn

// composing a map, then filter would be written manually as
const result1 = /* await is some cases */ nextFnMap(nextIn, stateOfMap)
return nextFnFilter(result1, stateOfFilter)

itr8OperDefFactory(nextFn, initFn) => // we could produce a 'stateful' nextFn()?
// or a nextFn, that already has state applied? and thus only takes 1 argument
// which is an input next?
// and if input and output would be compatible,
// this would create functions that can be composed/piped
// unfortunately they are not 100% compatible right currently because the output
// 1. can contain iterable instead of value and  2. can be a promise
// which means that we'd need tooling to link them together
// 1. could be replaced by always returning an iterator or by adding a boolean
//    to the state (which we 'internalized') informing the 'engine' whether
//    a new next is needed already
// so if we want to 'compose' the nextFns (turning the 'pull' into a 'push' to the next nextFn)
// so that we can create a single transIterator from multiple 'transformers' combined,
// we'd need a composer function to do that for us so it can interpret for example the iterable field
// and as a result call the next one multiple times?
// all this should produce another nextFn that is the combination of all the others
// so then we could have a method called transIt(nextFn, nextFn, nextFn) that turns that list into
// a single transIterator, instead of a chain of many
// OH AND I GUESS MAYBE WE CAN USE SOMETHING LIKE MONADS TO TURN NEXTFN INTO A FUNCTION THAT CAN BE COMPOSED???
// (instead of writing a manual function to do it?) state will always be a problem when it's an argument I guess
(...args) => { // each arg is a 'transform' function (nextFn)
  // return another nextFn function that is the combination of all the arguments
  return {
    nextFn: (nextIn, state) => {
      let curPrevOut = nextIn; // a 'normal' IteratorResult is compatible with a nextOut value
      let result;
      for (const aFn of args) {
        if (curPrevOut.iterable) {
          result = { done: false, iterable: [] };
          let count = 0;
          for (const c of curPrevOut.iterable) {
            const r =  aFn(c, state[aFn.id]);
            if (r.done) break;
            result.iterable.push(r.value); // iterable should be created with a generator function
            count += 1;
          }
          if ( count <= 0 ) {
            result = { done: true, iterable: [] };
          }
        } else {
          result = aFn(curPrevOut, state[aFn.id]) // state thing is pseudo code to get the idea across
        }
        if (result.done) {
          return result;
        }
        curPrevOut = result;
      }
      return result;
    },
    initStateFn: () => {} // combine all the init-states of all the args?
  }
}

/**
 * the "monad-inspired" version would have a "bind" function to turn
 * ```(nextIn:IteratorResult, state) => nextFnResult```
 * into an ```(nextFnResult) => nextFnResult``` version
 * state from the output is kept for next time
 * (the 'state' will be 'against pure functional programming', but I see no way around it
 * in order to create some truly useful operations)
 *
 * The 'unity' function and the 'lift' function - lift(f, x) = unit(f(x)) - to
 * the "lift" function should make sure the right part of the input is handed over
 * to the original function.
 * So in short (ignoring the iterable property) unit should be like IteratorResult => NextFnOutputResult
 */
const unity = (nextIn) => {
  let state;
  let done = false;
  return (nextFnFormattedNextIn) => {
    if (nextFnFormattedNextIn.iterable) {
      // call nextIn on every element from the iterable, and return
      // a response also containing an iterable with all the results
      // from calling
      // watch out: when it returns done: true on one, we'd need to keep some state
      // so we can tell we are 'done' the next time
    } else {
      return nextIn(nextFnFormattedNextIn /* without the state */, state)
    }
  }
}
````

## How to handle failures?

Some of our operators (for example 'map') allow async methods to be run, so they can be used for things that
are prone to failure (I am not considering the synchronous case because that can be controlled entirely by the user).

The question is: if we know that things can potentially fail, are we going to add a specific
protocol to handle these failures? Right now: if something fails that means that the next call
will reject its promise, and the entire processing chain will break.

We could say: it's up to the user to make sure that his function always resolves, and so it's up
to him to invent a data format that can express failures, so that they can be handled further
down the line.

But I recently viewed this youtube video about the [Saga pattern](https://www.youtube.com/watch?v=xDuwrtwYHu8) which essentially means: on failure take compensating measures for every action
that already happened (kind of like 'rollback' if possible, but in some cases - like sending an email - things cannot be undone and you have to send another message explaining that the previous
email should be ignored).

It could be that we can agree on a way to enforce (or at least support) people to implement this
kind of pattern, which also helps in being aware of whatever can go wrong, in order to build more
robust systems.

## Piping should have better typing

Piping should have better typing (like RxJS does it?) to make sure you get hints if you are trying to pipe functions together whose output and input types do not match.

## General code cleanup

- Should we create 'categories' of operators so people do not have to include the entire library?
  (for example delay, throttle, debounce under operators/timeBased and maybe max, min, average, pctl(...), total, ... under operators/numeric)
- This is done in the jsdoc by adding @category, but all the operators currently atre still in the same file. Maybe one file per operator would make sense, and maybe also one file per category, and one file exposing all operators. This way, people who don't need to worry about bundle size can simply import
  itr8/operators, and people with a strict bundle size can import /itr8/operators/general/map

## Writing more and better documentation and examples to show what can be done.

- Show how an 'The Elm Architecture'-like or appRun-like app engine could be implemented
  - 1 way is to use something similar to CSP, where multiple processes push messages to each other by using itr8Pushables.
    - a zip operation would zip the event and the current state together
    - push the new state to the state iterator
    - push the new state also to the view-iterator that transforms state into html
    - push the generated html to the render-iterator that will update the screen
  - another way is to view the entire application as 1 single transIterator where the input is 'events' and the output is html (or lit-html templateresult).
    - a zip operation would zip that event and the current state together
    - a tap operation would send the newState back into the pushable state iterator
    - A for each at the end would take the html and use it to update the DOM
- Explain how an ASYNC iterator is actually an extremely simple 2-way protocol:
  - every next() call informs the sender that we're ready to receive another value
  - every resolved promise hands the new message to the receiver
  - despite its simplicity, there is a fair amount of problems that can be solved with it.
    Imagine for example a round-robin scheme: each handler will indicate when it's ready to process
    another message by a next() call. The round robin engine will send every new message
    to the first of the round robin circle that is ready to receive that new message
    (it would be a waste of time to send it to the next regardless whether it's ready or not)

## Add some more useful operators

- gzip/gunzip?
- we'll probably find some inspiration in the RxJS library and also in [Elxir's Streams](https://hexdocs.pm/elixir/Stream.html)
- implement the equivalent of json-stream that works on a single-character or string iterator
  - first I was looking at jsonstream which is built upon jsonparse which is really old
  - then I came across streamparser-json, which is an OO-style library that defines a separate
    'tokenizer' and 'tokenParser', which when combined would produce a jsonParser.
    - The write() method of the tokenizer feels 'wrong' because it does 3 things: add the incoming data
      to the internal buffer, go through the buffer to produce new tokens, on every token found, call
      a callback function with that token.
    - I think we should be able to extract the main algorithm (parsing into a token) into the operatorFactory (using the 'state' to hold the part of the buffer that didn't produce an
      entire new token yet and other state needed by a tokenizer). That would be the first 'operator',
      the second operator would take
      a stream of tokens, and produce objects (only selecting the ones we're interested in).
    - The tokenizer holds the entire parent object in memory which is a problem for large arrays
      and the way to 'fix' this (from the examples on their website) is to manipulate that object!
    - The alternative would be to just build a transIterator that wraps this other library,
      and although it would require less code changes, I feel that the library would benefit
      from a better seperation of concerns.
- Use [cluster](https://nodejs.org/docs/latest-v16.x/api/cluster.html) and/or [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to allow CSP style
  programming and make communicating from one process to another (at least from master to slaves and the other way around) easy. If we do it properly (detect or by passing in a flag to choose whether we are in node or in the browser), the user only needs to pass a single parameter, which is the file containing the transIterator that will translate input messages to output messages, and then the same code could be used on the server as well as in the browser.
  A [throng](https://github.com/hunterloftis/throng) feature that I like is that it respawns a worker if one dies, and ideally the new one would get the same channel so the master can keep sending commands to it, maybe without even realising that one has crashed and has been restarted. (Maybe we need to create a new transIterator that has an 'ack' channel (another iterator) sa input to confirm that processing has been finished, so it can retry on failure, could maybe be written by using the 'mostRecent' operator combined with a pushable iterator somehow?)
  - For CLUSTER: a worker.send method exists that allows to send messages from worker to parent and the other way around. Maybe we can wrap these into an itr8Pushable, in such a way that people can write exactly the same CSP-style code, and easily have it running on multiple cores when they wish to. So the 'worker' could be defined as 'a function that takes an iterator as input (the incoming messages) and produces an iterator (the responses to master)'. Sounds familiar? Yes, because it's a simple transIterator!
    And the code around it (which is always the same) should make sure that these results are being pushed back using worker.send, inside a forEach that actively drains the iterator...
  - For WEB WORKERS: we can use the postMessage interface to send messages back and forth.
  - There are some examples online to allow for ts files to be loaded (by using ts-node, which would make it a runtime dependency rather than a dev dependency)

## Other 'generators'

- for typical cases like file input, db paga-per-page processing, ...

- how about an 'itr8ToMultiIterable' to handle the case where you want to 'split' the stream into multiple streams for separate further processing?
  - because it is pull based, you'd need state to know about the 'subscribed' iterators, so we can keep track of what their next element would be
  - it should buffer when 1 child-iterator gets the next, so the same element can be given to all the other subscribers on their next call
  - the buffer should be kept as long as one subscriber didn't ask for that next()
  - there should be a way to 'disconnect', tell the iterable that we are not interested in more, so it won't keep buffering for no reason because we stop asking for next stuff.
  - we could add a timeout to automatically clean up the buffer if a subscriber didn't ask for a next element within a certain time (1 minute default?)

## use iterators everywhere

Think about how to make it easy to use operator parameters that are iterators themselves.

- Would make it easier to implement the zip operator (less boilerplate)
- Would in general allow for operator parameters that 'change over time'.
- Can we make this generic in such away that _any_ parameter of type T could be replaced
  by an (Async)Iterator<T>?
  - The most powerful would be if the writer of the operator is in charge of calling next()
    on the parameter, BUT it would also make writing operators more complex, because then
    the authors would also need to use thenable in order to handle sync and async iterators
    properly, which adds a lot of complexity.
  - So we could also do as we already do for the nextIn param: call next on it ourselves
    and passing the response into the function, but that way we loose the freedom to not call
    next on every next call to the incoming iterator.
  - It might make things so complex that nobody knows how to write an operator anymore.
  - Of course: if we do it implicitly, all operators would be able to change their paramaters
    over time without any code changes for existing operators!
  - Maybe we could have an advanced operator factory where the responsibility lies with the user
- Can we abstract the handling of sync versus async iterators away in an elegant manner?
  That means that if the input iterator is sync, all handling stays sychronous and will only
  become asynchronous when the iterator is asynchronous. But all this without the user having
  to alter the code...

I created 2 helper functions called thenable and forLoop for this.
Thenable will make any value thenable, to make sure we can use the same code regardless whether the input is a promise or not, and guaranteeing that the handling will also be synchronous if the input
is not a promise.
forLoop is like a for loop that will be synchronous if the input is synchronous and synchronous otherwise.

## batch support

Currently I don't see a lot of performance benefits of the batch support, so it could be that we might as well remove the support for that, because it complicates building new operators.

1 thing is important: **'itr8batch' should not be a property (literally a JS property now) of the iterator, nor should it make the itr8OperatorFactory more complex (as it currently does). That code should be removed ASAP**.
If we would still want to support it, it should be done as an operator that has a transIterator as its argument (or maybe support multiple arguments in order to avoid needing another compose)

Example:

```typescript
// Instead of
myIt.pipe(
  asBatch(),
  someOp(),
  someOtherOp(),
  asNoBatch(),
)

// it would become something like below (so the asBatch operator would make sure all its
// transIt arguments would be applied to each array element separately)
myIt.pipe(
  asBatch(,
    someOp(),
    someOtherOp(),
  ),
)

// or if the batch operator would only support a single argument it would become a bit less
// elegant as we'd need 'itr8Pipe' to compose the transIterators.
myIt.pipe(
  asBatch(,
    itr8Pipe(
      someOp(),
      someOtherOp(),
    ),
  ),
)
```

Other questions about how the batch things should work:
Improve batch support: current implementation will grow and shrink batch size depending on the operation (filter could shrink batches significantly for example, but batches with only a few elements don't have a very big advantage performance wise). Of course you could always `unBatch |> batch(size)` to force a new batch size, but it could be more efficient if the itr8OperatorFactory handles the batch size and keeps it constant throughtout the chain???
