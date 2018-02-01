# Events

As described in the [architecture](./architecture.md) events play a key role in the complete system: they relay all information between seperate components. This makes the codebase scalable, testable and it seperates concerns.

if you run the Gekko UI events are relayed between core components as well as broadcasted (via the UI server) to the web UI. This means that all events broadcasted by any plugin automatically end up in the web UI.

Note that all events from Gekko come from a plugin (with the exception of the `candle` event, which comes from the market), and no plugin is required for Gekko to run, this means it might be possible that some events are never broadcasted since their originating plugin is not active. If a plugin wants to listen to an event that will never be broadcasted (because of a lack of another plugin) this will be warned in the console like so:

    (WARN): Paper Trader wanted to listen to the tradingAdvisor, however the tradingAdvisor is disabled.

## List of events

- [candle](#candle-event): Every time Gekko calculas a new one minute candle from the market.
- [advice](#advice-event): Every time the trading strategy has new advice.
- [trade](#trade-event): Every time a trading plugin (either the live trader or the paper trader) has completed a trade.
- [portfolioUpdate](#portfolioUpdate-event): Is broadcasted once a trading plugin has an updated portflio.

Beside those there are also two additional market events, note that those are only emitted when Gekko is running in either realtime or importing mode (NOT during a backtest for performance reasons).

- [marketStart](#marketStart-event): Once, when the market just started.
- [marketUpdate](#marketUpdate-event): Whenever the market has fetched new raw market data.

### candle event

- What: an object containing a one minute candle from the market.
- When: In liquid markets roughly every minute.
- Subscribe: Your plugin can subscribe to this event by registering the `processCandle` method.
- Async: When subscribing to this event the second argument will be a callback which you are expected to call when done handling this event.
- Notes: 
  - Depending on the gekko configuration these candles might be historical on startup.
  - In illiquid markets (of less than a trade per minute) Gekko will caculate these candles in batches and a few might come at the same time.
- Example:
      {
        start: [moment object of the start time of the candle],
        open: [number, open of candle],
        high: [number, high of candle],
        low: [number, low of candle],
        close: [number, close of candle],
        vwp: [number, average weighted price of candle],
        volume: [number, total volume volume],
        trades: [number, amount of trades]
      }

### advice event

- What: an object containing an advice from the strategy, the advice will either be LONG or SHORT.
- When: This depends on the strategy and the candleSize.
- Subscribe: Your plugin can subscribe to this event by registering the `processAdvice` method.
- Example:
      {
        recommendation: [position to take, either long or short],
        portfolio: [amount of portfolio you should move to position] **DECREPATED**
      }

### trade event

- What: an object containing the summary of a single completed trade (buy or sell).
- When: Some point in time after the advice event, at the same time as the trade event.
- Subscribe: Your plugin can subscribe to this event by registering the `processTrade` method.
- Example:
      {
        action: [either "buy" or "sell"],
        price: [number, price that was sold at],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio]
      }

### portfolioUpdate event

- What: an object containing updated portfolio information.
- When: Some point in time after the advice event, at the same time as the trade event.
- Subscribe: Your plugin can subscribe to this event by registering the `processPortfolioUpdate` method.
- Example:
      {
        currency: [number, portfolio amount of currency],
        asset: [number, portfolio amount of asset]
      }

### marketStart event

- What: a moment object describing the first date of the market data.
- When: when the market is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketStart` method.
- Example:
      [moment object describing the date of the first market data]

### marketUpdate event

- What: a moment object describing the point in time for up to which the market has market data.
- When: every few seconds.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketUpdate` method.
- Example:
      [moment object describing the date of the latest market data]

