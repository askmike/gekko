var Poloniex = require("poloniex.js");
var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'poloniex');

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '_' + currencyB;
}

var iterator = false;
var end = false;

// todo, improve getTrades api
Fetcher.prototype.getTrades = function(range, callback) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err || result.error)
      return this.retry(this.getTrades, args);

    if(_.size(result) > 50000) {
      // to many trades..
      return this.getTrades()
    }

    result = _.map(result, function(trade) {
      return {
        tid: trade.tradeID,
        amount: +trade.amount,
        date: moment.utc(trade.date).format('X'),
        price: +trade.rate
      };
    });

    callback(null, result.reverse());
  };

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }
  
  params.start = range.from.unix();
  params.end = range.to.unix();

  this.poloniex._public('returnTradeHistory', params, _.bind(process, this));
}

module.exports = function init(daterange) {
  iterator = {
    from: daterange.from.clone(),
    to: daterange.from.clone().add(1, 'hour')
  }
  end = daterange.to.clone();

  var fetcher = new Fetcher(config.watch);

  return next => fetcher.getTrades(iterator, (err, trades) => {
    iterator.from.add(10, 'hour');
    iterator.to.add(10, 'hour');

    next(trades);
  });
}



