const _ = require('lodash');
const fs = require('fs');
const util = require('../../core/util');
const config = util.getConfig();
const dirs = util.dirs();
const log = require(dirs.core + 'log');

const ENV = util.gekkoEnv();
const mode = util.gekkoMode();
const startTime = util.getStartTime();

const indicatorsPath = dirs.methods + 'indicators/';
const indicatorFiles = fs.readdirSync(indicatorsPath);
const Indicators = {};

const AsyncIndicatorRunner = require('./asyncIndicatorRunner');

_.each(indicatorFiles, function(indicator) {
  const indicatorName = indicator.split(".")[0];
  if (indicatorName[0] != "_")
    try {
      Indicators[indicatorName] = require(indicatorsPath + indicator);
    } catch (e) {
      log.error("Failed to load indicator", indicatorName);
    }
});

const allowedIndicators = _.keys(Indicators);

var Base = function(settings) {
  _.bindAll(this);

  // properties
  this.age = 0;
  this.processedTicks = 0;
  this.setup = false;
  this.settings = settings;
  this.tradingAdvisor = config.tradingAdvisor;
  // defaults
  this.requiredHistory = 0;
  this.priceValue = 'close';
  this.indicators = {};
  this.asyncTick = false;
  this.deferredTicks = [];

  this.propogatedAdvices = 0;

  this.completedWarmup = false;

  this.asyncIndicatorRunner = new AsyncIndicatorRunner();

  this._prevAdvice;

  // make sure we have all methods
  _.each(['init', 'check'], function(fn) {
    if(!this[fn])
      util.die('No ' + fn + ' function in this trading method found.')
  }, this);

  if(!this.update)
    this.update = function() {};

  if(!this.end)
    this.end = function() {};

  if(!this.onTrade)
    this.onTrade = function() {};

  // let's run the implemented starting point
  this.init();

  if(!config.debug || !this.log)
    this.log = function() {};

  this.setup = true;

  if(_.size(this.asyncIndicatorRunner.talibIndicators) || _.size(this.asyncIndicatorRunner.tulipIndicators))
    this.asyncTick = true;
  else
    delete this.asyncIndicatorRunner;
}

// teach our base trading method events
util.makeEventEmitter(Base);

Base.prototype.tick = function(candle, done) {
  this.age++;

  const afterAsync = () => {
    this.calculateSyncIndicators(candle, done);
  }

  if(this.asyncTick) {
    this.asyncIndicatorRunner.processCandle(candle, () => {

      if(!this.talibIndicators) {
        this.talibIndicators = this.asyncIndicatorRunner.talibIndicators;
        this.tulipIndicators = this.asyncIndicatorRunner.tulipIndicators;
      }

      afterAsync();
    });
  } else {
    afterAsync();
  }
}

Base.prototype.isBusy = function() {
  if(!this.asyncTick)
    return false;

  return this.asyncIndicatorRunner.inflight;
}

Base.prototype.calculateSyncIndicators = function(candle, done) {
  // update all indicators
  var price = candle[this.priceValue];
  _.each(this.indicators, function(i) {
    if(i.input === 'price')
      i.update(price);
    if(i.input === 'candle')
      i.update(candle);
  },this);

  this.propogateTick(candle);

  return done();
}

Base.prototype.propogateTick = function(candle) {
  this.candle = candle;
  this.update(candle);

  this.processedTicks++;
  var isAllowedToCheck = this.requiredHistory <= this.age;

  if(!this.completedWarmup) {

    // in live mode we might receive more candles
    // than minimally needed. In that case check
    // whether candle start time is > startTime
    var isPremature = false;

    if(mode === 'realtime'){
      const startTimeMinusCandleSize = startTime
        .clone()
        .subtract(this.tradingAdvisor.candleSize, "minutes");

      isPremature = candle.start < startTimeMinusCandleSize;
    }

    if(isAllowedToCheck && !isPremature) {
      this.completedWarmup = true;
      this.emit(
        'stratWarmupCompleted',
        {start: candle.start.clone()}
      );
    }
  }

  if(this.completedWarmup) {
    this.log(candle);
    this.check(candle);

    if(
      this.asyncTick &&
      this.hasSyncIndicators &&
      this.deferredTicks.length
    ) {
      return this.tick(this.deferredTicks.shift())
    }
  }

  const indicators = {};
  _.each(this.indicators, (indicator, name) => {
    indicators[name] = indicator.result;
  });

  this.emit('stratUpdate', {
    date: candle.start.clone(),
    indicators
  });

  // are we totally finished?
  const completed = this.age === this.processedTicks;
  if(completed && this.finishCb)
    this.finishCb();
}

Base.prototype.processTrade = function(trade) {
  this.onTrade(trade);
}

Base.prototype.addTalibIndicator = function(name, type, parameters) {
  this.asyncIndicatorRunner.addTalibIndicator(name, type, parameters);
}

Base.prototype.addTulipIndicator = function(name, type, parameters) {
  this.asyncIndicatorRunner.addTulipIndicator(name, type, parameters);
}

Base.prototype.addIndicator = function(name, type, parameters) {
  if(!_.contains(allowedIndicators, type))
    util.die('I do not know the indicator ' + type);

  if(this.setup)
    util.die('Can only add indicators in the init method!');

  return this.indicators[name] = new Indicators[type](parameters);

  // some indicators need a price stream, others need full candles
}

Base.prototype.advice = function(newPosition) {
  // ignore legacy soft advice
  if(!newPosition)
    return;

  // ignore if advice equals previous advice
  if(newPosition === this._prevAdvice)
    return;

  this._prevAdvice = newPosition;

  this.emit('advice', {
    id: 'advice-' + (++this.propogatedAdvices),
    recommendation: newPosition
  });
}

Base.prototype.notify = function(content) {
  this.emit('stratNotification', {
    content,
    date: new Date(),
  })
}

Base.prototype.finish = function(done) {
  // Because the trading method might be async we need
  // to be sure we only stop after all candles are
  // processed.
  if(!this.asyncTick) {
    this.end();
    return done();
  }

  if(this.age === this.processedTicks) {
    this.end();
    return done();
  }

  // we are not done, register cb
  // and call after we are..
  this.finishCb = done;
}

module.exports = Base;
