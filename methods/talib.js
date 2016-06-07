// NOTE
// 
// from @link https://github.com/wupeng1211/gekko
// currently not working

var talib = require("talib");

var ifish = function (value) {
    tmpvalue = 0.1 * (value - 50)
    return result = (Math.exp(10*tmpvalue) - 1) / (Math.exp(10*tmpvalue) + 1)
};

var diff = function (x, y) {
    return result = (( x - y ) / (Math.abs( x + y ) / 2)) * 100
};

// create wrapper
var talibWrapper = function(params) {
    return function(callback) {
        return talib.execute(params,
        function(result) {
            //console.log(params.name);
            //console.log(result.result);
            callback(null, result.result);
        });
    };
};

this.accbands = function(high, low, close, period) {
    return talibWrapper({
        name: "ACCBANDS",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.ad = function(high, low, close, volume, period) {
    return talibWrapper({
        name: "AD",
        high: high,
        low: low,
        close: close,
        volume: volume,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.adosc = function(high, low, close, volume, FastPeriod, SlowPeriod) {
    return talibWrapper({
        name: "ADOSC",
        high: high,
        low: low,
        close: close,
        volume: volume,
        startIdx: 0,
        endIdx: high.length - 1,
        optInFastPeriod: FastPeriod,
        optInSlowPeriod: SlowPeriod
    });
};

this.adx = function(high, low, close, period) {
    return talibWrapper({
        name: "ADX",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.adxr = function(high, low, close, period) {
    return talibWrapper({
        name: "ADXR",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.apo = function(data, FastPeriod, SlowPeriod, MAType) {
    return talibWrapper({
        name: "APO",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInFastPeriod: FastPeriod,
        optInSlowPeriod: SlowPeriod,
        optInMAType: MAType
    });
};

this.aroon = function(high, low, period) {
    return talibWrapper({
        name: "AROON",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.aroonosc = function(high, low, period) {
    return talibWrapper({
        name: "AROONOSC",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.atr = function(high, low, close, period) {
    return talibWrapper({
        name: "ATR",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.avgprice = function(open, high, low, close, period) {
    return talibWrapper({
        name: "AVGPRICE",
        open: open,
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: open.length - 1,
        optInTimePeriod: period
    });
};

this.bbands = function(data, period, NbDevUp, NbDevDn, MAType) {
    return talibWrapper({
        name: "BBANDS",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInNbDevUp: NbDevUp,
        optInNbDevDn: NbDevDn,
        optInMAType: MAType
    });
};

this.beta = function(data_0, data_1, period) {
    return talibWrapper({
        name: "BETA",
        inReal0: data_0,
        inReal1: data_1,
        startIdx: 0,
        endIdx: data_0.length - 1,
        optInTimePeriod: period
    });
};

this.bop = function(open, high, low, close) {
    return talibWrapper({
        name: "BOP",
        open: open,
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1
    });
};

this.cci = function(high, low, close, period) {
    return talibWrapper({
        name: "CCI",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.cmo = function(data, period) {
    return talibWrapper({
        name: "CMO",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.correl = function(data_0, data_1, period) {
    return talibWrapper({
        name: "CORREL",
        inReal0: data_0,
        inReal1: data_1,
        startIdx: 0,
        endIdx: data_0.length - 1,
        optInTimePeriod: period
    });
};

this.dema = function(data, period) {
    return talibWrapper({
        name: "DEMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.dx = function(high, low, close, period) {
    return talibWrapper({
        name: "DX",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.ema = function(data, period) {
    return talibWrapper({
        name: "EMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.ht_dcperiod = function(data) {
    return talibWrapper({
        name: "HT_DCPERIOD",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.ht_dcphase = function(data) {
    return talibWrapper({
        name: "HT_DCPHASE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.ht_phasor = function(data) {
    return talibWrapper({
        name: "HT_PHASOR",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.ht_sine = function(data) {
    return talibWrapper({
        name: "HT_SINE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.ht_trendline = function(data) {
    return talibWrapper({
        name: "HT_TRENDLINE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.ht_trendmode = function(data) {
    return talibWrapper({
        name: "HT_TRENDMODE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.imi = function(high, close, period) {
    return talibWrapper({
        name: "IMI",
        open: open,
        close: close,
        startIdx: 0,
        endIdx: open.length - 1,
        optInTimePeriod: period
    });
};

this.kama = function(data, period) {
    return talibWrapper({
        name: "KAMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.linearreg = function(data, period) {
    return talibWrapper({
        name: "LINEARREG",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.linearreg_angle = function(data, period) {
    return talibWrapper({
        name: "LINEARREG_ANGLE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.linearreg_intercept = function(data, period) {
    return talibWrapper({
        name: "LINEARREG_INTERCEPT",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.linearreg_slope = function(data, period) {
    return talibWrapper({
        name: "LINEARREG_SLOPE",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.ma = function(data, period, MAType) {
    return talibWrapper({
        name: "MA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInMAType: MAType
    });
};

this.macd = function(data, FastPeriod, SlowPeriod, SignalPeriod) {
    return talibWrapper({
        name: "MACD",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInFastPeriod: FastPeriod,
        optInSlowPeriod: SlowPeriod,
        optInSignalPeriod: SignalPeriod
    });
};

this.macdext = function(data, FastPeriod, FastMAType, SlowPeriod, SlowMAType, SignalPeriod, SignalMAType) {
    return talibWrapper({
        name: "MACDEXT",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInFastPeriod: FastPeriod,
        optInFastMAType: FastMAType,
        optInSlowPeriod: SlowPeriod,
        optInSlowMAType: SlowMAType,
        optInSignalPeriod: SignalPeriod,
        optInSignalMAType: SignalMAType
    });
};

this.macdfix = function(data, SignalPeriod) {
    return talibWrapper({
        name: "MACDFIX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInSignalPeriod: SignalPeriod
    });
};

this.mama = function(data, FastLimitPeriod, SlowLimitPeriod) {
    return talibWrapper({
        name: "MAMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInFastLimit: FastLimitPeriod,
        optInSlowLimit: SlowLimitPeriod
    });
};

this.mavp = function(data, periods, MinPeriod, MaxPeriod, MAType) {
    return talibWrapper({
        name: "MAVP",
        inReal: data,
        inPeriods: periods,
        startIdx: 0,
        endIdx: data.length - 1,
        optInMinPeriod: MinPeriod,
        optInMaxPeriod: MaxPeriod,
        optInMAType: MAType
    });
};

this.max = function(data, period) {
    return talibWrapper({
        name: "MAX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.maxindex = function(data, period) {
    return talibWrapper({
        name: "MAXINDEX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.medprice = function(high, low, period) {
    return talibWrapper({
        name: "MEDPRICE",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.mfi = function(high, low, close, volume, period) {
    return talibWrapper({
        name: "MFI",
        high: high,
        low: low,
        close: close,
        volume: volume,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.midpoint = function(data, period) {
    return talibWrapper({
        name: "MIDPOINT",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.midprice = function(high, low, period) {
    return talibWrapper({
        name: "MIDPRICE",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.min = function(data, period) {
    return talibWrapper({
        name: "MIN",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.minindex = function(data, period) {
    return talibWrapper({
        name: "MININDEX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.minmax = function(data, period) {
    return talibWrapper({
        name: "MINMAX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.minmaxindex = function(data, period) {
    return talibWrapper({
        name: "MINMAXINDEX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.minus_di = function(high, low, close, period) {
    return talibWrapper({
        name: "MINUS_DI",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.minus_dm = function(high, low, period) {
    return talibWrapper({
        name: "MINUS_DM",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.mom = function(data, period) {
    return talibWrapper({
        name: "MOM",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.natr = function(high, low, close, period) {
    return talibWrapper({
        name: "NATR",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.obv = function obv(data, volume) {
    return talibWrapper({
        name: "OBV",
        inReal: data,
        volume: volume,
        startIdx: 0,
        endIdx: data.length - 1
    });
};

this.plus_di = function(high, low, close, period) {
    return talibWrapper({
        name: "PLUS_DI",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.plus_dm = function(high, low, period) {
    return talibWrapper({
        name: "PLUS_DM",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.ppo = function(data, FastPeriod, SlowPeriod, MAType) {
    return talibWrapper({
        name: "PPO",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInFastPeriod: FastPeriod,
        optInSlowPeriod: SlowPeriod,
        optInMAType: MAType
    });
};

this.roc = function(data, period) {
    return talibWrapper({
        name: "ROC",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.rocp = function(data, period) {
    return talibWrapper({
        name: "ROCP",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.rocr = function(data, period) {
    return talibWrapper({
        name: "ROCR",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.rocr100 = function(data, period) {
    return talibWrapper({
        name: "ROCR100",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.rsi = function(data, period) {
    return talibWrapper({
        name: "RSI",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.sar = function(high, low, accel, accelmax) {
    return talibWrapper({
        name: "SAR",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInAcceleration: accel,
        optInMaximum: accelmax
    });
};

this.sarext = function(high, low, StartValue, OffsetOnReverse, AccelerationInitLong, AccelerationLong, AccelerationMaxLong, AccelerationInitShort, AccelerationShort, AccelerationMaxShort) {
    return talibWrapper({
        name: "SAREXT",
        high: high,
        low: low,
        startIdx: 0,
        endIdx: high.length - 1,
        optInStartValue: StartValue,
        optInOffsetOnReverse: OffsetOnReverse,
        optInAccelerationInitLong: AccelerationInitLong,
        optInAccelerationLong: AccelerationLong,
        optInAccelerationMaxLong: AccelerationMaxLong,
        optInAccelerationInitShort: AccelerationInitShort,
        optInAccelerationShort: AccelerationShort,
        optInAccelerationMaxShort: AccelerationMaxShort
    });
};

this.sma = function(data, period) {
    return talibWrapper({
        name: "SMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.stddev = function(data, period, NbDev) {
    return talibWrapper({
        name: "STDDEV",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInNbDev: NbDev
    });
};

this.stoch = function(high, low, close, fastK_period, slowK_period, slowK_MAType, slowD_period, slowD_MAType) {
    return talibWrapper({
        name: "STOCH",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: close.length - 1,
        optInFastK_Period: fastK_period,
        optInSlowK_Period: slowK_period,
        optInSlowK_MAType: slowK_MAType,
        optInSlowD_Period: slowD_period,
        optInSlowD_MAType: slowD_MAType
    });
};

this.stochf = function(high, low, close, fastK_period, fastD_period, fastD_MAType) {
    return talibWrapper({
        name: "STOCHF",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInFastK_Period: fastK_period,
        optInFastD_Period: fastD_period,
        optInFastD_MAType: fastD_MAType
    });
};

this.stochrsi = function(data, period, fastK_period, fastD_period, fastD_MAType) {
    return talibWrapper({
        name: "STOCHRSI",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInFastK_Period: fastK_period,
        optInFastD_Period: fastD_period,
        optInFastD_MAType: fastD_MAType
    });
};

this.sum = function(data, period) {
    return talibWrapper({
        name: "SUM",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.t3 = function(data, period, vfactor) {
    return talibWrapper({
        name: "T3",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInVFactor: vfactor
    });
};

this.tema = function(data, period) {
    return talibWrapper({
        name: "TEMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.trange = function(high, low, close, period) {
    return talibWrapper({
        name: "TRANGE",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.trima = function(data, period) {
    return talibWrapper({
        name: "TRIMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.trix = function(data, period) {
    return talibWrapper({
        name: "TRIX",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.tsf = function(data, period) {
    return talibWrapper({
        name: "TSF",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

this.typprice = function(high, low, close, period) {
    return talibWrapper({
        name: "TYPPRICE",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.ultosc = function(high, low, close, Period1, Period2, Period3) {
    return talibWrapper({
        name: "ULTOSC",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod1: Period1,
        optInTimePeriod2: Period2,
        optInTimePeriod3: Period3
    });
};

this.variance = function(data, period, NbVar) {
    return talibWrapper({
        name: "VAR",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period,
        optInNbDev: NbVar
    });
};

this.wclprice = function(high, low, close, period) {
    return talibWrapper({
        name: "WCLPRICE",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.willr = function(high, low, close, period) {
    return talibWrapper({
        name: "WILLR",
        high: high,
        low: low,
        close: close,
        startIdx: 0,
        endIdx: high.length - 1,
        optInTimePeriod: period
    });
};

this.wma = function(data, period) {
    return talibWrapper({
        name: "WMA",
        inReal: data,
        startIdx: 0,
        endIdx: data.length - 1,
        optInTimePeriod: period
    });
};

module.exports = exports;
