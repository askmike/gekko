# Events

As described in the [architecture](./architecture.md) events play a key role in the complete system: they relay all information between seperate components (like plugins). This makes the codebase scalable, testable and it seperates concerns.

if you run the Gekko UI events are relayed between core components as well as broadcasted (via the UI server) to the web UI. This means that all events broadcasted by any plugin automatically end up in the web UI.

Note that all events from Gekko come from a plugin (with the exception of the `candle` event, which comes from the market), and no plugin is required for Gekko to run, this means it might be possible that some events are never broadcasted since their originating plugin is not active. If a plugin wants to listen to an event that will never be broadcasted (because of a lack of another plugin) this will be warned in the console like so:

    (WARN): Paper Trader wanted to listen to the tradingAdvisor, however the tradingAdvisor is disabled.

*NOTE: Events describe async communication about what is happening, it's hard to guarentee the proper order of events during backtests which pipe in historical candles as fast as the plugins can consume them. Stabalizing this is a work in progress but expect things to break until proper behaviour has been validated under a variaty of platform circumstances (OS, hardware, etc).*

## List of events emitted by standard plugins

- [candle](#candle-event): Every time Gekko calculas a new one minute candle from the market.
- [stratUpdate](#stratUpdate-event): Every time the strategy has processed new market data.
- [stratWarmupCompleted](#stratWarmupCompleted-event): When the strategy is done warming up.
- [advice](#advice-event): Every time the trading strategy has new advice.
- [tradeInitiated](#tradeInitiated-event): Every time a trading plugin (either the live trader or the paper trader) is going to start a new trade (buy or sell).
- [tradeCompleted](#tradeCompleted-event): Every time a trading plugin (either the live trader or the paper trader) has completed a trade.
- [tradeAborted](#tradeAborted-event): Every time a trading plugin (either the live trader or the paper trader) has NOT acted on new advice (due to unsufficiant funds or a similar reason).
- [portfolioChange](#portfolioChange-event): Every time the content of the portfolio has changed.
- [portfolioValueChange](#portfolioValueChange-event): Every time value of the portfolio has changed.
- [performanceReport](#performanceReport-event): Every time the profit report was updated.
- [roundtrip](#roundtrip-event): Every time a new roundtrip has been completed.

Beside those there are also two additional market events that are only emitted when Gekko is running in either realtime or importing mode (NOT during a backtest for performance reasons).

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

### stratUpdate event

- What: An object describing an updated candle the strat has processed.
- When: when the strategy is initialized is started.
- Subscribe: Your plugin can subscribe to this event by registering the `processStratUpdate` method.
- Notes:
  - This event is not guaranteed to happen before any possible advice of the same candle, this situation can happen when the strategy uses async indicators (for example from TAlib or Tulip).
- Example:
      {
        date: [moment object of the start time of the candle],
        indicators: {
          mymacd: [number, result of running this indicator over current candle]
        }
      }

### stratWarmupCompleted event

- What: An object signaling that the strategy is now completely warmed up
and will start signaling advice.
- When: Once the strategy consumed more market data than defined by the required history.
- Subscribe: Your plugin can subscribe to this event by registering the `processWarmupCompleted` method.
- Notes:
  - This event is triggered on init when the strategy does not require any history (and thus no warmup time).
- Example:
      {
        start: [moment object of the start time of the first candle after the warmup],
      }

### advice event

- What: An object containing an advice from the strategy, the advice will either be LONG or SHORT.
- When: This depends on the strategy and the candleSize.
- Subscribe: Your plugin can subscribe to this event by registering the `processAdvice` method.
- Example:
      {
        recommendation: [position to take, either long or short],
        date: [moment object of this advice]
      }

### tradeInitiated event

- What: An object singaling that a new trade will be executed.
- When: At the same time as the advice event if the trader will try to trade.
- Subscribe: Your plugin can subscribe to this event by registering the `processTradeInitiated` method.
- Example:
      {
        id: [number identifying this unique trade]
        action: [either "buy" or "sell"],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio]
      }

### tradeAborted event

- What: An object singaling the fact that the trader will ignore the advice.
- When: At the same time as the advice event if the trader will NOT try to trade.
- Subscribe: Your plugin can subscribe to this event by registering the `processTradeAborted` method.
- Example:
      {
        id: [number identifying this unique trade]
        action: [either "buy" or "sell"],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio],
        reason: "Not enough funds"
      }

### tradeCompleted event

- What: An object containing details of a completed trade.
- When: Some point in time after the tradeInitiated event.
- Subscribe: Your plugin can subscribe to this event by registering the `processTradeCompleted` method.
- Example:
      {
        id: [number identifying this unique trade]
        action: [either "buy" or "sell"],
        price: [number, average price that was sold at],
        cost: [ideal execution cost - ],
        date: [moment object, exchange time trade completed at],
        portfolio: [object containing amount in currency and asset],
        balance: [number, total worth of portfolio]
      }

### portfolioChange event

- What: An object containing new portfolio contents (amount of asset & currency).
- When: Some point in time after the advice event, at the same time as the tradeCompleted event.
- Subscribe: Your plugin can subscribe to this event by registering the `processPortfolioChange` method.
- Example:
      {
        currency: [number, portfolio amount of currency],
        asset: [number, portfolio amount of asset]
      }

### portfolioValueChange event

- What: An object containing the total portfolio worth (amount of asset & currency calculated in currency).
- When: Every time the value of the portfolio has changed, if the strategy is in a LONG position this will be every minute.
- Subscribe: Your plugin can subscribe to this event by registering the `processPortfolioValueChange` method.
- Example:
      {
        value: [number, portfolio amount of currency]
      }

### performanceReport event

- What: An object containing a summary of the performance of the "tradebot" (advice signals + execution).
- When: At the same time as every new candle.
- Subscribe: Your plugin can subscribe to this event by registering the `processPortfolioValueChange` method.
- Example:
      {
        value: [number, portfolio amount of currency]
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

