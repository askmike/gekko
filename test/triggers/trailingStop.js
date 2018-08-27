const chai = require('chai');
const expect = chai.expect;
const should = chai.should;
const sinon = require('sinon');

const _ = require('lodash');
const moment = require('moment');

const utils = require(__dirname + '/../../core/util');

const dirs = utils.dirs();
const TrailingStop = require(dirs.broker + 'triggers/trailingStop');

describe('exchange/triggers/trailingStop', () => {
  let cb;

  it('should instantiate a trailing stop loss trigger', () => {
    expect(() => {
      const ts = new TrailingStop({
        trail: 10,
        initialPrice: 100,
        onTrigger: () => {}
      })
    }).to.not.throw()
  })

  it('should call onTrigger when the stop hits', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(50);

    expect(spy.called).to.be.true;
  });

  it('should emit a trigger event when the stop hits', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100
    });

    ts.on('trigger', spy);

    ts.updatePrice(50);

    expect(spy.called).to.be.true;
  });

  it('should not trigger when the the price does not go down', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(100);
    ts.updatePrice(101);
    ts.updatePrice(102);
    ts.updatePrice(103);
    ts.updatePrice(104);

    expect(spy.called).to.be.false;
  });

  it('should not trigger when the the price goes down but above the offset', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(99);
    ts.updatePrice(98);
    ts.updatePrice(97);
    ts.updatePrice(96);
    ts.updatePrice(95);
    ts.updatePrice(94);
    ts.updatePrice(93);
    ts.updatePrice(92);
    ts.updatePrice(91);

    expect(spy.called).to.be.false;
  });

  it('should trigger when the the price equals the offset', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(99);
    ts.updatePrice(98);
    ts.updatePrice(92);

    expect(spy.called).to.be.false;

    ts.updatePrice(90);

    expect(spy.called).to.be.true;
  });

  it('should trigger when the the price goes up and down', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(101);
    ts.updatePrice(102);
    ts.updatePrice(103);
    ts.updatePrice(104);
    ts.updatePrice(105);

    expect(spy.called).to.be.false;

    ts.updatePrice(95);

    expect(spy.called).to.be.true;
  });

  it('should only trigger once', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(90);
    expect(spy.called).to.be.true;

    const spy2 = sinon.spy();
    ts.on('trigger', spy2);
    ts.updatePrice(80);
    expect(spy2.called).to.be.false;
  });

    it('should not trigger when the the price swings above the trail', () => {
    const spy = sinon.spy();

    const ts = new TrailingStop({
      trail: 10,
      initialPrice: 100,
      onTrigger: spy
    });

    ts.updatePrice(110);
    ts.updatePrice(101);
    ts.updatePrice(111);
    ts.updatePrice(102);
    ts.updatePrice(112);
    ts.updatePrice(103);
    ts.updatePrice(113);
    ts.updatePrice(104);

    expect(spy.called).to.be.false;

    ts.updatePrice(103);

    expect(spy.called).to.be.true;
  });

});