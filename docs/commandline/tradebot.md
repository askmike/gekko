# Tradebot

You can set Gekko up as a tradebot, this will instruct Gekko to:

- Watch a live market.
- Run a strategy (in semi-realtime) over live market data.
- Automatically create buy/sell orders based on signals coming from the strategy.

*As with everything in Gekko, the tradebot will make decisions based on the strategy selected/configured/created **by YOU**. If you end up losing money, you have no one to blame but yourself.*

## Configuration

First, set up Gekko for commandline usage (see [this document](./about_the_commandline.md) for details). After that, configure the following plugins:

- `config.watch` - the market to trade on.
- `candleWriter` - (optional) also store market data to disk.
- `tradingAdvisor` - configure the strategy and candle properties.
- `trader` - configure Gekko access to your exchange account.

Turn off the paperTrader (to not get conflicting profit reports).

Once done, run Gekko in live mode.
