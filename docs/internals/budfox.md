# BudFox

**Similar to the [movie Wallstreet](https://en.wikipedia.org/wiki/Wall_Street_(1987_film)), Gekko delegates the dirty work of getting fresh data to Bud Fox. Bud Fox delivers the data to Gekko who uses this data to make investment decisions.**

Whenever Gekko works with realtime market data, it spawns a BudFox to fetch and transform the data for every market (exchange + asset + pair, for example: `bitstamp USD/BTC`). Bud Fox will keep on fetching data from the market in semi-realtime, turn historical trades into minutley candles (and make sure every minute of data has a candle).

BudFox will emit `candles` events which are used by Gekko itself.

## Advanced Usage

BudFox is a small part of Gekko's core that can aggregate realtime market data from any supported exchange, it provides a small API to receive incoming data.

[todo: document listen for trades, listen for candles, listen for ticks]