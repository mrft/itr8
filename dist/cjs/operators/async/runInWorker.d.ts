export {};
/**
 * I'd like to create an operator that will take another transIterator as input,
 * and that will run that transIterator in another thread without any hassle.
 * It means that the input iterator's output should be sent to the worker, and the output should
 * be sent back to the main thread.
 *
 * Since a worker always needs another file, I think we should tell this module which file,
 * and what is the name we should import (that way we could also point to the current file
 * and export the 'processing pipeline', but still have the clsely related code nearby, such
 * that there won't be a lot of difference between running it in the main thread of running it
 * somewhere else)
 *
 * https://www.npmjs.com/package/callsite would even allow us to get the filename of the
 * calling function (which would allow the caller to use a relative path, instead of forcing
 * them to use __dirname)
 */
