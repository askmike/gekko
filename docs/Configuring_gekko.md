# Configuring Gekko

This file will explain all different parameters you can set in the [config](https://github.com/askmike/gekko/blob/master/config.js). But for now everything except for real trading is explained in the [config](https://github.com/askmike/gekko/blob/master/config.js) itself.

## Enabling real trading

To enable real trading at a supported exchange you need to enable a trader in the danger zone of the config. The currently supported exchanges are:

* Mt. Gox
* BTC-e
* Bitstamp*

When enabling a trader make sure to fill in your API key and secret, you can generate those on the dashboard of the exchange. You also need to set the currency and asset. Even though Bitcoin is a currency Gekko treats is like an asset when you are trading USD vs BTC. <!--When you set Gekko to trade at an exchange that supports altcoins and you configure Gekko for BTC vs LTC, BTC will be treated as the currency and LTC as the asset.-->

Here is a list of all supported currencies and assets per exchange:

* Mt. Gox:  
  currencies: USD, EUR, GBP, AUD, CAD, CHF, CNY, DKK, HKD, PLN, RUB, SGD, THB  
  assets: BTC

* BTC-e:  
  currencies: USD, EUR, RUR  
  assets: BTC

* Bitstamp:
  currencies: USD  
  assets: BTC

### Example

When you want to run Gekko on Mt. Gox and let it trade BTC against USD you can set the trader in the config like this:


    config.traders = [
      {
        exchange: 'MtGox',
        key: 'your API key',
        secret: 'your API secret',
        currency: 'USD',
        asset: 'BTC',
        enabled: true
      }
    ]

### *Warning for Bitstamp users

Bitstamp only offers login via username and password at their API, so if you want to use Bitstamp that is something you need to set instead of the API key and secret. This does imposes a big security risk:

Gekko won't do anything on the account except for: checking balance and creating buy / sell orders (don't take my word: [check the code yourself](https://github.com/askmike/gekko)). **If you have not downloaded Gekko directly from this Github repo I CANNOT guarantee that malicious code has not been added that will withdraw all your funds.**

### Note for Mt. Gox users

You can only trade the currency configured in the Mt. Gox dashboard.