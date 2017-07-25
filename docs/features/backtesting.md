# Backtesting

Gekko supports backtesting strategies over historical data. This means that Gekko will simulate running a strategy in realtime against a live market. Backtesting requires having data locally available already. After a backtest Gekko will provide statistics about the market and the strategy's performance.

![screen shot of gekko backtesting](https://cloud.githubusercontent.com/assets/969743/24838718/8c790a86-1d45-11e7-99ae-e7e551cb40cb.png)

## Simplified simulation

Gekko backtests using a very limited datasource (only OHCL candles). This means that Gekko estimates trades (and thus profits), which depending on the liquidity and market depth might be estimated very wrong. By configuring the paper trader's fee and slippage you can control you can better mimic trading at the real market.

In order to backtest with 100% accuracy one would need the exact state of the orderbook (spread and depth) as well as information about orders happening around the time of each advice. With Gekko we made the decision to not store all this information (to simplify importing and storing market data). In volumeus and liquid markets this shouldn't be too much of a problem, but if you are backtesting over a small market (like some altcoins or smaller markets) the estimation will be of poor accuracy.

If you look at the following backtest result:

![screen shot of backtesting at an illiquid market](https://cloud.githubusercontent.com/assets/969743/24840243/8f307022-1d61-11e7-9964-e6614d7433ea.png)

You can see a lot of "spikes" of the price moving up and down. These are not actually price fluctiations but simply trades that happen on both sides of the orderbook (a bid is taken then an ask is taken). How far it jumps up and down is the spread (between the asks and the bids). In these cases the statistics from the simulation won't be very accurate (unless you configured a higher slippage to account for the spread). This is unfortunately a limitation in Gekko's backtesting model.