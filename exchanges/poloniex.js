var Poloniex = require("poloniex.js");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '_' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'Poloniex';
  this.balance;
  this.price;

  this.pair = [this.currency, this.asset].join('_');

  this.poloniex = new Poloniex(this.key, this.secret);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {
    if(err)
      return this.retry(this.getPortfolio, args);

    var assetAmount = parseFloat( data[this.asset] );
    var currencyAmount = parseFloat( data[this.currency] );

    if(
      !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
      !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
    ) {
      log.info('asset:', this.asset);
      log.info('currency:', this.currency);
      log.info('exchange data:', data);
      util.die('Gekko was unable to set the portfolio');
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    callback(err, portfolio);
  }.bind(this);

  this.poloniex.myBalances(set);
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);
  this.poloniex.getTicker(function(err, data) {
    if(err)
      return this.retry(this.getTicker, args);

    var tick = data[this.pair];

    callback(null, {
      bid: parseFloat(tick.highestBid),
      ask: parseFloat(tick.lowestAsk),
    });

  }.bind(this));
}

Trader.prototype.getFee = function(callback) {
  var set = function(err, data) {
    if(err || data.error)
      return callback(err || data.error);

    callback(false, parseFloat(data.makerFee));
  }
  this.poloniex._private('returnFeeInfo', _.bind(set, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err || result.error) {
      log.error('unable to buy:', err, result);
      return this.retry(this.buy, args);
    }

    callback(null, result.orderNumber);
  }.bind(this);

  this.poloniex.buy(this.currency, this.asset, price, amount, set);
}

Trader.prototype.sell = function(amount, price, callback) {
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err || result.error) {
      log.error('unable to sell:', err, result);
      return this.retry(this.sell, args);
    }

    callback(null, result.orderNumber);
  }.bind(this);

  this.poloniex.sell(this.currency, this.asset, price, amount, set);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    var stillThere = _.find(result, function(o) { return o.orderNumber === order });
    callback(err, !stillThere);
  }.bind(this);

  this.poloniex.myOpenOrders(this.currency, this.asset, check);
}

Trader.prototype.getOrder = function(order, callback) {

  var get = function(err, result) {

    if(err)
      return callback(err);

    var price = 0;
    var amount = 0;
    var date = moment(0);

    if(result.error === 'Order not found, or you are not the person who placed it.')
      return callback(null, {price, amount, date});

    _.each(result, trade => {

      date = moment(trade.date);
      price = ((price * amount) + (+trade.rate * trade.amount)) / (+trade.amount + amount);
      amount += +trade.amount;

    });

    callback(err, {price, amount, date});
  }.bind(this);

  this.poloniex.returnOrderTrades(order, get);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, result) {

    // check if order is gone already
    if(result.error === 'Invalid order number, or you are not the person who placed the order.')
      return callback(true);

    if(err || !result.success) {
      log.error('unable to cancel order', order, '(', err, result, '), retrying');
      return this.retry(this.cancelOrder, args);
    }

    callback();
  }.bind(this);

  this.poloniex.cancelOrder(this.currency, this.asset, order, cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {

  var firstFetch = !!since;

  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err) {
      return this.retry(this.getTrades, args);
    }

    // Edge case, see here:
    // @link https://github.com/askmike/gekko/issues/479
    if(firstFetch && _.size(result) === 50000)
      util.die(
        [
          'Poloniex did not provide enough data. Read this:',
          'https://github.com/askmike/gekko/issues/479'
        ].join('\n\n')
      );

    result = _.map(result, function(trade) {
    	return {
        tid: trade.tradeID,
        amount: +trade.amount,
        date: moment.utc(trade.date).unix(),
        price: +trade.rate
      };
    });

    callback(null, result.reverse());
  };

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }

  if(since)
    params.start = since.unix();

  this.poloniex._public('returnTradeHistory', params, _.bind(process, this));
}

Trader.getCapabilities = function () {
  return {
    name: 'Poloniex',
    slug: 'poloniex',
    currencies: ['BTC', 'ETH', 'XMR', 'USDT'],
    assets: [
      '1CR', 'ABY', 'AC', 'ACH', 'ADN', 'AEON', 'AERO', 'AIR', 'AMP', 'APH',
      'ARCH', 'AUR', 'AXIS', 'BALLS', 'BANK', 'BBL', 'BBR', 'BCC', 'BCH', 'BCN',
      'BCY', 'BDC', 'BDG', 'BELA', 'BITCNY', 'BITS', 'BITUSD', 'BLK', 'BLOCK',
      'BLU', 'BNS', 'BONES', 'BOST', 'BTC', 'BTCD', 'BTCS', 'BTM', 'BTS',
      'BURN', 'BURST', 'C2', 'CACH', 'CAI', 'CC', 'CCN', 'CGA', 'CHA', 'CINNI',
      'CLAM', 'CNL', 'CNMT', 'CNOTE', 'COMM', 'CON', 'CORG', 'CRYPT', 'CURE',
      'CYC', 'DAO', 'DASH', 'DCR', 'DGB', 'DICE', 'DIEM', 'DIME', 'DIS', 'DNS',
      'DOGE', 'DRKC', 'DRM', 'DSH', 'DVK', 'EAC', 'EBT', 'ECC', 'EFL', 'EMC2',
      'EMO', 'ENC', 'ETC', 'ETH', 'eTOK', 'EXE', 'EXP', 'FAC', 'FCN', 'FCT',
      'FIBRE', 'FLAP', 'FLDC', 'FLO', 'FLT', 'FOX', 'FRAC', 'FRK', 'FRQ',
      'FVZ', 'FZ', 'FZN', 'GAME', 'GAP', 'GDN', 'GEMZ', 'GEO', 'GIAR', 'GLB',
      'GML', 'GNS', 'GNT', 'GOLD', 'GPC', 'GPUC', 'GRC', 'GRCX', 'GRS', 'GUE', 'H2O',
      'HIRO', 'HOT', 'HUC', 'HUGE', 'HVC', 'HYP', 'HZ', 'IFC', 'INDEX', 'IOC',
      'ITC', 'IXC', 'JLH', 'JPC', 'JUG', 'KDC', 'KEY', 'LBC', 'LC', 'LCL',
      'LEAF', 'LGC', 'LOL', 'LOVE', 'LQD', 'LSK', 'LTBC', 'LTC', 'LTCX',
      'MAID', 'MAST', 'MAX', 'MCN', 'MEC', 'METH', 'MIL', 'MIN', 'MINT', 'MMC',
      'MMNXT', 'MMXIV', 'MNTA', 'MON', 'MRC', 'MRS', 'MTS', 'MUN', 'MYR',
      'MZC', 'N5X', 'NAS', 'NAUT', 'NAV', 'NBT', 'NEOS', 'NL', 'NMC', 'NOBL',
      'NOTE', 'NOXT', 'NRS', 'NSR', 'NTX', 'NXT', 'NXTI', 'OMNI', 'OPAL',
      'PAND', 'PASC', 'PAWN', 'PIGGY', 'PINK', 'PLX', 'PMC', 'POT', 'PPC', 'PRC',
      'PRT', 'PTS', 'Q2C', 'QBK', 'QCN', 'QORA', 'QTL', 'RADS', 'RBY', 'RDD', 'REP',
      'RIC', 'RZR', 'SBD', 'SC', 'SDC', 'SHIBE', 'SHOPX', 'SILK', 'SJCX',
      'SLR', 'SMC', 'SOC', 'SPA', 'SQL', 'SRCC', 'SRG', 'SSD', 'STEEM', 'STR',
      'SUM', 'SUN', 'SWARM', 'SXC', 'SYNC', 'SYS', 'TAC', 'TOR', 'TRUST',
      'TWE', 'UIS', 'ULTC', 'UNITY', 'URO', 'USDE', 'USDT', 'UTC', 'UTIL',
      'UVC', 'VIA', 'VOOT', 'VOX', 'VRC', 'VTC', 'WC', 'WDC', 'WIKI', 'WOLF',
      'X13', 'XAI', 'XAP', 'XBC', 'XC', 'XCH', 'XCN', 'XCP', 'XCR', 'XDN',
      'XDP', 'XEM', 'XHC', 'XLB', 'XMG', 'XMR', 'XPB', 'XPM', 'XRP', 'XSI',
      'XST', 'XSV', 'XUSD', 'XVC', 'XXC', 'BCH', 'YACC', 'YANG', 'YC', 'YIN', 'ZEC'
    ],
    markets: [
      // *** BTC <-> XXX
      { pair: ['BTC', '1CR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ABY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ACH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ADN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AEON'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AERO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AIR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AMP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'APH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ARCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AUR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'AXIS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BALLS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BANK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BBL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BBR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BCC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BCY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BDC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BDG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BELA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BITCNY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BITS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BITUSD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BLK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BLOCK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BLU'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BNS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BONES'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BOST'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BTCD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BTCS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BTM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BTS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BURN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'BURST'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'C2'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CACH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CAI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CGA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CHA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CINNI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CLAM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CNL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CNMT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CNOTE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'COMM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CON'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CORG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CRYPT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CURE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'CYC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DAO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DASH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DCR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DGB'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DICE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DIEM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DIME'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DIS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DNS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DOGE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DRKC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DRM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DSH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'DVK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EAC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EBT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ECC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EFL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EMC2'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EMO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ENC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ETC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'eTOK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EXE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'EXP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FAC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FCT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FIBRE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FLAP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FLDC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FLO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FLT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FOX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FRAC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FRK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FRQ'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FVZ'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FZ'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'FZN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GAME'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GAP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GDN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GEMZ'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GEO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GIAR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GLB'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GML'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GNS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GOLD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GPC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GPUC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GRC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GRCX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GRS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'GUE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'H2O'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HIRO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HOT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HUC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HUGE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HVC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HYP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'HZ'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'IFC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'INDEX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'IOC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ITC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'IXC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'JLH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'JPC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'JUG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'KDC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'KEY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LBC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LCL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LEAF'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LGC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LOL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LOVE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LQD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LSK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LTBC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'LTCX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MAID'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MAST'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MAX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MEC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'METH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MIL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MIN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MINT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MMC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MMNXT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MMXIV'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MNTA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MON'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MRC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MRS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MTS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MUN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MYR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'MZC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'N5X'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NAS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NAUT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NAV'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NBT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NEOS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NMC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NOBL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NOTE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NOXT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NRS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NSR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NTX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NXT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'NXTI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'OMNI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'OPAL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PAND'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PASC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PAWN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PIGGY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PINK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PLX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PMC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'POT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PPC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PRC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PRT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'PTS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'Q2C'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'QBK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'QCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'QORA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'QTL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'RADS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'RBY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'RDD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'REP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'RIC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'RZR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SBD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SDC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SHIBE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SHOPX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SILK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SJCX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SLR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SMC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SOC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SPA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SQL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SRCC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SRG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SSD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'STEEM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'STR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SUM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SUN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SWARM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SXC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SYNC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'SYS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'TAC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'TOR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'TRUST'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'TWE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'UIS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ULTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'UNITY'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'URO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'USDE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'USDT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'UTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'UTIL'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'UVC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'VIA'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'VOOT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'VOX'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'VRC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'VTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'WC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'WDC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'WIKI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'WOLF'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'X13'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XAI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XAP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XBC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XCP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XCR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XDN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XDP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XEM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XHC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XLB'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XMG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XMR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XPB'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XPM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XSI'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XST'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XSV'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XUSD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XVC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'XXC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'YACC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'YANG'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'YC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'YIN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['BTC', 'ZEC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },

      // *** USDT <-> XXX
      { pair: ['USDT', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'BCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'DASH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ETC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'LTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'NXT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'REP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'STR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'XMR'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'XRP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ZEC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },

      // *** ETH <-> XXX
      { pair: ['ETH', 'ETC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'BCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'GNO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'GNT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'LSK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'REP'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'STEEM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['ETH', 'ZEC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },

      // *** XMR <-> XXX
      { pair: ['XMR', 'BCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'BLK'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'BTCD'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'DASH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'LTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'MAID'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'NXT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['XMR', 'ZEC'], minimalOrder: { amount: 0.0001, unit: 'asset' } }

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: 'date',
    providesFullHistory: true,
    tradable: true
  };
}

module.exports = Trader;
