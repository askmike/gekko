const _ = require('lodash');

let RetryError = function(message) {
    _.bindAll(this);

    this.name = "RetryError";
    this.message = message;
}

RetryError.prototype = new Error();

let AbortError = function(message) {
    _.bindAll(this);

    this.name = "AbortError";
    this.message = message;
}

AbortError.prototype = new Error();

module.exports = {
    'RetryError': RetryError,
    'AbortError': AbortError
};

