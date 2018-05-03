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
      if(err && err.notFatal && operation.retry(err)) {
        return;
      }

      callback(err ? err.message : null, result);
    });
  });
}

// es6 bind all: https://github.com/posrix/es6-class-bind-all/blob/master/lib/es6ClassBindAll.js
const allMethods = targetClass => {
  const propertys = Object.getOwnPropertyNames(Object.getPrototypeOf(targetClass))
  propertys.splice(propertys.indexOf('constructor'), 1)
  return propertys
}

const bindAll = (targetClass, methodNames = []) => {
  for (const name of !methodNames.length ? allMethods(targetClass) : methodNames) {
    targetClass[name] = targetClass[name].bind(targetClass)
  }
}

module.exports = {
  retry: retryInstance,
  bindAll
}