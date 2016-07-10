var Poloniex = require("poloniex.js");
var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'poloniex');

var batchSize = 60 * 2; // 2 hour
var overlapSize = 10; // 10 minutes

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

    if(_.size(result) === 50000) {
      // to many trades..
      util.die('too many trades..');
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
  log.debug(
    'Requesting data from',
    iterator.from.format('YYYY-MM-DD HH:mm:ss') + ',',
    'to',
    iterator.to.format('YYYY-MM-DD HH:mm:ss')
  );
  fetcher.getTrades(iterator, handleFetch);
}

var handleFetch = trades => {

  iterator.from.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');
  iterator.to.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');

  if(!_.size(trades))
    return fetcher.emit('trades', []);

  var last = moment.unix(_.last(trades).date);

  if(last > end) {
    fetcher.emit('done');

    var endUnix = end.unix();
    trades = _.filter(
      trades,
      t => t.date <= endUnix
    );
  }

  fetcher.emit('trades', trades);
}

module.exports = function (daterange) {
  iterator = {
    from: daterange.from.clone(),
    to: daterange.from.clone().add(batchSize, 'minutes')
  }
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}



