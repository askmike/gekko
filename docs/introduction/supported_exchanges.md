## Supported exchanges

Gekko is able to directly communicate with the APIs of a number of exchanges. However communication with some exchanges is somewhat limited. Gekko makes the distinction between the following features:

- Monitoring: Gekko is able to retrieve live market data from the exchange. Gekko can store and run trading simulations over this data.
- Live Trading: Gekko is able to automatically execute orders (based on the signals of your strategy). This turns Gekko into a trading bot.
- Importing: Gekko is able to retrieve historical market data. This way you can easily get a month of market data over which you can [backtest](../features/backtesting.md) your strategy.

| Exchange        | Monitoring | Live Trading | Importing | Notes |
| --------------- |:----------:|:-------:|:---------:|-------|
| [Poloniex](https://poloniex.com/)      | ✓ | ✓ | ✓ | |
| [GDAX](https://gdax.com/)      | ✓ | ✓ | ✓ | |
| [BTCC](https://btcc.com/)      | ✓ | ✓ | ✓ | (=BTCChina) |
| [Bitstamp](https://bitstamp.com/)      | ✓ | ✓ | ✗ | |
| [Kraken](https://kraken.com/)      | ✓ | ✓ | ✗ | |
| [Bitfinex](https://bitfinex.com/)      | ✓ | ✓ | ✗ | |
| [BTC-e](https://btc-e.com/)      | ✓ | ✓ | ✗ | |
| [Okcoin.cn](https://www.okcoin.cn/)      | ✓ | ✓ | ✗ | (China, see [#352](https://github.com/askmike/gekko/pull/352)) |
| [Cex.io](https://cex.io/)      | ✓ | ✓ | ✗ | |
| [BTC Markets](https://btcmarkets.net)      | ✓ | ✓ | ✗ | |
| [bitX](https://www.bitx.co/)      | ✓ | ✗ | ✗ | |
| [lakeBTC](https://lakebtc.com/)      | ✓ | ✗ | ✗ | |
| [meXBT](https://mexbt.com/)      | ✓ | ✗ | ✗ | see [here](https://github.com/askmike/gekko/issues/288#issuecomment-223810974). |
| [zaif](https://zaif.jp/trade_btc_jpy)      | ✓ | ✗ | ✗ | |
| [lakeBTC](https://lakebtc.com/)      | ✓ | ✗ | ✗ | |
| [bx.in.th](https://bx.in.th/)      | ✓ | ✗ | ✗ | |