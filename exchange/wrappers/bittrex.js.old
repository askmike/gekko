var Bittrex = require('node.bittrex.api');
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '-' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);

  if(!config.key) {
    // no api key defined -> we need to set a dummy key, otherwise the Bittrex module will not work even for public requests
    config.key = 'dummyApiKey';
    config.secret = 'dummyApiKey';
  }

  // override if cmd line mode (not --ui)
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }

  this.name = 'Bittrex';
  this.balance;
  this.price;

  this.pair = [this.currency, this.asset].join('-');

  Bittrex.options({
    'apikey':  this.key,
    'apisecret': this.secret,
    'stream': false,
    'verbose': false,
    'cleartext': false
  });

  log.debug('Init', 'New Bittrex Trader', {currency: this.currency, asset: this.asset});

  this.bittrexApi = Bittrex;
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying.', args);

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
  log.debug('getPortfolio', 'called');

  var set = function(data, err) {
    if(err) {
      log.error('getPortfolio', 'Error', err);
      return this.retry(this.getPortfolio, args);
    }


    data = data.result;

    var assetEntry = _.find(data, function(i) { return i.Currency == this.asset}.bind(this));
    var currencyEntry = _.find(data, function(i) { return i.Currency == this.currency}.bind(this));

    if(_.isUndefined(assetEntry)) {
      assetEntry = {
        Available: 0.0,
        Currency: this.asset
      }
    }

    if(_.isUndefined(currencyEntry)) {
      currencyEntry = {
        Available: 0.0,
        Currency: this.currency
      }
    }

    var assetAmount = parseFloat( assetEntry.Available );
    var currencyAmount = parseFloat( currencyEntry.Available );

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

    log.debug('getPortfolio', 'result:', portfolio);

    callback(err, portfolio);
  }.bind(this);

  this.bittrexApi.getbalances(set);
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);

  log.debug('getTicker', 'called');

  this.bittrexApi.getticker({market: this.pair}, function(data, err) {
    if(err)
      return this.retry(this.getTicker, args);

    var tick = data.result;

    log.debug('getTicker', 'result', tick);

    callback(null, {
      bid: parseFloat(tick.Bid),
      ask: parseFloat(tick.Ask),
    })

  }.bind(this));
}

Trader.prototype.getFee = function(callback) {

  log.debug('getFee', 'called');
  /*var set = function(data, err) {
    if(err || data.error)
      return callback(err || data.error);

    data = data.result;

    var assetEntry = _.find(data, function(c) { return c.Currency == this.asset}.bind(this));
    //var currencyEntry = _.find(data, function(c) { return c.Currency == this.currency}.bind(this));

    var fee = parseFloat(assetEntry.TxFee);

    callback(false, parseFloat(assetEntry.TxFee));
  }.bind(this);

  this.bittrexApi.getcurrencies(set); */

   callback(false, parseFloat(0.00025));
}

Trader.prototype.buy = function(amount, price, callback) {
  var args = _.toArray(arguments);

  log.debug('buy', 'called', {amount: amount, price: price});
  var set = function(result, err) {
    if(err || result.error) {
      if(err && err.message === 'INSUFFICIENT_FUNDS') {
          // retry with the already reduced amount, will be reduced again in the recursive call
          log.error('Error buy ' , 'INSUFFICIENT_FUNDS', err );
          // correct the amount to avoid an INSUFFICIENT_FUNDS exception
          var correctedAmount = amount - (0.00255*amount);
          log.debug('buy', 'corrected amount', {amount: correctedAmount, price: price});
         return this.retry(this.buy, [correctedAmount, price, callback]);
      } else if (err && err.message === 'DUST_TRADE_DISALLOWED_MIN_VALUE_50K_SAT') {
        callback(null, 'dummyOrderId');
        return;
      }
      log.error('unable to buy:', {err: err, result: result});
      return this.retry(this.buy, args);
    }

    log.debug('buy', 'result', result);
    callback(null, result.result.uuid);
  }.bind(this);

  this.bittrexApi.buylimit({market: this.pair, quantity: amount, rate: price}, set);
}

Trader.prototype.sell = function(amount, price, callback) {
  var args = _.toArray(arguments);

  log.debug('sell', 'called', {amount: amount, price: price});

  var set = function(result, err) {
    if(err || result.error) {
       log.error('unable to sell:',  {err: err, result: result});

       if(err && err.message === 'DUST_TRADE_DISALLOWED_MIN_VALUE_50K_SAT') {
         callback(null, 'dummyOrderId');
         return;
       }

      return this.retry(this.sell, args);
    }

    log.debug('sell', 'result', result);

    callback(null, result.result.uuid);
  }.bind(this);

  this.bittrexApi.selllimit({market: this.pair, quantity: amount, rate: price}, set);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(result, err) {
    log.debug('checkOrder', 'called');

    var stillThere = _.find(result.result, function(o) { return o.OrderUuid === order });

    log.debug('checkOrder', 'result', stillThere);
    callback(err, !stillThere);
  }.bind(this);

  this.bittrexApi.getopenorders({market: this.pair}, check);
}

Trader.prototype.getOrder = function(order, callback) {

  var get = function(result, err) {

    log.debug('getOrder', 'called');

    if(err)
      return callback(err);

    var price = 0;
    var amount = 0;
    var date = moment(0);

    if(!result.success)
      return callback(null, {price, amount, date});

    var resultOrder = result.result;

    price = resultOrder.Price;
    amount = resultOrder.Quantity;

    if(resultOrder.IsOpen) {
         date = moment(resultOrder.Opened);
    } else {
       date = moment(resultOrder.Closed);
    }

    log.debug('getOrder', 'result', {price, amount, date});
    callback(err, {price, amount, date});
  }.bind(this);

  this.bittrexApi.getorder({uuid: order}, get);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(result, err) {
    log.debug('cancelOrder', 'called', order);

    if(err) {
      if(err.success) {
          log.error('unable to cancel order', order, '(', err, result, '), retrying');
          return this.retry(this.cancelOrder, args);
      } else {
          log.error('unable to cancel order', order, '(', err, result, '), continue');
          callback();
          return;
      }
    }

    if(!result.success && result.message === 'ORDER_NOT_OPEN') {
      log.debug('getOrder', 'ORDER_NOT_OPEN: assuming already closed or executed');
    }

    log.debug('getOrder', 'result', result);

    callback();
  }.bind(this);

  this.bittrexApi.cancel({uuid: order}, cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {

  log.debug('getTrades called!', { descending: descending} );

  var firstFetch = !!since;

  var args = _.toArray(arguments);
  var process = function(data, err) {
    if(err) {
      log.error('Error getTrades()', err)
      return this.retry(this.getTrades, args);
    }

    var result = data.result;

    // Edge case, see here:
    // @link https://github.com/askmike/gekko/issues/479
    if(firstFetch && _.size(result) === 50000)
      util.die(
        [
          'Bittrex did not provide enough data. Read this:',
          'https://github.com/askmike/gekko/issues/479'
        ].join('\n\n')
      );

      result = _.map(result, function(trade) {
        var mr = {
            tid: trade.Id,
            amount: +trade.Quantity,
            date: moment.utc(trade.TimeStamp).unix(),
            timeStamp: trade.TimeStamp,
            price: +trade.Price
        };
    	return mr;
    });

    callback(null, result.reverse());
  }.bind(this);

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }

  if(since)
    params.start = since.unix();

  this.bittrexApi.getmarkethistory({ market: params.currencyPair }, process);
}

Trader.getCapabilities = function() {
  return {
    name: 'bittrex',
    slug: 'bittrex',
    currencies: ['BITCNY', 'BTC', 'ETH', 'USDT'],
    assets: [
      '1ST', '2GIVE', '8BIT', 'ABY', 'ADC', 'ADT', 'ADX', 'AEON', 'AGRS', 'AM',
      'AMP', 'AMS', 'ANS', 'ANT', 'APEX', 'APX', 'ARB', 'ARCH', 'ARDR', 'ARK',
      'AUR', 'BAT', 'BAY', 'BCC', 'BCY', 'BITB', 'BITCNY', 'BITS', 'BITZ', 'BLC',
      'BLITZ', 'BLK', 'BLOCK', 'BNT', 'BOB', 'BRK', 'BRX', 'BSD', 'BSTY', 'BTA',
      'BTC', 'BTCD', 'BTS', 'BURST', 'BYC', 'CANN', 'CCN', 'CFI', 'CLAM',
      'CLOAK', 'CLUB', 'COVAL', 'CPC', 'CRB', 'CRBIT', 'CRW', 'CRYPT', 'CURE',
      'CVC', 'DAR', 'DASH', 'DCR', 'DCT', 'DGB', 'DGC', 'DGD', 'DMD', 'DOGE',
      'DOPE', 'DRACO', 'DTB', 'DTC', 'DYN', 'EBST', 'EDG', 'EFL', 'EGC', 'EMC',
      'EMC2', 'ENRG', 'ERC', 'ETC', 'ETH', 'EXCL', 'EXP', 'FAIR', 'FC2', 'FCT',
      'FLDC', 'FLO', 'FRK', 'FSC2', 'FTC', 'FUN', 'GAM', 'GAME', 'GBG', 'GBYTE',
      'GCR', 'GEMZ', 'GEO', 'GHC', 'GLD', 'GNO', 'GNT', 'GOLOS', 'GP', 'GRC',
      'GRS', 'GRT', 'GUP', 'HKG', 'HMQ', 'HYPER', 'HZ', 'INCNT', 'INFX', 'IOC',
      'ION', 'IOP', 'J', 'JWL', 'KMD', 'KORE', 'KR', 'LBC', 'LGD', 'LMC', 'LSK',
      'LTC', 'LUN', 'LXC', 'MAID', 'MAX', 'MCO', 'MEC', 'MEME', 'METAL', 'MLN',
      'MND', 'MONA', 'MTL', 'MTR', 'MUE', 'MUSIC', 'MYR', 'MYST', 'MZC', 'NAUT',
      'NAV', 'NBT', 'NEO', 'NET', 'NEU', 'NLG', 'NMR', 'NTRN', 'NXC', 'NXS',
      'NXT', 'OC', 'OK', 'OMG', 'OMNI', 'ORB', 'PART', 'PAY', 'PDC', 'PINK',
      'PIVX', 'PKB', 'POT', 'PPC', 'PRIME', 'PTC', 'PTOY', 'PXI', 'QRL', 'QTL',
      'QTUM', 'QWARK', 'RADS', 'RBY', 'RDD', 'REP', 'RISE', 'RLC', 'ROOT',
      'SBD', 'SC', 'SCOT', 'SCRT', 'SDC', 'SEC', 'SEQ', 'SFR', 'SHIFT', 'SIB',
      'SLG', 'SLING', 'SLR', 'SLS', 'SNGLS', 'SNRG', 'SNT', 'SOON', 'SPHR',
      'SPR', 'SPRTS', 'SSD', 'START', 'STEEM', 'STEPS', 'STORJ', 'STRAT', 'STV',
      'SWIFT', 'SWING', 'SWT', 'SYNX', 'SYS', 'TES', 'THC', 'TIME', 'TIT',
      'TKN', 'TKS', 'TRI', 'TRIG', 'TRK', 'TROLL', 'TRST', 'TRUST', 'TX', 'U',
      'UBQ', 'UFO', 'UNB', 'UNIQ', 'UNIT', 'UNO', 'USDT', 'UTC', 'VIA', 'VIOR',
      'VIRAL', 'VOX', 'VPN', 'VRC', 'VRM', 'VTC', 'VTR', 'WARP', 'WAVES', 'WBB',
      'WINGS', 'XAUR', 'XBB', 'XC', 'XCO', 'XCP', 'XDN', 'XDQ', 'XEL', 'XEM',
      'XLM', 'XMG', 'XMR', 'XPY', 'XQN', 'XRP', 'XSEED', 'XST', 'XTC', 'XVC',
      'XVG', 'XWC', 'XZC', 'YBC', 'ZCL', 'ZEC', 'ZEN','BTG','OMG','ADA'
    ],
    markets: [

      // *** BTCNY <-> XXX
      { pair: ['BITCNY','BTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},

      // *** BTC <-> XXX
      { pair: ['BTC','1ST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','2GIVE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ABY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ADT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ADX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','AEON'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','AGRS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','AMP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ANT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','APX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ARDR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ARK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','AUR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BAT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BAY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BCC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BCY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BITB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BLITZ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BLK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BLOCK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BRK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BRX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BSD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BTA'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BTCD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BTS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BURST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','BYC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CANN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CFI'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CLAM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CLOAK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CLUB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','COVAL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CPC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CRB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CRW'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CURE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','CVC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DAR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DASH'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DCR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DCT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DGB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DGD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DMD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DOGE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DOPE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DRACO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DTB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','DYN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EBST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EDG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EFL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EGC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EMC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EMC2'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ENRG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ERC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ETC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ETH'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EXCL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','EXP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FAIR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FCT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FLDC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FLO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','FUN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GAM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GAME'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GBG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GBYTE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GCR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GEO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GLD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GNO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GOLOS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GRC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GRS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','GUP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','HKG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','HMQ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','INCNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','INFX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','IOC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ION'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','IOP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','KMD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','KORE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LBC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LGD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LMC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LSK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','LUN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MAID'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MCO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MEME'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MLN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MONA'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MTL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MUE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MUSIC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','MYST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NAUT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NAV'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NBT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NEO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NLG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NMR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NXC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NXS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','NXT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','OK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','OMG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','OMNI'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PART'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PAY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PDC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PINK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PIVX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PKB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','POT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PPC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','PTOY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','QRL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','QTUM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','QWARK'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','RADS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','RBY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','RDD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','REP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','RISE'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','RLC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SAFEX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SBD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SEQ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SHIFT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SIB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SLR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SLS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SNGLS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SNRG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SPHR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SPR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','START'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','STEEM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','STORJ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','STRAT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SWIFT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SWT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SYNX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','SYS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','THC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TIME'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TKN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TKS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TRIG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TRST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TRUST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','TX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','UBQ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','UNB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','UNO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VIA'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VOX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VRC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VRM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','VTR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','WAVES'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','WINGS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XAUR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XBB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XCP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XDN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XEL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XEM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XLM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XMG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XMR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XMY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XRP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XVC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XVG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XWC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','XZC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ZCL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ZEC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['BTC','ZEN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},

      // *** ETH <-> XXX
      { pair: ['ETH','1ST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','ADT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','ADX'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','ANT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','BAT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','BCC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','BNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','BTS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','CFI'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','CRB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','CVC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','DASH'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','DGB'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','DGD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','ETC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','FCT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','FUN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','GNO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','GNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','GUP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','HMQ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','LGD'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','LTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','LUN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','MCO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','MTL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','MYST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','NEO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','NMR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','OMG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','PAY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','PTOY'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','QRL'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','QTUM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','REP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','RLC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','SC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','SNGLS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','SNT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','STORJ'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','STRAT'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','TIME'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','TKN'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','TRST'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','WAVES'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','WINGS'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','XEM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','XLM'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','XMR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','XRP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['ETH','ZEC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},

      // *** USDT <-> XXX
      { pair: ['USDT','BCC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','BTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','DASH'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','ETC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','ETH'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','LTC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','NEO'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','XMR'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','XRP'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','ZEC'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','BTG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','OMG'], minimalOrder: { amount: 0.00000001, unit: 'asset' }},
      { pair: ['USDT','ADA'], minimalOrder: { amount: 0.00000001, unit: 'asset' }}

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: 'date',
    providesFullHistory: false,
    tradable: true,
    forceReorderDelay: true
  };
};




module.exports = Trader;
