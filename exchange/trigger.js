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

    this.isLive = true;

    // note: we stay on the safe side and trigger
    // as soon as the bid goes below trail.
    this.tickerProp = 'bid';

    if(!_.has(triggers, type)) {
      throw new Error('Gekko Broker does not know trigger ' + type);
    }

    this.CHECK_INTERVAL = this.api.interval * 10;

    bindAll(this);
    this.trigger = new triggers[type]({
      onTrigger: this.propogateTrigger,
      ...props
    })

    this.scheduleFetch();
  }

  scheduleFetch() {
    this.timout = setTimeout(this.fetch, this.CHECK_INTERVAL);
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

  cancel() {
    this.isLive = false;
    clearTimeout(this.timout);
  }

  propogateTrigger(payload) {
    if(!this.isLive) {
      return;
    }
    this.isLive = false;
    this.onTrigger(payload);
  }
}

module.exports = Trigger;