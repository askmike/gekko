const _ = require('lodash');

const ExchangeError = function(message) {
  _.bindAll(this);

  this.name = "ExchangeError";
  this.message = message;
}
ExchangeError.prototype = new Error();

const ExchangeAuthenticationError = function(message) {
  _.bindAll(this);

  this.name = "ExchangeAuthenticationError";
  this.message = message;
}
ExchangeAuthenticationError.prototype = new Error();

const RetryError = function(message) {
  _.bindAll(this);

  this.name = "RetryError";
  this.retry = 5;
  this.message = message;
}
RetryError.prototype = new Error();

const AbortError = function(message) {
  _.bindAll(this);

  this.name = "AbortError";
  this.message = message;
}
AbortError.prototype = new Error();

module.exports = {
  ExchangeError,
  ExchangeAuthenticationError,
  RetryError,
  AbortError
};

