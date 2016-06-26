var BTCChina = require('btc-china-fork');
var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'btcc');

// patch getTrades..
Fetcher.prototype.getTrades = function(fromTid, sinceTime, callback) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    callback(result);
  }.bind(this);

  if(sinceTime)
    var params = {
      limit: 1,
      sincetype: 'time',
      since: sinceTime
    }

  else if(fromTid)
    var params = {
      limit: 5000,
      since: fromTid
    }

  this.btcc.getHistoryData(process, params);
}

util.makeEventEmitter(Fetcher);

var iterator = false;
var end = false;
var done = false;
var from = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
  if(!iterator)
    fetcher.getTrades(false, from, handleFirstFetch);
  else
    fetcher.getTrades(iterator, false, handleFetch);
}

// we use the first fetch to figure out 
// the tid of the moment we want data from
var handleFirstFetch = trades => {
  iterator = _.first(trades).tid;
  fetch();
}

var handleFetch = trades => {

  iterator = _.last(trades).tid;
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
  from = daterange.from.unix();
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}

