import { Observable } from 'rxjs';

const itr8FromObservable = (observable:Observable<any>) => {
  let buffer:any[] = [];

  let currentResolve;
  let currentReject;
  let currentDataPromise;

  const createNewCurrentDataPromise = () => {
    currentDataPromise = new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
    });
    buffer.push(currentDataPromise);
  }

  createNewCurrentDataPromise();

  observable.subscribe({
    next(data) {
      currentResolve(data);
      createNewCurrentDataPromise();
    },
    error(err) {
      console.error('[observable] something wrong occurred: ' + err);
    },
    complete() {
      currentResolve(undefined);
    }
  });

  return {
    next: async () => {
      if (buffer.length > 0) {
        const [firstOfBufferPromise, ...restOfBuffer] = buffer;
        buffer = restOfBuffer;
        const asyncNext = await firstOfBufferPromise;
        return { value: asyncNext, done: asyncNext === undefined };
      } else {
        throw new Error('[itr8FromObservable] No elements in the buffer?')
      }
    }
  }
}

export {
  itr8FromObservable,
}
