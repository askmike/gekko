const _ = require('lodash');
const moment = require('moment');
const retry = require('../exchangeUtils').retry;


const CryptoJS = require("crypto-js");
const querystring = require('querystring');
const request = require('request');

API_URL='https://api.exmo.com/v1/';

const marketData = require('./exmo-markets.json');


const Trader = function(config) {
  _.bindAll(this);
  this.key="";
  this.secret="";
  
  if(_.isObject(config)) {
      if(_.isString(config.key)) this.key = config.key;
      if(_.isString(config.secret)) this.secret = config.secret;
      this.currency = config.currency;
      this.asset = config.asset;
      this.pair = this.asset + '_' + this.currency;
  };

  this.name = 'EXMO';
  this.nonce = new Date() * 1000;
}


const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  'EHOSTUNREACH',
];

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, item => str.includes(item));
}


Trader.prototype.api_query = function(method, params, callback){
	params.nonce = this.nonce++;
	var post_data = querystring.stringify(params);

	var options = {
	  url: API_URL + method,
	  headers: {'Key': this.key,'Sign': CryptoJS.HmacSHA512(post_data, this.secret).toString(CryptoJS.enc.hex) },
	  form: params
	};
	
 	request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            data=JSON.parse(body);          
            if(data.error) error = { message: data.error }
            else if (data.result!=undefined && data.result==false)  error = { message: '"result": false' } ;
            callback(error, data);
        } else {
            console.log('cb request error');
            console.log(body);

			if(error) {
			  if(includes(error.message, recoverableErrors)) {
				error.notFatal = true;
			  }
            console.log(error);
        	callback(error);
            };
       };
     });
};

Trader.prototype.getTrades = function(since, callback, descending) {
  const processResponse = (error, data) => {
    if (error) return callback(error);

    data=data[this.pair];

    var parsedTrades =  _.map(data, function(trade) {   
        return {
          tid: trade.trade_id,
          date: trade.date,
          price: +trade.price,
          amount: +trade.quantity
        };
     });

    if (descending) callback(undefined, parsedTrades);
    else callback(undefined, parsedTrades.reverse());
  };

  const fetch = cb => this.api_query("trades", { pair: this.pair} , cb);
  retry(null, fetch, processResponse); 

}

Trader.prototype.getTicker = function(callback) {
  const processResponse = (err, data) => {
    if (err)
      return callback(err);

    data=data[this.pair];

    callback(undefined, {bid: +data.sell_price, ask: +data.buy_price});
  };

  const fetch = cb => this.api_query("ticker", { pair: this.pair} , cb);
  retry(null, fetch, processResponse);
}

Trader.prototype.getFee = function(callback) {
  callback(undefined, 0.002);
}

Trader.prototype.roundAmount = function(amount) {
  return _.floor(amount, 8);
};

Trader.prototype.roundPrice = function(price) {
  return price;
}

Trader.prototype.submitOrder = function(type, amount, price, callback) {
  const processResponse = (err, data) => {
    if (err)
      return callback(err);

    callback(null, data.order_id);
  }

  const fetch = cb => this.api_query("order_create", { pair: this.pair, quantity: amount, price: price, type: type } , cb);
  retry(null, fetch, processResponse);
  //callback(null, 1177669837);
}

Trader.prototype.buy = function(amount, price, callback) {
  this.submitOrder('buy', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
  this.submitOrder('sell', amount, price, callback);
}

Trader.prototype.getOrder = function(order_id, callback) {
  const processResponse = (err, data) => {

    if(err) 
      return callback(err);

    data=data[this.pair];

    if(data==undefined) return callback(new Error('Orders not found'));

    const order = _.find(data, function(o) { return o.order_id === +order_id });

    if(!order) return callback(new Error('Order not found'));

    callback(undefined, { price: order.price, amount: order.amount, date: moment.unix(order.date) });
  }

  const fetch = cb => this.api_query("user_trades", { pair: this.pair} , cb);
  retry(null, fetch, processResponse); 
}

Trader.prototype.checkOrder = function(order_id, callback) {
  const processResponse = (err, data) => {

    if(err) 
      return callback(err);

    data=data[this.pair];

    if(data==undefined) {
      return callback(undefined, { executed: true, open: false });
    }

    const order = _.find(data, function(o) { return o.order_id === +order_id });
    if(!order) 
      return callback(undefined, { executed: true, open: false });

    callback(undefined, { executed: false, open: true /*, filledAmount: order.startingAmount - order.amount*/ });
  }

  const fetch = cb => this.api_query("user_open_orders", { } , cb);
  retry(null, fetch, processResponse);
}

Trader.prototype.cancelOrder = function(order_id, callback) {
  const processResponse = (err, data) => {
    if (err) {
      return callback(err);
    }

    return callback(undefined, false);
  }

  const fetch = cb => this.api_query("order_cancel", { order_id } , cb);
  retry(null, fetch, processResponse);
}

Trader.prototype.getPortfolio = function(callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    data=data["balances"];
    const balances = _.map(data, function (v,k){ return {name: k, amount: +v};});
    const portfolio = balances.filter(c => c.name===this.asset || c.name===this.currency)

    callback(undefined, portfolio);
  };

  const fetch = cb => this.api_query("user_info", {}, cb);
  retry(null, fetch, processResponse);
}

Trader.getCapabilities = function () {
  return {
    name: 'EXMO',
    slug: 'exmo',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'tid',
    tradable: true,
    gekkoBroker: 0.6
  };
}

module.exports = Trader;
