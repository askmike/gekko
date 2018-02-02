# Events

As described in the [architecture](./architecture.md) events play a key role in the complete system: they relay all information between seperate components (like plugins). This makes the codebase scalable, testable and it seperates concerns.

if you run the Gekko UI events are relayed between core components as well as broadcasted (via the UI server) to the web UI. This means that all events broadcasted by any plugin automatically end up in the web UI.

Note that all events from Gekko come from a plugin (with the exception of the `candle` event, which comes from the market), and no plugin is required for Gekko to run, this means it might be possible that some events are never broadcasted since their originating plugin is not active. If a plugin wants to listen to an event that will never be broadcasted (because of a lack of another plugin) this will be warned in the console like so:

    (WARN): Paper Trader wanted to listen to the tradingAdvisor, however the tradingAdvisor is disabled.

## List of events

- [candle](#candle-event): Every time Gekko calculas a new one minute candle from the market.
- [advice](#advice-event): Every time the trading strategy has new advice.
- [trade](#trade-event): Every time a trading plugin (either the live trader or the paper trader) has completed a trade.
- [portfolioUpdate](#portfolioUpdate-event): Every time a trading plugin has an updated portflio.
- [stratStat](#stratStart-event): Once, with the first data this strategy is based on.
- [stratUpdate](#stratUpdate-event): Every time the strategy has processed new data.

Beside those there are also two additional market events, note that those are only emitted when Gekko is running in either realtime or importing mode (NOT during a backtest for performance reasons).

- [marketStart](#marketStart-event): Once, when the market just started.
- [marketUpdate](#marketUpdate-event): Whenever the market has fetched new raw market data.

### candle event

- What: An object containing a one minute candle from the market.
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

- What: An object containing an advice from the strategy, the advice will either be LONG or SHORT.
- When: This depends on the strategy and the candleSize.
- Subscribe: Your plugin can subscribe to this event by registering the `processAdvice` method.
- Example:
      {
        recommendation: [position to take, either long or short],
        portfolio: [amount of portfolio you should move to position] **DECREPATED**
      }

### trade event

- What: An object containing the summary of a single completed trade (buy or sell).
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

- What: An object containing updated portfolio information.
- When: Some point in time after the advice event, at the same time as the trade event.
- Subscribe: Your plugin can subscribe to this event by registering the `processPortfolioUpdate` method.
- Example:
      {
        currency: [number, portfolio amount of currency],
        asset: [number, portfolio amount of asset]
      }

### stratStart event

- What: An object describing the first candle of the strat has processed.
- When: when the strategy is initialized is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processStratStart` method.
- Notes:
  - There are scenarios where the date of this event is before the date of the marketStart, this can happen when the strategy requires historical data and Gekko was able to load some from disk (this process bypasses the market).
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

### stratUpdate event

- What: An object describing an updated candle the strat has processed.
- When: when the strategy is initialized is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processStratStart` method.
- Notes:
  - This event is guaranteed to happen before any possible advice of the same candle, this can happen when the strategy uses async indicators (for example from TAlib or Tulip).
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

### marketStart event

- What: A moment object describing the first date of the market data.
- When: When the market is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketStart` method.
- Example:
      [moment object describing the date of the first market data]

### marketUpdate event

- What: A moment object describing the point in time for up to which the market has market data.
- When: Every few seconds.
- Subscribe: Your plugin can subscribe to this event by registering the `processMarketUpdate` method.
- Example:
      [moment object describing the date of the latest market data]

