# Scope

Gekko is a free and open source tool that is designed as a starterskit for automated trading on cryptocurrency markets. Gekko aims to have a low barrier entry to writing your own strategies (however a basic scripting knowledge in javascript is required for users who create their own strategies). This page will discuss the scope of some components of Gekko, explaining how things are done and why they are done a certain way.

## Market data

Gekko aggregates all market data into minutely candles (OHLC, VWP and amount of trades). This means Gekko only has to store candles on disk, which take up a predictable amount of space on your harddrive. The tradebot will use some additional market data (the orderbook) to make efficient execute orders efficiently, but this data is not visibile anywhere else.

## Strategies

Strategies are simple scripts that handle new market data (OHLC candles) as well as calculated indicator results (strategies specify what indicators they want with which settings). Every time there is new data the strategy can determine to signal either LONG or SHORT. That's about it! This very simple design (candles + indicator values go in => signals come out) is quite powerfull.

Unfortunately this simple design can sometimes be limiting, here are some limitations:

- Since strategies are only fed candles (and indicator values):
 - Strategies cannot act on a smaller timeframe than 1 minute.
 - Strategies cannot see any trades.
 - Strategies cannot look at the orderbook.
- Strategies do not know what the current portfolio looks like.
- Strategies can only trigger a LONG or SHORT which signals to go "all in".

## Execution strategy

When you are using Gekko for a real tradebot Gekko will create orders at the exchange whenever your strategy signials an advice (long or short). If your strategy signal a long advice Gekko will try to buy as much "asset" as it can get with all your "currency" (if your strat is running on USD/BTC that would mean buying BTC with all your USD). As for creating the orders Gekko is conservative and stays on your side of the orderbook (this means you don not lose on the spread, slippage or taker fees). An example:

If your strategy signals a LONG signal and this is the current orderbook:

<img width="279" alt="screen shot 2017-08-26 at 23 26 22" src="https://user-images.githubusercontent.com/969743/29745564-0bb096a6-8ab6-11e7-8bdb-12a6c0274482.png">

Gekko will try to buy bitcoin by placing a limit order at a price of `4336.29` in the hope someone sells into the order. Every few seconds Gekko will readjust the order to stay on top of the orderbook. *Note that order simulation (in the paper trader and backtester) is handled differently, since the orderbook is not used in the simulation.*