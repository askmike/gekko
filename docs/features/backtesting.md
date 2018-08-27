# Backtesting

Gekko supports backtesting strategies over historical data. A Backtest is a simulation where you simulate running a strategy over a long time (such as the last 30 days) in a matter of seconds. Backtesting requires having market data locally available already. After a backtest Gekko will provide statistics about the market and the strategy's performance.

![screen shot of gekko backtesting](https://cloud.githubusercontent.com/assets/969743/24838718/8c790a86-1d45-11e7-99ae-e7e551cb40cb.png)

**Important things to remember:**

- Just because a strategy performed well in the past, does not mean it will perform well in the future.
- Be careful of overfitting, in other words: don't simply tweak a strategy until you get high profit and assume that will be as profitable when going live. Read more about overfitting in [this article](https://laplaceinsights.com/backtesting-strategies-and-overfitting/).
- The backtest simulation is limited, this is not really a problem on bigger markets (such as BTC/USD) but the differences between backtests and live traders on very low volume markets might be big. Read more about this below in the simplified simulation below.

## Simplified simulation

Simulating trades is done through a module called the paper trader. This module will use market candles together with fee, slippage and spread numbers to estimate trade executions costs. While the default settings work great for most big markets (USD/BTC or BTC/ETH), it becomes a lot less acurate on smaller markets with low volume and liquidity.

In live trading the notion of the "price" is more complicated than a single number. Both `spread` and `slippage` will effect your trade prices: these numbers describe your desired trades in relation to what people are currently offering in the market (this is called the orderbook). Read more about this in [this explanation](https://github.com/askmike/gekko/issues/2380#issuecomment-408744682).

If you look at the following backtest result:

![screen shot of backtesting at an illiquid market](https://cloud.githubusercontent.com/assets/969743/24840243/8f307022-1d61-11e7-9964-e6614d7433ea.png)

You can see a lot of "spikes" of the price moving up and down. These are not actually price fluctuations but simply trades that happen on both sides of the orderbook (a bid is taken then an ask is taken). How far it jumps up and down is the spread (between the asks and the bids). In these cases the statistics from the simulation won't be very accurate (unless you configured a higher slippage to account for the spread). This is unfortunately a limitation in Gekko's backtesting model.
