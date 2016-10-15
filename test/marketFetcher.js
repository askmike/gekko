var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var assert = chai.assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire');

var _ = require('lodash');
var moment = require('moment');

var util = require(__dirname + '/../core/util');
var config = util.getConfig();
var dirs = util.dirs();

var providerName = config.watch.exchange.toLowerCase();
var providerPath = util.dirs().gekko + 'exchanges/' + providerName;

var mf;

var spoofer = {};

var TRADES = [
  { tid: 1, amount: 1, price: 100, date: 1475837937 },
  { tid: 2, amount: 1, price: 100, date: 1475837938 }
];

// stub the exchange
var FakeProvider = function() {};
var getTrades = function(since, handler, descending) {
  handler(
    null,
    TRADES
  );
}
FakeProvider.prototype = {
  getTrades: getTrades
}

spoofer[providerPath] = FakeProvider;
var getTradesSpy = sinon.spy(FakeProvider.prototype, 'getTrades');

// stub the tradebatcher
var TradeBatcher = require(util.dirs().budfox + 'tradeBatcher');
var tradeBatcherSpy = sinon.spy(TradeBatcher.prototype, 'write');
spoofer[util.dirs().budfox + 'tradeBatcher'] = TradeBatcher;

var MarketFetcher = proxyquire(dirs.budfox + 'marketFetcher', spoofer);

describe('budfox/marketFetcher', function() {
  it('should throw when not passed a config', function() {
    expect(function() {
      new MarketFetcher();
    }).to.throw('TradeFetcher expects a config');
  });

  it('should instantiate', function() {
    mf = new MarketFetcher(config);
  });

  it('should fetch with correct arguments', function() {

    // mf.fetch should call the DataProvider like:
    // provider.getTrades(since, callback, descending)

    mf.fetch();
    expect(getTradesSpy.callCount).to.equal(1);
    
    var args = getTradesSpy.firstCall.args;
    
    // test-config uses NO `tradingAdvisor`
    var since = args[0];
    expect(since).to.equal(undefined);

    var handler = args[1];
    assert.isFunction(handler);

    var descending = args[2];
    expect(descending).to.equal(false);
  });

  xit('should retry on error', function() {
    // todo
  });

  it('should pass the data to the tradebatcher', function() {
    mf.fetch();
    expect(getTradesSpy.callCount).to.equal(2);

    expect(tradeBatcherSpy.lastCall.args[0]).to.deep.equal(TRADES);
  });

  xit('should relay trades', function() {
    // todo
  });

});