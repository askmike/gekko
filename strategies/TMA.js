var method = {};

method.init = function() {
  this.name = 'Triple Moving Average';
  this.requiredHistory = this.settings.long;

  this.addIndicator('short', 'SMA', this.settings.short)
  this.addIndicator('medium', 'SMA', this.settings.medium)
  this.addIndicator('long', 'SMA', this.settings.long)
}

method.update = function(candle) {
  this.indicators.short.update(candle.close)
  this.indicators.medium.update(candle.close)
  this.indicators.long.update(candle.close)
}

method.check = function() {
  const short = this.indicators.short.result;
  const medium = this.indicators.medium.result;
  const long = this.indicators.long.result;

  if((short > medium) && (medium > long)) {
    this.advice('long')
  } else if((short < medium) && (medium > long)) {
    this.advice('short')
  } else if(((short > medium) && (medium < long))) {
    this.advice('short')
  } else {
    this.advice();
  }
}

module.exports = method;
