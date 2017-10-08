var tulind = require("tulind");
var semver = require("semver");
var _ = require('lodash');

var tulindError = 'Gekko was unable to configure Tulip Indicators:\n\t';

// Wrapper that executes a tulip indicator
var execute = function(callback, params) {
    var tulindCallback = function(err, result) {
        if (err) return callback(err);
        var table = {}
        for (var i = 0; i < param.results.length; ++i) {
            table[params.results[i]] = result[i];
        }
        callback(null, table);
    };

    return params.indicator.indicator(params.inputs, params.options, tulindCallback);
}

// Helper that makes sure all required parameters
// for a specific talib indicator are present.
var verifyParams = (methodName, params) => {
    var requiredParams = methods[methodName].requires;

    _.each(requiredParams, paramName => {
        if(!_.has(params, paramName))
            throw talibError + methodName + ' requires ' + paramName + '.';

        var val = params[paramName];

        if(!_.isNumber(val))
            throw talibError + paramName + ' needs to be a number';
    });
}

var methods = {};

methods.macd = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInSignalPeriod'],
    create: (params) => {
        verifyParams('macd', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.macd,
            inputs: [data.close],
            options: [params.optInFastPeriod, params.optInSlowPeriod, params.optInSignalPeriod],
            results: ['macd', 'macdSignal', 'macdHistogram'],
        });
    }
}

module.exports = methods;

