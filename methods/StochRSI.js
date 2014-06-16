/*
  
  StochRSI - SamThomp 11/06/2014

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.StochRSI;

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

var highestRSI = 0;
var lowestRSI = 0;
var RSIhistory;

// prepare everything our method needs
method.init = function() {
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', settings.interval);
	
	this.RSIhistory = [];
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function() {
  var digits = 8;
  var rsi = this.indicators.rsi;
	
	this.RSIhistory.shift();
	this.RSIhistory.push(rsiVal);
	this.lowestRSI = _.min(RSIhistory);
	this.highestRSI = _.max(RSIhistory);
		
	this.rsiVal = ((rsiVal - lowestRSI) / (highestRSI - lowestRSI)) * 100;

  log.debug('calculated StochRSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.rsi.toFixed(digits));
	log.debug("StochRSI min:\t\t" + this.lowestRSI);
	log.debug("StochRSI max:\t\t" + this.highestRSI);
	log.debug("StochRSI history length: " + this.RSIhistory.length);
	log.info("StochRSI Value:\t\t" + this.rsiVal.toFixed(2));
}

// what happens on every new candle?
method.update = function(candle) {
	var rsi = this.indicators.rsi;
  var rsiVal = rsi.rsi;
	
	// push RSI value for each candle onto the array
	this.RSIhistory.push(rsiVal);
}

method.check = function() {
  
	// remove oldest RSI value
	this.RSIhistory.shift();
	
	var rsi = this.indicators.rsi;
	var rsiVal = rsi.rsi;
	
	this.RSIhistory.push(rsiVal);
	this.lowestRSI = _.min(this.RSIhistory);
	this.highestRSI = _.max(this.RSIhistory);
	this.rsiVal = rsiVal;
	
	log.info("RSI Value:\t\t" + this.rsiVal.toFixed(2));
	this.rsiVal = ((1 + this.rsiVal - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;
	
	log.info("StochRSI min:\t\t" + this.lowestRSI.toFixed(2));
	log.info("StochRSI max:\t\t" + this.highestRSI.toFixed(2));
	log.info("StochRSI history:\t " + this.RSIhistory.length);
	
	log.info("StochRSI Value:\t\t" + this.rsiVal.toFixed(2));
	
	this.RSIhistory.shift();	
	
	if(this.rsiVal > settings.thresholds.high) {

		// new trend detected
		if(this.trend.direction !== 'high')
			this.trend = {
				duration: 0,
				persisted: false,
				direction: 'high',
				adviced: false
			};

		this.trend.duration++;

		log.debug('In high since', this.trend.duration, 'candle(s)');

		if(this.trend.duration >= settings.thresholds.persistence)
			this.trend.persisted = true;

		if(this.trend.persisted && !this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('short');
		} else
			this.advice();
		
	} else if(this.rsiVal < settings.thresholds.low) {

		// new trend detected
		if(this.trend.direction !== 'low')
			this.trend = {
				duration: 0,
				persisted: false,
				direction: 'low',
				adviced: false
			};

		this.trend.duration++;

		log.debug('In low since', this.trend.duration, 'candle(s)');

		if(this.trend.duration >= settings.thresholds.persistence)
			this.trend.persisted = true;

		if(this.trend.persisted && !this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('long');
		} else
			this.advice();

	} else {
		// trends must be on consecutive candles
		this.trend.duration = 0;
		log.debug('In no trend');

		this.advice();
	}

}

module.exports = method;
