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

// patch getTrades..
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

    callback(result.reverse());
  }.bind(this);

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }
  
  console.log('FETCH FROM', range.from.utc().format('YYYY-MM-DD HH:mm:ss'));
  console.log('FETCH TO', range.to.utc().format('YYYY-MM-DD HH:mm:ss'));

  params.start = range.from.unix();
  params.end = range.to.unix();

  this.poloniex._public('returnTradeHistory', params, process);
}

util.makeEventEmitter(Fetcher);

var iterator = false;
var end = false;
var done = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
  fetcher.getTrades(iterator, handleFetch);
}

var handleFetch = trades => {
  // console.log('end', end.format('YYYY-MM-DD HH:mm:ss'));
  console.log('amount', _.size(trades))
  var first = moment.unix(_.first(trades).date); 
  console.log('first', first.utc().format('YYYY-MM-DD HH:mm:ss'))
  var last = moment.unix(_.last(trades).date);
  console.log('last', last.utc().format('YYYY-MM-DD HH:mm:ss'))

  iterator.from.add(8, 'hour').subtract(5, 'minutes');
  iterator.to.add(8, 'hour').subtract(5, 'minutes');

  if(last > end)
    this.emit('done');

  fetcher.emit('trades', trades);
}

module.exports = function (daterange) {
  iterator = {
    from: daterange.from.clone(),
    to: daterange.from.clone().add(8, 'hour')
  }
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}



