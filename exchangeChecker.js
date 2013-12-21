var exchanges = require('./exchanges.js');
var _ = require('lodash');

var Checker = function() {
  _.bindAll();
}

Checker.prototype.notValid = function(conf) {
  if(conf.tradingEnabled)
    return this.cantTrade(conf);
  else
    return this.cantMonitor(conf);
}

// check if the exchange is configured correctly for monitoring
Checker.prototype.cantMonitor = function(conf) {
  var slug = conf.exchange.toLowerCase();
  var exchange = _.find(exchanges, function(e) { return e.slug === slug });

  if(!exchange)
    return 'Gekko does not support the exchange ' + slug;

  var name = exchange.name;

  if('monitorError' in exchange)
    return 'At this moment Gekko can\'t monitor ' + name +  ', find out more info here:\n\n' + exchange.monitorError;

  var name = exchange.name;

  if(!_.contains(exchange.currencies, conf.currency))
    return 'Gekko only supports the currencies [ ' + exchange.currencies.join(', ') + ' ] at ' + name;

  if(!_.contains(exchange.assets, conf.asset))
    return 'Gekko only supports the assets [ ' + exchange.assets.join(', ') + ' ]  at ' + name;

  // everyting okay
  return false;
}

// check if the exchange if configured correctly for real trading
Checker.prototype.cantTrade = function(conf) {
  var cantMonitor = this.cantMonitor(conf);
  if(cantMonitor)
    return cantMonitor;

  var slug = conf.exchange.toLowerCase();
  var exchange = _.find(exchanges, function(e) { return e.slug === slug });
  var name = exchange.name;

  if('tradeError' in exchange)
    return 'At this moment Gekko can\'t trade at ' + name + ', find out more info here:\n\n' + exchange.tradeError;

  if(conf.key === 'your-key')
    throw '"your-key" is not a valid API key';

  if(conf.secret === 'your-secret')
    throw '"your-secret" is not a valid API secret';    

  var error = false;
  _.each(exchange.requires, function(req) {
    if(!conf[req])
      error = name + ' requires "' + req + '" to be set in the config';
  }, this);  

  return error;
}

module.exports = new Checker();