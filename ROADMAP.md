# ROADMAP

This is a bunch of ideas of things to add or change.

## Maybe we can use asciiflow to add some schema's to the documentation?

https://asciiflow.com


## Piping should have better typing

Piping should have better typing (like RxJS does it?) to make sure you get hints if you are trying to pipe functions together whose output and input types do not match.

## General code cleanup
* Should we create 'categories' of operators so people do not have to include the entire library?
    (for example delay, throttle, debounce under operators/timeBased and maybe max, min, average, pctl(...), total, ... under operators/numeric)
* This is done in the jsdoc by adding @category, but all the operators currently atre still in the same file. Maybe one file per operator would make sense, and maybe also one file per category, and one file exposing all operators. This way, people who don't need to worry about bundle size can simply import
itr8/operators, and people with a strict bundle size can import /itr8/operators/general/map

## Writing more and better documentation and examples to show what can be done.

* Show how an 'The Elm Architecture'-like or appRun-like app engine could be implemented
  * 1 way is to use something similar to CSP, where multiple processes push messages to each other by using itr8Pushables.
    * a zip operation would zip the event and the current state together
    * push the new state to the state iterator
    * push the new state also to the view-iterator that transforms state into html
    * push the generated html to the render-iterator that will update the screen
  * another way is to view the entire application as 1 single transIterator where the input is 'events' and the output is html (or lit-html templateresult).
    * a zip operation would zip that event and the current state together
    * a tap operation would send the newState back into the pushable state iterator
    * A for each at the end would take the html and use it to update the DOM 

## Add some more useful operators
* gzip/gunzip?
* we'll probably find some inspiration in the RxJS library and also in [Elxir's Streams](https://hexdocs.pm/elixir/Stream.html)
* implement the equivalent of json-stream that works on a single-character or string iterator
  * first I was looking at jsonstream which is built upon jsonparse which is really old
  * then I came across streamparser-json, which is an OO-style library that defines a separate
    'tokenizer' and 'tokenParser', which when combined would produce a jsonParser.
    * The write() method of the tokenizer feels 'wrong' because it does 3 things: add the incoming data
    to the internal buffer, go through the buffer to produce new tokens, on every token found, call
    a callback function with that token.
    * I think we should be able to extract the main algorithm (parsing into a token) into the operatorFactory (using the 'state' to hold the part of the buffer that didn't produce an
    entire new token yet and other state needed by a tokenizer). That would be the first 'operator',
    the second operator would take
    a stream of tokens, and produce objects (only selecting the ones we're interested in).
    * The tokenizer holds the entire parent object in memory which is a problem for large arrays
    and the way to 'fix' this (from the examples on their website) is to manipulate that object!
    * The alternative would be to just build a transIterator that wraps this other library,
    and although it would require less code changes, I feel that the library would benefit
    from a better seperation of concerns.
* Use [cluster](https://nodejs.org/docs/latest-v16.x/api/cluster.html) and/or [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to allow CSP style
  programming and make communicating from one process to another (at least from master to slaves and the other way around) easy. If we do it properly (detect or by passing in a flag to choose whether we are in node or in the browser), the user only needs to pass a single parameter, which is the file containing the transIterator that will translate input messages to output messages, and then the same code could be used on the server as well as in the browser.
  A [throng](https://github.com/hunterloftis/throng) feature that I like is that it respawns a worker if one dies, and ideally the new one would get the same channel so the master can keep sending commands to it, maybe without even realising that one has crashed and has been restarted. (Maybe we need to create a new transIterator that has an 'ack' channel (another iterator) sa input to confirm that processing has been finished, so it can retry on failure, could maybe be written by using the 'mostRecent' operator combined with a pushable iterator somehow?)
    * For CLUSTER: a worker.send method exists that allows to send messages from worker to parent and the other way around. Maybe we can wrap these into an itr8Pushable, in such a way that people can write exactly the same CSP-style code, and easily have it running on multiple cores when they wish to. So the 'worker' could be defined as 'a function that takes an iterator as input (the incoming messages) and produces an iterator (the responses to master)'. Sounds familiar? Yes, because it's a simple transIterator!
    And the code around it (which is always the same) should make sure that these results are being pushed back using worker.send, inside a forEach that actively drains the iterator...
    * For WEB WORKERS: we can use the postMessage interface to send messages back and forth.
    * There are some examples online to allow for ts files to be loaded (by using ts-node, which would make it a runtime dependency rather than a dev dependency)

## Other 'generators'
* for typical cases like file input, db paga-per-page processing, ...

* how about an 'itr8ToMultiIterable' to handle the case where you want to 'split' the stream into multiple streams for separate further processing?
  * because it is pull based, you'd need state to know about the 'subscribed' iterators, so we can keep track of what their next element would be
  * it should buffer when 1 child-iterator gets the next, so the same element can be given to all the other subscribers on their next call
  * the buffer should be kept as long as one subscriber didn't ask for that next()
  * there should be a way to 'disconnect', tell the iterable that we are not interested in more, so it won't keep buffering for no reason because we stop asking for next stuff.
  * we could add a timeout to automatically clean up the buffer if a subscriber didn't ask for a next element within a certain time (1 minute default?)
  * 

## use iterators everywhere
Think about how to make it easy to use operator parameters that are iterators themselves.
* Would make it easier to implement the zip operator (less boilerplate)
* Would in general allow for operator parameters that 'change over time'.
* Can we make this generic in such away that *any* parameter of type T could be replaced
  by an (Async)Iterator<T>?
    * The most powerful would be if the writer of the operator is in charge of calling next()
      on the parameter, BUT it would also make writing operators more complex, because then
      the authors would also need to use thenable in order to handle sync and async iterators
      properly, which adds a lot of complexity.
    * So we could also do as we already do for the nextIn param: call next on it ourselves
      and passing the response into the function, but that way we loose the freedom to not call
      next on every next call to the incoming iterator.
    * It might make things so complex that nobody knows how to write an operator anymore.
    * Of course: if we do it implicitly, all operators would be able to change their paramaters
    over time without any code changes for existing operators!
    * Maybe we could have an advanced operator factory where the responsibility lies with the user
* Can we abstract the handling of sync versus async iterators away in an elegant manner?
  That means that if the input iterator is sync, all handling stays sychronous and will only
  become asynchronous when the iterator is asynchronous. But all this without the user having
  to alter the code...

I created 2 helper functions called thenable and forLoop for this.
Thenable will make any value thenable, to make sure we can use the same code regardless whether the input is a promise or not, and guaranteeing that the handling will also be synchronous if the input
is not a promise.
forLoop is like a for loop that will be synchronous if the input is synchronous and synchronous otherwise.

## batch support

Currently I don't see a lot of performance benefits of the batch support, so it could be that we might as well remove the support for that, because it complicates building new operators.

Further improve batch support: current implementation will grow and shrink batch size depending on the operation (filter could shrink batches significantly for example, but batches with only a few elements don't have a very big advantage performance wise). Of course you could always `unBatch |> batch(size)` to force a new batch size, but it could be more efficient if the itr8OperatorFactory handles the batch size and keeps it constant throughtout the chain.
