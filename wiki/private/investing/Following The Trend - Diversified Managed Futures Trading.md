The core of this page comes from the book [Following the Trend](https://www.amazon.it/Following-Trend-Diversified-Managed-Futures/dp/1119908981) by Andreas F. Clenow

Complementary notes, deep dives and references were added by <a href="" target="_blank">me</a> while reading the book.

Feel free to reach out to <a href="https://www.linkedin.com/in/giacomo-maggiore-499994263/" target="_blank">me</a> with any comments, clarifications, or corrections.

---

## Chapter 1: Cross-asset trend following with futures

We firstly spend some time to introduce and define futures contracts.

A <b>futures contract</b> is a standardized legal agreement to buy or sell a specific asset (underlying) at a predetermined price on a set date (delivery date) in the future.

In the futures market, exchanges set contract sizes, qualities, delivery dates and locations, so trades occur transparently and not OTC on organized exchanges (CME Group, ICE, Eurex). _On the other hand,_ <b>forward contracts</b> or OTC derivatives can have similar characteristics but are traded over the counter as private, customizable and bilateral agreements without a settlement house or a central exchange.

The most important thing when entering a futures contract is that the trader doesn't have to <b>pay the full contract</b> upfront; he only posts an <b>initial margin</b> _(typically 2 to 12% of the total underlying value)_ and then accounts are <b>settled daily</b>, _i.e._ profits or losses from the contract are credited or debited every day rather than waiting for expiration.

$$
\text{Daily PnL}_{\text{Long}} = (F_t - F_{t-1}) \times \text{Contract Size}
$$

$$
\text{Daily PnL}_{\text{Short}} = (F_{t-1} - F_t) \times \text{Contract Size}
$$


Furthermore, while holding a futures contract, the trader must have a <b>maintenance margin</b>, i.e. a minimum equity balance that must remain in the margin account. In the case this is violated, _usually_ a <b>margin call</b> is opened and either additional deposits are requested or the position is liquidated.

At delivery date T, the futures price F_t converges to the prevailing spot price S_T = F_t, and so the cumulative profit or loss realized relative to the initial entry futures price F_0 is completely linear.

$$
\Pi_{\text{long}} = S_T - F_0
$$

$$
\Pi_{\text{short}} = F_0 - S_T
$$

<b>Futures Pricing Model: the cost of carry framework</b>
Futures prices are derived via the <b>no-arbitrage pricing principle</b>, _i.e._ the relationship between the spot price S_0 and the futures price F_0 is governed by the <b>cost of carry</b> (c) that takes into account financing costs, storage costs and income yields.

_In particular,_ for an asset with no holding costs or cash flows _(i.e. non-dividend-paying stocks, gold as an investment, etc.)_ the fair futures price under continuous compounding is

$$F_0 = S_0 e^{rT}$$

where S_0 is the current spot price, r the annualized risk-free rate and T the time to maturity.

_Indeed,_ if F_0 > S_0 e^{rT}, an investor executes a <b>cash-and-carry arbitrage</b> by borrowing cash at rate r, buying the spot asset at S_0 and shorting the futures contract at F_0.

_Similarly,_ if the asset yields a <b>continuous income</b> _(a stock with dividend yield q)_, we have that

$$F_0 = S_0 e^{(r-q)T}$$

or, for some <b>discrete income</b> with present value I, we have

$$F_0 = (S_0 - I)e^{rT}$$

For <b>physical commodities</b>, in the presence of <b>storage costs</b> \mu or <b>convenience yield</b> y _(the benefit of holding physical inventory during supply disruptions)_, both expressed as continuous rates, we have

$$F_0 = S_0 e^{(r + \mu - y)T}$$

<b>The Term Structure: Contango vs Backwardation</b>

The relationship between spot prices and futures prices across different maturity dates brings us to the <b>futures curve term structure</b>, where we can distinguish 2 different market regimes.

- <b>Contango</b>: F_0 > S_0 _(upward-sloping curve)_, when the carrying costs exceed the benefit of holding the asset (r + \mu > y), common in well-supplied commodity markets.
- <b>Backwardation</b>: F_0 < S_0 _(downward-sloping curve)_, with high convenience yield (y > r + \mu) caused by immediate inventory shortages or high demand.

<div align = "center">
![Bias variance tradeoff](/images/notes/third-semester/contango.png)
</div>

<br/>
<b>Hedging Applications and Optimal Hedge Ratio</b>

We firstly recall that hedging is implemented to <b>reduce/remove</b> an unwanted risk so that the outcome is more predictable. Note that hedging is not meant to make money; think of hedging as "insurance", where you give up some upside to limit the downside.

<b>Cross-hedging</b> happens whenever there are no futures contracts on the exact asset we want to hedge because, _for example,_ there's no futures market, the contract doesn't match the exposure in size, location, or quality, it is not liquid enough or, _in the case of portfolio-level hedging,_ we cannot hedge each stock's position.


In this case, we can offset price volatility in the underlying cash market position by minimizing the portfolio variance to obtain the <b>optimal hedge ratio</b>.

$$
h^* = \rho_{SF} \left( \frac{\sigma_S}{\sigma_F} \right)
$$

where \rho_{SF} is the correlation coefficient between spot price changes \Delta S and futures price changes \Delta F, and \sigma_S and \sigma_F are the corresponding standard deviations.

To derive the previous h^*, consider the situation of a trader holding 1 unit of the spot asset and shorting h units in futures.

The change in the portfolio is then

$$\Delta V = \Delta S - h \Delta F$$

and we want \Delta V to be as stable as possible, so we minimize its variance:

$$\operatorname{Var}(\Delta V) = \sigma_S^2 + h^2\sigma_F^2 - 2h\operatorname{Cov}(\Delta S, \Delta F)$$
$$= \sigma_S^2 + h^2\sigma_F^2 - 2h\rho\sigma_S\sigma_F$$

and, since this is convex in h, we can set the derivative to zero:

$$\frac{d\operatorname{Var}}{dh} = 2h\sigma_F^2 - 2\rho\sigma_S\sigma_F = 0$$
$$\Longrightarrow h^* = \frac{\rho\sigma_S\sigma_F}{\sigma_F^2} = \rho \left(\frac{\sigma_S}{\sigma_F}\right)$$

If we plug h^* back into the variance, we obtain the minimum variance as

$$\operatorname{Var}_{\min} = \sigma_S^2(1 - \rho^2)$$


Once we have the optimal hedge ratio, we can calculate the <b>optimal number of contracts</b>.

Consider a portfolio with value V_A and V_C = F_0 \times Q, the dollar value of one futures contract.

Consider then the P&L of the portfolio, defined as \Delta V_A = V_A r_A, and the P&L of the short futures position, Q \Delta F.

If we are short N contracts on the futures, we have, using \Delta F = F_0 r_F:

$$-N Q \Delta F = -N Q F_0 r_F = -N V_C r_F$$

We now consider \Delta V_{\text{hedged}}, the P&L of the hedged portfolio:

$$\Delta V_{\text{hedged}} = V_A r_A - N V_C r_F$$

Also, we have h = N V_C / V_A and $\Delta V_{\text{hedged}} = V_A\,(r_A - h\,r_F)$.

If we now solve for N, we get:

$$N^* = h^*\,\frac{V_A}{V_C} = h^*\,\frac{V_A}{F_0\,Q}$$

Note that, in the case h = 0, there's no hedge and the investor gets full r_A. If h = 1, the futures notional equals the portfolio value, so the investor is offset if r_A \approx r_F.

----


Most futures managers have done the same since 1970: trend following => the idea is very simple: use software to identify trends in a large set of futures markets and enter the trends and follow them as long as they last.
=> in theory, even if they use sophisticated software/algorithms, the theory is pretty simple and the strategies are not difficult to replicate in theory _(but often not so easy to replicate in reality)_

The basic idea is that you never buy at the bottom and never sell at the top, but the idea is about buying high and selling higher or shorting low and covering lower => you take the profits between the highest and lowest moment.

The assumption is that financial markets tend to move in trends (perhaps not all the time and not even most of the time) => when markets are moving sideways => trend following is not profitable

Trend following on a single instrument is quite often a useless and very expensive exercise => any single instrument can have very long periods where this does not work.
Furthermore, trading on a single market or a few markets means taking too large bets.

With diversified futures strategies:
- large baskets of instruments to trade
- covering all major asset classes
- making each bet in itself almost insignificant =>
- most trend following strategies lose but... the idea is to gain more than what you lose on average

Why diversified futures trends? And why equities and bonds are not enough
- equities as an asset class have very high internal correlation => they move together  => diversification breaks up in market distress
- equities move up in the long run... but maybe we cannot afford drawdown periods

In contrast, managed futures usually show no correlation with equities and higher annualized compounded return and lower drawdown

![[Pasted image 20261025151449.png]]
---

### Criticism of trend-following strategies
- survivorship bias => some strategies did not survive or were closed => but this is only true if we look at the performance of current S&P 500 companies
- high leverage makes the strategy too risky (but leverage and risk are not necessarily related)
- trend following needs to short => if you short you have unlimited downside risk => but... you can only lose what you put on the table => so your loss is potentially unlimited if you have unlimited margin capital => this is not the case
- managed futures funds have large and long drawdowns => but this is true for equities too (-55% for MSCI World in 2008)

Note that:
- managed futures strategies are scalable since there is no downside in sharing the signal
- you often need a large capital base to start trend-following trading => so aggregating resources and not trading from your private room makes sense

Two main paths for building a futures trading business:
- managed accounts => clients give power of attorney to trade
- hedge fund => one big account for all clients => simplifies the business side but requires more legal structure

But... if you are trading someone else's money: you need a good pitch, and good story to point out a clear picture of what the fund does and why it could work (how risk and return profile are, backtest, which returns are we targeting and so on) => work on presentation and marketing to...

Pay attention not only to overall returns but in particular to drawdowns and volatility => "volatility is the currency used to buy performance."

Use both Sharpe and Sortino ratios (the Sortino ratio penalizes volatility only on the downside or below a required rate of return).

---


## Chapter 2: Futures data

With equities, if you buy some stocks quoted in USD but you do not earn or spend in USD, you are exposed both to the stock and the currency => the return depends both on the performance of the stock and the currency. => so your return depends both on buying and selling forex.

With futures, the situation is different.

When you open a futures position => no money changes hands except for commission fees.
Since no money changes hands on initiation of the position, you have much less foreign exchange risk => your return depends only on the currency exchange when you close the position.

Suppose that you are CHF-based.
- at t = 0 you buy 10 contracts of 10 Nasdaq futures for 2,000 USD with exchange rate 1.56
- you close the position at t = 1 by offsetting contracts at a price of 1,834 USD
- you lose 166,000 USD => 166 basis points times the point value (in the case of Nasdaq, this is 100) times the number of contracts
- the exchange rate at t = 1 is 1.44
- so your loss in CHF is more or less 115,300 => the exchange rate at opening has no impact

The currency exposure is not on the position => but only on the P&L and varies day by day => it is both difficult to hedge and more impactful because it cannot change the direction/sign of the P&L.

Open interest for a contract => the number of people actively trading it
- most people in futures trading roll their positions => so open interest oscillates month to month => people switch from one contract to another (longer expiry) as time goes on
- as a futures trader => you need a clear rule to switch from one contract to another (common methods are based on volume and/or open interest)

![[Pasted image 20261025164357.png]]

Note that we often see volume spikes between months.
![[Pasted image 20261025164413.png]]
TERM STRUCTURE

Term structure or yield curve refers to the shape of the curve if you plot x = delivery month and y = futures price.

![[Pasted image 20261025164439.png]]
In the normal case, the price goes up in each successive month.
- UPWARD SLOPE => CONTANGO
- DOWNWARD SLOPE => BACKWARDATION

Why are the prices higher further in the future?
Think about the cost of hedging the position.
The fair price of any position is the cost of hedging.

So suppose we want to buy 100 kg in the future. The cost of hedging is the price of that gold + the cost of storage => so the futures for longer months will be more expensive.

For financial futures there's no physical storage cost => so the interest rate is the main driver of the term structure:
- less steep curve for financial instruments than for deliverable ones
- commodities with strong storage costs => stronger Term structure

Backwardation is usually caused by seasonality, interest-rate conditions or an unusual storage-cost situation (not common for soft and perishable commodities).

BASIS GAPS

Current prices of two contracts with the same underlying but different delivery dates will always be different => this is the basis gap.

The reason for the discrepancy comes primarily from hedging (carry) costs. => this also creates a problem if we are creating continuous time series for long-term simulations using futures, since we cannot simply put one contract price series after another.

So we need to adjust the data. There are several ways to do it and the outcome is almost the same, but... a common method:
- identify the liquid contracts based on open interest and link the contracts together so that the old contract's close matches the new contract's close on the rollover date, keeping any gap at that time => however, note that these continuations are not real and are not tradable instruments (not real price movements).

However, we should be aware of this in:
- backtesting since prices can be slightly different
- this hides rollover costs


## Futures sectors

- AGRICULTURAL COMMODITIES => lots of different products, from coffee and cotton to lean hogs or livestock, making it a very large supermarket.
	- internal correlation is not particularly high
	- all affected by inflation to some degree
	- volatility can vary a lot, each contract is driven by fundamental developments and adverse weather and seasonality play a big role
	- news plays a big role
	- exchanges have so called limit rules => maximum price change in a single day
	- all futures are in theory deliverable => for actual trading this is only an impossible theoretical scenario because most brokers do not allow this
	- in agricultural commodities small players have a big advantage since there are a lot of less liquid instruments with low correlation => liquid enough for trading accounts with a few tens of million, but the big players cannot get profits because of their size
- NON-AGRICULTURAL COMMODITIES
	- dominating theme is oil and its products
	- highly volatile
	- has high correlation with each other and they are prone to long term trends and well suited for a diversified futures trend following
	- Henry Hub (HH) natural gas is an interesting instrument since it is not usually highly correlated
	- for natural gas: contango is very large since it is very expensive to store
	- GOLD: value of gold is largely psychological and political since it does not have a lot of industrial application. It is usually seen as a store of value and protection against inflation, deflation, wars, riots and zombie attacks. Similarly, copper and silver have high correlation with gold and more industrial use
- CURRENCIES: when you enter a currency future, you are long on a currency and short another. The currency market is the most liquid in the world. CTA funds tend to have large portions of their funds in currencies.
	- most of the currencies are against the USD (if only one currency is named, it is against the USD)
- EQUITIES: largest futures market. large correlation because the individual cash equities have high internal correlation.
	- the unit used for equity index futures is POINTS on the relevant index.
		- if you buy 5 contracts at 100 and sell them at 110 and the point value is 10, the gain is (110 - 100) x 5 x 10 x 1 = 500
- RATES: far left of the yield curve has always lower volatility than the far right since these instruments have much lower duration => less interest rate risk.
	- how to get the underlying contract value: consider for example Eurodollar, based on three months US dollar LIBOR.
			- notional of this contract is USD 1 million and it is quoted as
			$$\text{Futures Price} = 100 - \text{Annualized Rate}$$
			- Because the contract represents a **3-month (quarterly)** period rather than a full year, the standard $1,000,000 notional must be adjusted:
					 Annual Notional: $\$1,000,000$
			- Convert to Percentage Points: Divide by $100$ (since quotes are in index points like 98.00).
			- Adjust for the Quarter: Divide by $4$ (since it covers a 3-month period, or 1/4 of a year)
$$\text{Point Value} = \frac{\$1,000,000}{100 \times 4} = \frac{\$1,000,000}{400} = \mathbf{\$2,500 \text{ per full 1.00 point}}$$
			- **Basis Point Value (BPV):** Since 1 full point equals 100 basis points ($0.01$), the value of a single basis point is:

$$\frac{\$2,500}{100} = \mathbf{\$25 \text{ per basis point (bp)}}$$

If you hold a **long position** and the contract price moves from **98 to 99**:
- **Price Change:** $+1.00 \text{ full point}$ (which is equivalent to a 100 bps drop in the underlying interest rate)
    $$\text{P\&L} = 1.00 \text{ point} \times \$2,500\text{/point} = \mathbf{\$2,500}$$


---


## Chapter 3: Constructing diversified futures trading strategies

Note that there's a huge difference between understanding how to build a successful strategy and having the ability to thrive and the willpower to make it profitable in reality.

Note that if you plot major managed futures performance in a time series:
- on an absolute value (unadjusted) they can look different
- but if you scale/normalize for volatility => they all look the same
![[Pasted image 20261026195658.png]]
===> they are all doing the same thing!

---

Which asset universe should we trade? There's always a trade-off between number of markets and complexity of the strategy.
- more markets increase diversification and create more opportunities
- the exact number should depend on simulation and match risk tolerance
![[Pasted image 20261026195857.png]]
![[Pasted image 20261026195920.png]]
POSITION SIZING
Before any trading rules => you need a decent and concrete position-sizing formula.
Since different futures, depending on the underlying, show different volatility and therefore risk => we want to take the volatility of each instrument into account when deciding how many contracts to buy/sell => most importantly, never put the same notional dollar amount in each trade.

The most common method is:
- take larger positions of less volatile assets with the aim of having each position theoretically capable of making the same bottom line profit/loss impact on the strategy
In practice, we can define a strategy called AVERAGE TRUE RANGE. It aims to measure how big a normal daily move is for each instrument and use it as a starting point for position sizes.

$$TR_t = \max(H_t, C_{t-1}) - \min(L_t, C_{t-1})$$

where H_t, L_t, and C_{t-1} are today's high, today's low, and yesterday's close => so we arrive at the range in which we have been trading today.
Then, for each day, we take the average of all TR_t. Some common options include exponential smoothing.

The idea is that it provides not only a comparable number to standardize position sizes, but also an estimate of how large a move we can expect in a day.

We then use this information to set a target impact of the position on the portfolio. The target impact will then become the leverage factor that we can scale up and down to shift the risk level.

Example: consider an initial risk factor of 20 basis points, so the theoretical average daily impact of each position should be 0.2%.
Consider a portfolio of 1 million USD, so 0.2% translates to 2,000 USD.
Suppose also we receive a buy signal on gold and the ATR (average true range) for gold at that time is 10 USD.
Assuming that gold contract has a point value of 100 => each contract has a theoretical impact of USD 1000.
So, given our 2,000 USD target => we buy 2 contracts.
(Note that we used the term theoretical because volatility is not stationary and can change dramatically while holding the position)

Another formula is:

$$\text{Contracts} = \frac{0.022 \times \text{Equity}}{\text{ATR}_{100} \times \text{Point value}}$$

Note that you could use volatility instead of ATR to estimate position sizing.

Furthermore, some hedge funds use margin-to-equity as their position sizing and risk measurement. In this case, the exchange sets the margins of each futures market based primarily on the exchange's view of volatility to minimize the risk of default by market participants. Then the hedge fund uses this as a basis, for example taking 0.5% of equity risk for each position, where equity is the full account value.

Looking at trend strategies, there are two common methods:
- buying positive breakouts and short negative breakouts (you need to figure out what is a breakout)
- use a classic trend indicator (moving average) and enter on different crossover rules => the simplest example is to plot a moving average and then buy if the price crosses above it and short when it crosses below.
Often, a filter rule that allows you to enter the market only when it is in a bullish phase, and vice versa for short positions, is added on top.
=> you want to avoid going accidentally against a strong trend just because of a short-term counter move
=> a good way is to combine two layers of trend measurement of different time horizons (200-day moving average and a shorter one for trend entry signals)

## Chapter 4: Two basic trend-following strategies

We now present 2 different trend-following strategies. Note that, even if they rely on different indicators, they can be combined and work better together.

<b>Moving Average</b>

The basis of this strategy is the moving average, i.e. the average price of the underlying in the last x days. _In particular,_ we consider 2 moving averages with different depths for the lookback period, so that we have a fast and a slow moving average.

(We can use different moving averages; the most common ones are the exponential ones over 50 and 100 days.)

The strategy goes both long and short and it is always in the market, i.e. for every asset in the asset universe (every futures contract), we are either long or short.
The strategy is run on daily data and always trades the day after to prevent look-ahead bias.

The logic is very simple: if the faster moving average is above the slower moving average, the trend is up, so we go long.

The second strategy (breakout strategy) is still very simple: if today's closing price is higher than or equal to the highest close in the past 100 days => we buy the following day. Similarly, if the price is below or equal to the lowest close of the past 100 days => we sell at the open tomorrow and go short.

To get out of the position: a long trade is closed when the close reaches the lowest point in 50 days, and a short trade is covered when the price makes a 50-day high (always the day following the signal).
(Note that this strategy doesn't have to be always in the market.)

These strategies are quite uncorrelated with the MSCI world (and in general with equities):
- when equities skyrocket... well, there's nothing we can do: the strategies suck in comparison
- but the true value of these strategies is providing uncorrelated returns

Also, note that the correlation between these two strategies has been fairly positive and they have low correlation to the stock market.

The two strategies are more volatile than the benchmarks and show larger numbers in both return and risk (volatility).
But note that volatility itself is not a risk, as it can be scaled up/down with the position-sizing factor.

Furthermore, note that the Sharpe ratio is not a meaningful metric here because it
- takes upward volatility into account as well => so for this we can use the Sortino ratio
- we are dealing with leverage trading

COMBINING THE STRATEGIES

The moving average strategy has the problem that it is always in the market, even if there's not really a trend, so when there's sideways movement the strategy tends to enter and go out after some time, losing each turn.

Conversely, the breakout strategy has the same problem: since it will enter the market after seeing the highest/lowest price, it has the tendency to go against the main market trend at times.

The idea to solve both problems is to apply a trend filter to make sure we only trade in the correct direction of the main trend.
We can indeed use the moving average for trend filtering and then use the breakout strategy.

To sum up, we could summarize everything with:


Broad universe of futures markets traded, across all major sectors.
Trading daily.
Trend is considered bullish if EMA 50 is above EMA 100.
Trend is considered bearish if EMA 50 is below EMA 100.
Enter long on a new 100-day high if the trend is bullish.
Enter short on a new 100-day low if the trend is bearish.
Exit long if the price falls to a 50-day low, or the trend turns bearish.
Exit short if the price rises to a 50-day high, or if the trend turns bullish.
Position sizing uses a 20-day ATR with a target of 15 basis points.

CASH MANAGEMENT

Interest rate is a very important factor in futures trading since, when dealing with futures, we do not need cash for our positions. We just need enough cash on the books to cover the initial margin and to avoid risking margin calls.
Note that when holding cash in a bank, we face counterparty risk, so we should carefully think about how to hold cash.

An alternative is to stick with government debt of top-tier countries, preferably in your own currency.