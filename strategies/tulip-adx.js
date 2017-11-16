// Let's create our own method
var method = {};
// Prepare everything our method needs
method.init = function() {
  this.name = 'tulip-adx'
  this.trend = 'none';
  this.requiredHistory = this.settings.historySize;
  this.addTulipIndicator('myadx', 'adx', this.settings);
}
// What happens on every new candle?
method.update = function(candle) {
  // nothing!
}
method.log = function() {
  // nothing!
}
method.check = function(candle) {
  var price = candle.close;
  var adx = this.tulipIndicators.myadx.result.result;
  // console.dir(adx)

  if(this.settings.thresholds.down > adx && this.trend !== 'short') {
    this.trend = 'short';
    this.advice('short');
  } else if(this.settings.thresholds.up < adx && this.trend !== 'long'){
    this.trend = 'long';
    this.advice('long');
  }
}

module.exports = method;
