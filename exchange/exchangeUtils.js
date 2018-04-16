// generic low level reusuable utils for interacting with exchanges.

const retry = require('retry');
const errors = require('./exchangeErrors');

const retryInstance = (options, fn, callback) => {
  if(!options) {
    options = {
      retries: 5,
      factor: 1.2,
      minTimeout: 1 * 1000,
      maxTimeout: 3 * 1000
    };
  }

  var operation = retry.operation(options);
  operation.attempt(function(currentAttempt) {
    fn(function(err, result) {
      if (!(err instanceof errors.AbortError) && operation.retry(err)) {
        return;
      }

      callback(err ? err.message : null, result);
    });
  });
}

module.exports = {
  retry: retryInstance
}