// wraps around a low level trigger and feeds
// it live market data.

const _ = require('lodash');

const exchangeUtils = require('./exchangeUtils');
const bindAll = exchangeUtils.bindAll;

const triggers = require('./triggers');

// @param api: a gekko broker wrapper instance
// @param type: type of trigger to wrap
// @param props: properties to feed to trigger
class Trigger {
  constructor({api, type, props, onTrigger}) {
    this.onTrigger = onTrigger;
    this.api = api;
    this.props = props;
    this.type = type;

    this.isLive = true;

    // note: we stay on the safe side and trigger
    // as soon as the bid goes below trail.
    this.tickerProp = 'bid';

    if(!_.has(triggers, type)) {
      throw new Error('Gekko Broker does not know trigger ' + type);
    }

    this.CHECK_INTERVAL = this.api.interval * 10;

    bindAll(this);

    this.api.getTicker(this.init);
  }

  init(err, ticker) {
    if(err) {
      return console.log('[GB/trigger] failed to init ticker:', err);
    }

    this.trigger = new triggers[this.type]({
      initialPrice: ticker[this.tickerProp],
      onTrigger: this.propogateTrigger,
      ...this.props
    })

    this.scheduleFetch();
  }

  scheduleFetch() {
    setTimeout(this.fetch, this.CHECK_INTERVAL);
  }

  fetch() {
    if(!this.isLive) {
      return;
    }
    this.api.getTicker(this.processTicker)
  }

  processTicker(err, ticker) {
    if(!this.isLive) {
      return;
    }
    
    if(err) {
      return console.log('[GB/trigger] failed to fetch ticker:', err);
    }

    this.price = ticker[this.tickerProp];

    this.trigger.updatePrice(this.price);
    this.scheduleFetch();
  }

  propogateTrigger() {
    this.isLive = false;
    this.onTrigger();
  }
}

module.exports = Trigger;