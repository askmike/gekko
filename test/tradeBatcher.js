var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var sinon = require('sinon');

var _ = require('lodash');
var moment = require('moment');

var utils = require(__dirname + '/../core/util');
var dirs = utils.dirs();
var TradeBatcher = require(dirs.budfox + 'tradeBatcher');

var trades_tid_1 = [
  {tid: 1, price: 10, amount: 1, date: 1466115793},
  {tid: 2, price: 10, amount: 1, date: 1466115794},
  {tid: 3, price: 10, amount: 1, date: 1466115795}
];

var trades_tid_2 = [
  {tid: 2, price: 10, amount: 1, date: 1466115794},
  {tid: 3, price: 10, amount: 1, date: 1466115795},
  {tid: 4, price: 10, amount: 1, date: 1466115796},
  {tid: 5, price: 10, amount: 1, date: 1466115797}
];

var empty_trades = [
  {tid: 2, price: 10, amount: 0, date: 1466115794},
  {tid: 3, price: 10, amount: 0, date: 1466115795},
  {tid: 4, price: 10, amount: 0, date: 1466115796},
  {tid: 5, price: 10, amount: 0, date: 1466115797}
];

describe('budfox/tradeBatcher', function() {
  var tb;

  it('should throw when not passed a number', function() {
    expect(function() {
      new TradeBatcher()
    }).to.throw('tid is not a string');
  });

  it('should instantiate', function() {
    tb = new TradeBatcher('tid');
  });

  it('should throw when not fed an array', function() {
    var trade = _.first(trades_tid_1);
    expect(
      tb.write.bind(tb, trade)
    ).to.throw('batch is not an array');
  });

  it('should emit an event when fed trades', function() {
    tb = new TradeBatcher('tid');

    var spy = sinon.spy();
    tb.on('new batch', spy);
    tb.write( trades_tid_1 );
    expect(spy.callCount).to.equal(1);
  });

  it('should only emit once when fed the same trades twice', function() {
    tb = new TradeBatcher('tid');

    var spy = sinon.spy();
    tb.on('new batch', spy);
    tb.write( trades_tid_1 );
    tb.write( trades_tid_1 );
    expect(spy.callCount).to.equal(1);
  });

  it('should correctly set meta data', function() {
    tb = new TradeBatcher('tid');

    var spy = sinon.spy();
    tb.on('new batch', spy);

    tb.write( trades_tid_1 );

    var transformedTrades = _.map(_.cloneDeep(trades_tid_1), function(trade) {
      trade.date = moment.unix(trade.date).utc();
      return trade;
    });

    var result = {
      data: transformedTrades,
      amount: _.size(transformedTrades),
      start: _.first(transformedTrades).date,
      end: _.last(transformedTrades).date,
      first: _.first(transformedTrades),
      last: _.last(transformedTrades)
    }

    var tbResult = _.first(_.first(spy.args));
    expect(tbResult.amount).to.equal(result.amount);
    expect(tbResult.start.unix()).to.equal(result.start.unix());
    expect(tbResult.end.unix()).to.equal(result.end.unix());
    expect(tbResult.data.length).to.equal(result.data.length);

    _.each(tbResult.data, function(t, i) {
      expect(tbResult.data[i].tid).to.equal(result.data[i].tid);      
      expect(tbResult.data[i].price).to.equal(result.data[i].price);      
      expect(tbResult.data[i].amount).to.equal(result.data[i].amount);      
    });
  });

  it('should correctly filter trades', function() {
    tb = new TradeBatcher('tid');

    var spy = sinon.spy();
    tb.on('new batch', spy);

    tb.write( trades_tid_1 );
    tb.write( trades_tid_2 );

    expect(spy.callCount).to.equal(2);

    var tbResult = _.first(_.last(spy.args));

    expect(tbResult.amount).to.equal(2);
    expect(tbResult.start.unix()).to.equal(1466115796);
    expect(tbResult.end.unix()).to.equal(1466115797);
    expect(tbResult.data.length).to.equal(2);
  });

  // see @link
  // https://github.com/askmike/gekko/issues/486
  it('should filter out empty trades', function() {
    tb = new TradeBatcher('tid');

    var spy = sinon.spy();
    tb.on('new batch', spy);

    tb.write(empty_trades);

    expect(spy.callCount).to.equal(0);
  }); 

});