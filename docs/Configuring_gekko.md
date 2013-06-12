# Configuring Gekko

This file will explain all different parameters you can set in the [config](https://github.com/askmike/gekko/blob/master/config.js).

The easiest way to configure Gekko is in the normal zone of the config:

    config.normal = {
      enabled: true,
      exchange: 'MtGox', // 'MtGox', 'BTCe' or 'Bitstamp'
      currency: 'USD',
      asset: 'BTC',
      tradingEnabled: false,
      key: '',
      secret: '',
    }

## Exchanges

Gekko currently supports these exchanges:

* [Mt. Gox](https://mtgox.com) (MtGox)
* [BTC-e](http://btc-e.com) (BTCe)
* [Bitstamp](http://bitstamp.com) (Bitstamp)*

You have to tell Gekko what market to monitor on the selected exchange, A market is defined by a `currency` and an `asset`. here are all supported combinations per exchange:

* Mt. Gox:  
  currencies: USD, EUR, GBP, AUD, CAD, CHF, CNY, DKK, HKD, PLN, RUB, SGD, THB  
  assets: BTC

* BTC-e:  
  currencies: USD, EUR, RUR  
  assets: BTC

* Bitstamp:
  currencies: USD  
  assets: BTC

*Even though Bitcoin is a currency Gekko treats is like an asset when you are trading USD vs BTC.*

### *Warning for Bitstamp users

Bitstamp only offers login via username and password at their API, so if you want to use Bitstamp that is something you need to set instead of the API key and secret. This does imposes a big security risk:

Gekko won't do anything on the account except for: checking balance and creating buy / sell orders (don't take my word: [check the code yourself](https://github.com/askmike/gekko)). **If you have not downloaded Gekko directly from this Github repo I CANNOT guarantee that malicious code has not been added that will withdraw all your funds.**

If you choose to let Gekko trade on Bitstamp note that you first have to enable API access in your Bitstamp settings.

## Real trading

If you want to let Gekko trade on your account you also need to fill in your `key` and `secret` (or `user` and `password` if you want to trade at Bitstamp*) and set `tradingEnabled` to true. You can get the key and secret on the websites of the exchanges. Gekko only needs trade rights to create the trade orders.

## EMA Settings

You can configure all EMA settings Gekko will use to base its advice on. They are all explained in the config.

## Mail advice

Gekko will always log the advice it gives. You can also let Gekko mail you new advice to buy or sell. You do need to have a Gmail (of Google Apps) account and Gekko needs to have the password so it can send the email from your account.

**WARNING: If you have NOT downloaded Gekko from the original github page we CANNOT garantuee that your email address & password are safe!**


## Profit Calculator

Gekko can calculate the profit of its advice by using a trade simulation.

    config.profitCalculator = {
      enabled: true,
      reportInCurrency: true,
      simulationBalance: {
        asset: 1,
        currency: 100,
      },
      verbose: true
    }

The calculator listens to Gekko's advice and on a sell it will swap all (simulated) currency into (simulated) assets at the current price. On a buy it will be the other way around. If you set `reportInCurrency` to false the profit will be calculated in `asset` instead of `currency` (the ones you set in the normal zone). When you set `verbose` to false Gekko will only report the profit after a sell instead of after every interval.


## Enabling real trading

To enable real trading at a supported exchange you need to enable a trader in the advances zone of the config. The currently supported exchanges are:

## The advanced zone

If you want to monitor an exchange but act on a different one, or watch a single exchange and act on multiple exchanges based on the advice you have to disable (or uncomment) the normal zone and configure the advanced zone: 

### Set the watcher

The watcher is the exchange Gekko pulls trade data from to analyze and detect trend. Set it as you would set the market in the normal zone.

### Set traders

The traders are objects with properties reflecting the exchange, the market and the credentials to create orders. The objects need to have the same structure as the object in the normal zone.