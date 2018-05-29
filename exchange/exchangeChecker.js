const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
const errors = require('./exchangeErrors');

const Checker = function() {
  _.bindAll(this);
}

Checker.prototype.getExchangeCapabilities = function(slug) {
  if(!fs.existsSync(__dirname + '/wrappers/' + slug + '.js'))
    throw new errors.ExchangeError(`Gekko does not know the exchange "${slug}"`);

  return require('./wrappers/' + slug).getCapabilities();
}

// check if the exchange is configured correctly for monitoring
Checker.prototype.cantMonitor = function(conf) {
  var slug = conf.exchange.toLowerCase();
  var exchange = this.getExchangeCapabilities(slug);

  if(!exchange)
    return 'Gekko does not support the exchange ' + slug;

  var name = exchange.name;

  if('monitorError' in exchange)
    return 'At this moment Gekko can\'t monitor ' + name +  ', find out more info here:\n\n' + exchange.monitorError;

  var name = exchange.name;

  if(!_.includes(exchange.currencies, conf.currency))
    return 'Gekko only supports the currencies [ ' + exchange.currencies.join(', ') + ' ] at ' + name + ' (not ' + conf.currency + ')';

  if(!_.includes(exchange.assets, conf.asset))
    return 'Gekko only supports the assets [ ' + exchange.assets.join(', ') + ' ]  at ' + name + ' (not ' + conf.asset + ')';

  var pair = _.find(exchange.markets, function(p) {
    return p.pair[0] === conf.currency && p.pair[1] === conf.asset;
  });

  if(!pair)
    return 'Gekko does not support this currency/assets pair at ' + name;

  // everything is okay
  return false;
}

// check if the exchange is configured correctly for fetching
// full history
Checker.prototype.cantFetchFullHistory = function(conf) {
  var slug = conf.exchange.toLowerCase();
  var exchange = this.getExchangeCapabilities(slug);

  if(this.cantMonitor(conf))
    return this.cantMonitor(conf);

  var name = exchange.name;

  if(!exchange.providesFullHistory)
    return 'The exchange ' + name + ' does not provide full history (or Gekko doesn\'t support importing it)';

  if ("exchangeMaxHistoryAge" in exchange) {
    if (moment(config.importer.daterange.from) < moment().subtract(exchange.exchangeMaxHistoryAge, "days")) {
      return 'Unsupported date from! ' + exchange.name + ' supports history of max ' + exchange.exchangeMaxHistoryAge + ' days..';
    }
  }
}

// check if the exchange if configured correctly for real trading
Checker.prototype.cantTrade = function(conf) {
  var cantMonitor = this.cantMonitor(conf);
  if(cantMonitor)
    return cantMonitor;

  var slug = conf.exchange.toLowerCase();
  var exchange = this.getExchangeCapabilities(slug);
  var name = exchange.name;

  if(!exchange.tradable)
    return 'At this moment Gekko can\'t trade at ' + name + '.';

  if(conf.key === 'your-key')
    return '"your-key" is not a valid API key';

  if(conf.secret === 'your-secret')
    return '"your-secret" is not a valid API secret';

  var error = false;
  _.each(exchange.requires, function(req) {
    if(!conf[req])
      error = name + ' requires "' + req + '" to be set in the config';
  }, this);

  return error;
}

Checker.prototype.settings = function(conf) {
  var slug = conf.exchange.toLowerCase();
  return this.getExchangeCapabilities(slug);

}

module.exports = new Checker();
