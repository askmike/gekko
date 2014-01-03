var _ = require('lodash');
var moment = require('moment');

var util = require('../core/util');

var Fetcher = require('../core/tradeFetcher');

var TRADES = [
  { tid: 4, amount: 1.4, price: 99, date: 1381356250 },
  { tid: 5, amount: 1.5, price: 98, date: 1381356310 },
  { tid: 6, amount: 1.6, price: 97, date: 1381356370 },
  { tid: 7, amount: 1.7, price: 96, date: 1381356430 },
  { tid: 8, amount: 1.8, price: 95, date: 1381356490 },
  { tid: 9, amount: 1.9, price: 94, date: 1381356550 },
  { tid: 10, amount: 2, price: 93, date: 1381356610 },
  { tid: 11, amount: 2.1, price: 92, date: 1381356670 },
  { tid: 12, amount: 2.2, price: 91, date: 1381356730 },
  { tid: 13, amount: 2.3, price: 90, date: 1381356790 }
];

var FakeFetcher = function(cb) {
  this.exchange = {
    providesHistory: true
  }
}
FakeFetcher.prototype = {
  calculateNextFetch: function() {}
}
// the methods we want to test
FakeFetcher.prototype.processTrades = Fetcher.prototype.processTrades;
FakeFetcher.prototype.setFetchMeta = Fetcher.prototype.setFetchMeta;

module.exports = {
  processTrades: function(test) {
    var checker = function(what, data) {
      // should broadcast the `new trades`
      // event
      test.equal(what, 'new trades');

      // every trade should be in there in
      // the same order
      _.each(TRADES, function(t, i) {
        test.deepEqual(t, data.all[i]);
      });

      // meta should be correct
      test.deepEqual(_.first(TRADES), data.first);
      test.deepEqual(_.last(TRADES), data.last);

      test.ok(util.equals(moment.unix(1381356250), data.start));
      test.ok(util.equals(moment.unix(1381356790), data.end));

      test.equal(
        data.timespan,
        1381356790 * 1000 - 1381356250 * 1000
      );

      test.done();
    }

    var fetcher = new FakeFetcher;
    fetcher.emit = checker;
    fetcher.processTrades(false, TRADES);

  }
}