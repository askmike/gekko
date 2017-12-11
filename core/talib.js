var semver = require("semver");
var _ = require('lodash');

// validate that talib is installed, if not we'll throw an excepion which will
// prevent further loading or out outside this module
try {
    var talib = require("talib");
} catch (e) {
    module.exports = null;
    return;
}

var talibError = 'Gekko was unable to configure talib indicator:\n\t';
var talibGTEv103 = semver.gte(talib.version, '1.0.3');

// Wrapper that executes a talib indicator
var execute = function(callback, params) {
    // talib callback style since talib-v1.0.3
    var talibCallback = function(err, result) {
        if(err) return callback(err);
        callback(null, result.result);
    };

    // talib legacy callback style before talib-v1.0.3
    var talibLegacyCallback = function(result) {
        var error = result.error;
        talibCallback.apply(this, [error, result]);
    };

    return talib.execute(params, talibGTEv103 ? talibCallback : talibLegacyCallback);
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

methods.accbands = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('accbands', params);

        return (data, callback) => execute(callback, {
            name: "ACCBANDS",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ad = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('accbands', params);

        return (data, callback) => execute(callback, {
            name: "AD",
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.adosc = {
    requires: ['optInFastPeriod', 'optInSlowPeriod'],
    create: (params) => {
        verifyParams('adosc', params);

        return (data, callback) => execute(callback, {
            name: "ADOSC",
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInFastPeriod: params.optInFastPeriod,
            optInSlowPeriod: params.optInSlowPeriod
        });
    }
}

methods.adx = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('adx', params);

        return (data, callback) => execute(callback, {
            name: "ADX",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.adxr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('adxr', params);

        return (data, callback) => execute(callback, {
            name: "ADXR",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.apo = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInMAType'],
    create: (params) => {
        verifyParams('apo', params);

        return (data, callback) => execute(callback, {
            name: "APO",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.length - 1,
            optInFastPeriod: params.optInFastPeriod,
            optInSlowPeriod: params.optInSlowPeriod,
            optInMAType: params.optInMAType
        });
    }
}

methods.aroon = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('aroon', params);

        return (data, callback) => execute(callback, {
            name: "AROON",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.aroonosc = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('aroonosc', params);

        return (data, callback) => execute(callback, {
            name: "AROONOSC",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.atr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('atr', params);

        return (data, callback) => execute(callback, {
            name: "ATR",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.avgprice = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('avgprice', params);

        return (data, callback) => execute(callback, {
            name: "AVGPRICE",
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.open.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.bbands = {
    requires: ['optInTimePeriod', 'optInNbDevUp', 'optInNbDevDn', 'optInMAType'],
    create: (params) => {
        verifyParams('bbands', params);

        return (data, callback) => execute(callback, {
            name: "BBANDS",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod,
            optInNbDevUp: params.optInNbDevUp,
            optInNbDevDn: params.optInNbDevDn,
            optInMAType: params.optInMAType
        });
    }
}

///////////////////////////////////////////////////////////////


// this.beta = function(data_0, data_1, period) {
//     return talibWrapper({
//         name: "BETA",
//         inReal0: data_0,
//         inReal1: data_1,
//         startIdx: 0,
//         endIdx: data_0.length - 1,
//         optInTimePeriod: period
//     });
// };

methods.bop = {
    requires: [],
    create: (params) => {
        verifyParams('bop', params);

        return (data, callback) => execute(callback, {
            name: "BOP",
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1
        });
    }
}

methods.cci = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('cci', params);

        return (data, callback) => execute(callback, {
            name: "CCI",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.cmo = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('cmo', params);

        return (data, callback) => execute(callback, {
            name: "CMO",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

// this.correl = function(data_0, data_1, period) {
//     return talibWrapper({
//         name: "CORREL",
//         inReal0: data_0,
//         inReal1: data_1,
//         startIdx: 0,
//         endIdx: data_0.length - 1,
//         optInTimePeriod: period
//     });
// };

methods.dema = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('dema', params);

        return (data, callback) => execute(callback, {
            name: "DEMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.dx = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('dx', params);

        return (data, callback) => execute(callback, {
            name: "DX",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ema = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('ema', params);

        return (data, callback) => execute(callback, {
            name: "EMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ht_dcperiod = {
    requires: [],
    create: (params) => {
        verifyParams('ht_dcperiod', params);

        return (data, callback) => execute(callback, {
            name: "HT_DCPERIOD",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.ht_dcphase = {
    requires: [],
    create: (params) => {
        verifyParams('ht_dcphase', params);

        return (data, callback) => execute(callback, {
            name: "HT_DCPHASE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.ht_phasor = {
    requires: [],
    create: (params) => {
        verifyParams('ht_phasor', params);

        return (data, callback) => execute(callback, {
            name: "HT_PHASOR",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.ht_sine = {
    requires: [],
    create: (params) => {
        verifyParams('ht_sine', params);

        return (data, callback) => execute(callback, {
            name: "HT_SINE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}


methods.ht_trendline = {
    requires: [],
    create: (params) => {
        verifyParams('ht_trendline', params);

        return (data, callback) => execute(callback, {
            name: "HT_TRENDLINE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.ht_trendmode = {
    requires: [],
    create: (params) => {
        verifyParams('ht_trendmode', params);

        return (data, callback) => execute(callback, {
            name: "HT_TRENDMODE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.imi = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('imi', params);

        return (data, callback) => execute(callback, {
            name: "IMI",
            open: data.open,
            close: data.close,
            startIdx: 0,
            endIdx: data.open.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.kama = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('kama', params);

        return (data, callback) => execute(callback, {
            name: "KAMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.linearreg = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('linearreg', params);

        return (data, callback) => execute(callback, {
            name: "LINEARREG",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.linearreg_angle = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('linearreg_angle', params);

        return (data, callback) => execute(callback, {
            name: "LINEARREG_ANGLE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.linearreg_intercept = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('linearreg_intercept', params);

        return (data, callback) => execute(callback, {
            name: "LINEARREG_INTERCEPT",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.linearreg_slope = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('linearreg_slope', params);

        return (data, callback) => execute(callback, {
            name: "LINEARREG_SLOPE",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ma = {
    requires: ['optInTimePeriod', 'optInMAType'],
    create: (params) => {
        verifyParams('ma', params);

        return (data, callback) => execute(callback, {
            name: "MA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod,
            optInMAType: params.optInMAType
        });
    }
}

methods.macd = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInSignalPeriod'],
    create: (params) => {
        verifyParams('macd', params);

        return (data, callback) => execute(callback, {
            name: "MACD",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInFastPeriod: params.optInFastPeriod,
            optInSlowPeriod: params.optInSlowPeriod,
            optInSignalPeriod: params.optInSignalPeriod
        });
    }
}

methods.macdext = {
    requires: [
        'optInFastPeriod',
        'optInFastMAType',
        'optInSlowPeriod',
        'optInSlowMAType',
        'optInSignalPeriod',
        'optInSignalMAType'
    ],
    create: (params) => {
        verifyParams('macdext', params);

        return (data, callback) => execute(callback, {
            name: "MACDEXT",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInFastPeriod: params.optInFastPeriod,
            optInFastMAType: params.optInFastMAType,
            optInSlowPeriod: params.optInSlowPeriod,
            optInSlowMAType: params.optInSlowMAType,
            optInSignalPeriod: params.optInSignalPeriod,
            optInSignalMAType: params.optInSignalMAType
        });
    }
}

methods.macdfix = {
    requires: ['optInSignalPeriod'],
    create: (params) => {
        verifyParams('macdfix', params);

        return (data, callback) => execute(callback, {
            name: "MACDFIX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInSignalPeriod: params.optInSignalPeriod
        });
    }
}

methods.mama = {
    requires: ['optInFastLimit', 'optInSlowLimit'],
    create: (params) => {
        verifyParams('mama', params);

        return (data, callback) => execute(callback, {
            name: "MAMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInFastLimit: params.optInFastLimit,
            optInSlowLimit: params.optInSlowLimit
        });
    }
}

methods.mavp = {
    requires: ['inPeriods', 'optInMinPeriod', 'optInMaxPeriod', 'optInMAType'],
    create: (params) => {
        verifyParams('mavp', params);

        return (data, callback) => execute(callback, {
            name: "MAVP",
            inReal: data.close,
            inPeriods: params.inPeriods,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInMinPeriod: params.optInMinPeriod,
            optInMaxPeriod: params.optInMaxPeriod,
            optInMAType: params.optInMAType
        });
    }
}


methods.max = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('max', params);

        return (data, callback) => execute(callback, {
            name: "MAX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}


methods.maxindex = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('maxindex', params);

        return (data, callback) => execute(callback, {
            name: "MAXINDEX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.medprice = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('medprice', params);

        return (data, callback) => execute(callback, {
            name: "MEDPRICE",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.mfi = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('mfi', params);

        return (data, callback) => execute(callback, {
            name: "MFI",
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.midpoint = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('midpoint', params);

        return (data, callback) => execute(callback, {
            name: "MIDPOINT",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.midprice = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('midprice', params);

        return (data, callback) => execute(callback, {
            name: "MIDPRICE",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.min = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('min', params);

        return (data, callback) => execute(callback, {
            name: "MIN",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.minindex = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('minindex', params);

        return (data, callback) => execute(callback, {
            name: "MININDEX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.minmax = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('minmax', params);

        return (data, callback) => execute(callback, {
            name: "MINMAX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.minmaxindex = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('minmaxindex', params);

        return (data, callback) => execute(callback, {
            name: "MINMAXINDEX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.minus_di = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('minus_di', params);

        return (data, callback) => execute(callback, {
            name: "MINUS_DI",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.minus_dm = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('minus_dm', params);

        return (data, callback) => execute(callback, {
            name: "MINUS_DM",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.mom = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('mom', params);

        return (data, callback) => execute(callback, {
            name: "MOM",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.natr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('natr', params);

        return (data, callback) => execute(callback, {
            name: "NATR",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.obv = {
    requires: [],
    create: (params) => {
        verifyParams('obv', params);

        return (data, callback) => execute(callback, {
            name: "OBV",
            inReal: data.close,
            volume: data.volume,
            startIdx: 0,
            endIdx: data.close.length - 1
        });
    }
}

methods.plus_di = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('plus_di', params);

        return (data, callback) => execute(callback, {
            name: "PLUS_DI",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.plus_dm = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('plus_dm', params);

        return (data, callback) => execute(callback, {
            name: "PLUS_DM",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ppo = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInMAType'],
    create: (params) => {
        verifyParams('ppo', params);

        return (data, callback) => execute(callback, {
            name: "PPO",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInFastPeriod: params.optInFastPeriod,
            optInSlowPeriod: params.optInSlowPeriod,
            optInMAType: params.optInMAType
        });
    }
}

methods.roc = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('roc', params);

        return (data, callback) => execute(callback, {
            name: "ROC",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.rocp = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('rocp', params);

        return (data, callback) => execute(callback, {
            name: "ROCP",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.rocr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('rocr', params);

        return (data, callback) => execute(callback, {
            name: "ROCR",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.rocr100 = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('rocr100', params);

        return (data, callback) => execute(callback, {
            name: "ROCR100",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.rsi = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('rsi', params);

        return (data, callback) => execute(callback, {
            name: "RSI",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.sar = {
    requires: ['optInAcceleration', 'optInMaximum'],
    create: (params) => {
        verifyParams('sar', params);

        return (data, callback) => execute(callback, {
            name: "SAR",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInAcceleration: params.optInAcceleration,
            optInMaximum: params.optInMaximum
        });
    }
}

methods.sarext = {
    requires: [
        'optInStartValue',
        'optInOffsetOnReverse',
        'optInAccelerationInitLong',
        'optInAccelerationLong',
        'optInAccelerationMaxLong',
        'optInAccelerationInitShort',
        'optInAccelerationShort',
        'optInAccelerationMaxShort'

    ],
    create: (params) => {
        verifyParams('sarext', params);

        return (data, callback) => execute(callback, {
            name: "SAREXT",
            high: data.high,
            low: data.low,
            startIdx: 0,
            endIdx: data.high.length - 1,

            optInStartValue: params.optInStartValue,
            optInOffsetOnReverse: params.optInOffsetOnReverse,
            optInAccelerationInitLong: params.optInAccelerationInitLong,
            optInAccelerationLong: params.optInAccelerationLong,
            optInAccelerationMaxLong: params.optInAccelerationMaxLong,
            optInAccelerationInitShort: params.optInAccelerationInitShort,
            optInAccelerationShort: params.optInAccelerationShort,
            optInAccelerationMaxShort: params.optInAccelerationMaxShort
        });
    }
}

methods.sma = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('sma', params);

        return (data, callback) => execute(callback, {
            name: "SMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.stddev = {
    requires: ['optInTimePeriod', 'optInNbDev'],
    create: (params) => {
        verifyParams('stddev', params);

        return (data, callback) => execute(callback, {
            name: "STDDEV",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod,
            optInNbDev: params.optInNbDev
        });
    }
}

methods.stoch = {
    requires: [
        'optInFastK_Period',
        'optInSlowK_Period',
        'optInSlowK_MAType',
        'optInSlowD_Period',
        'optInSlowD_MAType'
    ],
    create: (params) => {
        verifyParams('stoch', params);

        return (data, callback) => execute(callback, {
            name: "STOCH",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,

            optInFastK_Period: params.optInFastK_Period,
            optInSlowK_Period: params.optInSlowK_Period,
            optInSlowK_MAType: params.optInSlowK_MAType,
            optInSlowD_Period: params.optInSlowD_Period,
            optInSlowD_MAType: params.optInSlowD_MAType
        });
    }
}


methods.stochf = {
    requires: [
        'optInFastK_Period',
        'optInFastD_Period',
        'optInFastD_MAType'
    ],
    create: (params) => {
        verifyParams('stochf', params);

        return (data, callback) => execute(callback, {
            name: "STOCHF",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,

            optInFastK_Period: params.optInFastK_Period,
            optInFastD_Period: params.optInFastD_Period,
            optInFastD_MAType: params.optInFastD_MAType
        });
    }
}

methods.stochrsi = {
    requires: [
        'optInTimePeriod',
        'optInFastK_Period',
        'optInFastD_Period',
        'optInFastD_MAType'
    ],
    create: (params) => {
        verifyParams('stochrsi', params);

        return (data, callback) => execute(callback, {
            name: "STOCHRSI",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,

            optInTimePeriod: params.optInTimePeriod,
            optInFastK_Period: params.optInFastK_Period,
            optInFastD_Period: params.optInFastD_Period,
            optInFastD_MAType: params.optInFastD_MAType
        });
    }
}

methods.t3 = {
    requires: [
        'optInTimePeriod',
        'optInFastK_Period',
        'optInFastD_Period',
        'optInFastD_MAType'
    ],
    create: (params) => {
        verifyParams('t3', params);

        return (data, callback) => execute(callback, {
            name: "T3",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod,
            optInVFactor: params.optInVFactor
        });
    }
}

methods.tema = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('tema', params);

        return (data, callback) => execute(callback, {
            name: "TEMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.trange = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('trange', params);

        return (data, callback) => execute(callback, {
            name: "TRANGE",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.trima = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('trima', params);

        return (data, callback) => execute(callback, {
            name: "TRIMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.trix = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('trix', params);

        return (data, callback) => execute(callback, {
            name: "TRIX",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.tsf = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('tsf', params);

        return (data, callback) => execute(callback, {
            name: "TSF",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.typprice = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('typprice', params);

        return (data, callback) => execute(callback, {
            name: "TYPPRICE",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.ultosc = {
    requires: ['optInTimePeriod1', 'optInTimePeriod2', 'optInTimePeriod3'],
    create: (params) => {
        verifyParams('ultosc', params);

        return (data, callback) => execute(callback, {
            name: "ULTOSC",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod1: params.optInTimePeriod1,
            optInTimePeriod2: params.optInTimePeriod2,
            optInTimePeriod3: params.optInTimePeriod3
        });
    }
}

methods.variance = {
    requires: ['optInTimePeriod', 'optInNbDev'],
    create: (params) => {
        verifyParams('variance', params);

        return (data, callback) => execute(callback, {
            name: "VAR",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod,
            optInNbDev: params.optInTimePeriod
        });
    }
}

methods.wclprice = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('wclprice', params);

        return (data, callback) => execute(callback, {
            name: "WCLPRICE",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.willr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('willr', params);

        return (data, callback) => execute(callback, {
            name: "WILLR",
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

methods.wma = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('wma', params);

        return (data, callback) => execute(callback, {
            name: "WMA",
            inReal: data.close,
            startIdx: 0,
            endIdx: data.close.length - 1,
            optInTimePeriod: params.optInTimePeriod
        });
    }
}

module.exports = methods;

