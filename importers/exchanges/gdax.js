var Gdax = require('gdax');
var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'gdax');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var prevLastId = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
    fetcher.import = true;
    fetcher.getTrades(from, handleFetch);
}

var handleFetch = (unk, trades) => {
    var last = moment.unix(_.last(trades).date);
    var lastId = _.last(trades).tid

    if(last < from) {
        log.debug('Skipping data, they are before from date', last.format());
        return fetch();
    }

    if  (last > end || lastId === prevLastId) {
        fetcher.emit('done');

        var endUnix = end.unix();
        trades = _.filter(
            trades,
            t => t.date <= endUnix
        )
    }

    prevLastId = lastId
    fetcher.emit('trades', trades);
}

module.exports = function (daterange) {

    from = daterange.from.clone();
    end = daterange.to.clone();

    return {
        bus: fetcher,
        fetch: fetch
    }
}
