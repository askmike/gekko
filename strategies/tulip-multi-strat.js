var _ = require('lodash');
var log = require('../core/log.js');

var method = {};
method.init = function() {
    // strat name
    this.name = 'tulip-multi-strat';
    // trend information
    this.trend = 'none'
    // tulip indicators use this sometimes
    this.requiredHistory = this.settings.historySize;
    // define the indicators we need
    this.addTulipIndicator('myadx', 'adx', this.settings);
    this.addTulipIndicator('mymacd', 'macd', this.settings);
}

// what happens on every new candle?
method.update = function(candle) {
    // tulip results
    this.adx = this.tulipIndicators.myadx.result.result;
    this.macd = this.tulipIndicators.mymacd.result.macdHistogram;
}
// for debugging purposes log the last
// calculated parameters.
method.log = function() {
    log.debug(
`---------------------
Tulip ADX: ${this.adx}
Tulip MACD: ${this.macd}
`);
}

method.check = function() {
    // just add a long and short to each array when new indicators are used
    const all_long = [
        this.adx > this.settings.up && this.trend!=='long',
        this.settings.macd_up < this.macd && this.trend!=='long',
    ].reduce((total, long)=>long && total, true)
    const all_short = [
        this.adx < this.settings.down && this.trend!=='short',
        this.settings.macd_down > this.macd && this.trend!=='short',
    ].reduce((total, long)=>long && total, true)

    // combining all indicators with AND
    if(all_long){
        log.debug(`tulip-multi-strat In low`);
        this.advice('long');
    }else if(all_short){
        log.debug(`tulip-multi-strat In high`);
        this.advice('short');
    }else{
        log.debug(`tulip-multi-strat In no trend`);
        this.advice();
    }
}

module.exports = method;
