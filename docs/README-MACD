Moving Average Convergence Divergence

See:
http://en.wikipedia.org/wiki/MACD

MACD builds on the EMA indicator by examining the rate of change of the difference 
between the long and short EMA values.

IF 
L=Long EMA 
and
S = short EMA

then MACD = S-L - this is basic EMA analysis.

But we then take the EMA of the MACD value (usually over a shorter period) which is the signal line (S). 
We then finally take the difference between the MACD and S which gives the diff (or divergence).

diff = MACD-S

Indicator points

MACD diff = Signal
MACD (EMA Diff)=0

NOTE: in this implementation, the 2 EMA values are price values 
the difference and MACD/Signal values are calculated as PERCENTAGES.


Config settings
interval - the number of minutes in each candle interval

short, Long, signal - Time coefficients of EMA calculation in candle intervals

Sell, Buy thresholds - Value of MACD-signal before an uptrend or downtrend is recognised.

Persistence - the number of candle intervals a trend needs to exist before a buy/sell is triggered.

verbose - will log a line on each candle calculation giving the various figures, 
          and also indicate when a buy/sell is triggered.
