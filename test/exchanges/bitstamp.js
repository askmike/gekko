
// if you need to test Gekko against real mocked data
// uncomment the following:

// var fs = require('fs');
// var bitstamp = require('bitstamp');
// var bs = new bitstamp;
// bs.transactions('btcusd', (err, data) => {
//   if(err)
//     throw err;

//   var json = JSON.stringify(data, null, 4);
//   fs.writeFileSync('./data/bitstamp_trades.json', json);
// });
// return;

var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var sinon = require('sinon');
var proxyquire = require('proxyquire');

var _ = require('lodash');
var moment = require('moment');

var util = require(__dirname + '/../../core/util');
var config = util.getConfig();
var dirs = util.dirs();

var TRADES = require('./data/bitstamp_trades.json');

var FakeExchange = function() {};
FakeExchange.prototype = {
  transactions: function(since, handler, descending) {
    handler(
      null,
      TRADES
    );
  }
}
var transactionsSpy = sinon.spy(FakeExchange.prototype, 'transactions');
spoofer = {
  bitstamp: FakeExchange
}

describe('exchanges/bitstamp', function() {
  var Bitstamp = proxyquire(dirs.exchanges + 'bitstamp', spoofer);
  var bs;

  it('should instantiate', function() {
    bs = new Bitstamp(config.watch);
  });

  it('should correctly fetch historical trades', function() {
    bs.getTrades(null, _.noop, false);

    expect(transactionsSpy.callCount).to.equal(1);

    var args = transactionsSpy.lastCall.args;
    expect(args.length).to.equal(2);

    expect(args[0]).to.equal('btcusd');
  });

  it('should retry on exchange error', function() {
    var ErrorFakeExchange = function() {};
    ErrorFakeExchange.prototype = {
      transactions: function(since, handler, descending) {
        handler('Auth error');
      }
    }
    spoofer = {
      bitstamp: ErrorFakeExchange
    }

    var ErroringBitstamp = proxyquire(dirs.exchanges + 'bitstamp', spoofer);
    var ebs = new ErroringBitstamp(config.watch);

    ebs.retry = _.noop;
    var retrySpy = sinon.spy(ebs, 'retry');

    ebs.getTrades(null, _.noop)

    expect(retrySpy.callCount).to.equal(1);

    var args = retrySpy.lastCall.args;
    expect(args[1].length).to.equal(2);
    expect(args[1][0]).to.equal(null);
  })

  it('should correctly parse historical trades', function(done) {
    var check = function(err, trades) {

      expect(err).to.equal(null);

      expect(trades.length).to.equal(TRADES.length);

      var oldest = _.first(trades);
      var OLDEST = _.last(TRADES);

      expect(oldest.tid).to.equal(+OLDEST.tid);
      expect(oldest.price).to.equal(+OLDEST.price);
      expect(oldest.amount).to.equal(+OLDEST.amount);
      expect(oldest.date).to.equal(OLDEST.date);

      done();
    }

    bs.getTrades(null, check, false);

  });
});