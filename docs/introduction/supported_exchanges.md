## Supported exchanges

Gekko is able to directly communicate with the APIs of a number of exchanges. However communication with some exchanges is somewhat limited. Gekko makes the distinction between the following features:

- Monitoring: Gekko is able to retrieve live market data from the exchange. Gekko can store and run trading simulations over this data.
- Live Trading: Gekko is able to automatically execute orders (based on the signals of your strategy). This turns Gekko into a trading bot.
- Importing: Gekko is able to retrieve historical market data. This way you can easily get a month of market data over which you can [backtest](../features/backtesting.md) your strategy.

| Exchange        | Monitoring | Live Trading | Importing | Notes |
| --------------- |:----------:|:-------:|:---------:|-------|
| [Poloniex](https://poloniex.com/)      | V | V | V | |
| [GDAX](https://gdax.com/)      | V | V | V | |
| [BTCC](https://btcc.com/)      | V | V | V | (=BTCChina) |
| [Bitstamp](https://bitstamp.com/)      | V | V | V | |
| [Kraken](https://kraken.com/)      | V | V | V | |
| [Bitfinex](https://bitfinex.com/)      | V | V | V | |
| [Bittrex](https://bittrex.com/)      | V | V | X | |
| [wex.nz](https://wex.nz/)      | V | V | X | |
| [Okcoin.cn](https://www.okcoin.cn/)      | V | V | X | (China, see [#352](https://github.com/askmike/gekko/pull/352)) |
| [Cex.io](https://cex.io/)      | V | X | X | |
| [BTC Markets](https://btcmarkets.net)      | V | V | X | |
| [bitX](https://www.bitx.co/)      | V | X | X | |
| [lakeBTC](https://lakebtc.com/)      | V | X | X | |
| [meXBT](https://mexbt.com/)      | V | X | X | see [here](https://github.com/askmike/gekko/issues/288#issuecomment-223810974). |
| [zaif](https://zaif.jp/trade_btc_jpy)      | V | X | X | |
| [lakeBTC](https://lakebtc.com/)      | V | X | X | |
| [bx.in.th](https://bx.in.th/)      | V | X | X | |