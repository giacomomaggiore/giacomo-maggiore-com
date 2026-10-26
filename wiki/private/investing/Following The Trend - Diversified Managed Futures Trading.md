The following notes come from the book [Following the Trend](https://www.amazon.it/Following-Trend-Diversified-Managed-Futures/dp/1119908981) by Andreas F. Clenow

---

## Chapter 1: Cross-asset trend following with futures

Most future managers do the same since 1970: trend following => the idea is very simple: use software to identify trends in largr set of future makrets and enter the trends and follow them as long as they last 
=> in theory, even if they use sophisticaded software/algorithsm, the theory is pretty simple and the strategies not difficult to replicate in theory _(but often not so easy to replicate in reality)_

The basic idea is tha you never buy at the bottom and never sell at the top, but the idea is about buying high and selling hifer or shorting low and coverint lower => you take the profits between highest and lowest moment

the assumption is that financial marktes tend to move in trend (perhaps not all the time and not even most of the time) => when makets are moving sidways => trend following is not profitable

trend following on a single instrument is quite often useless exercise an very expensive one => any single instrument can have very long periods where this does not work.
furthermore, trading on a single or few maktes take too large bets.

with diverisifed future strategies:
- large baskets od instrument to trande
- covering all mahor asset classes
- making each bet it itslef almost insigificant  =>
- most trend following strategies loose but... the idea is to gain more than what you loose on average

why diversified trend gutures? and why equities and bond are not enough
- equites as asset class has very high internal correlation => they m,ove togehter  => diversification breaks up in market distress
- equities move up in the long run... but maybe we cannot afford drawodn periods

In contrast, managed futures usually show no correlation with equities and higher annualied compound return and lwoer drawdown

![[Pasted image 20261025151449.png]]
---

### criticism of trend following strategies
- survivorshup bias => some strategies did not surviver of were closed=> but this is only true if we look at the performance of sp500 current companies
- high leverages makes the strategy to risky (but leverage and risk are not necessarly related)
- trend following needs to short => if you short you have unlimited downside risk => but... you can only loose what you put on the table => so your loss is potentially unlimited id tyou have unlimited margin capital => this is not the case
- managed futures funs have large and long drawdowns => but this is true for equities too(-55% for msci world in 2008)

note that:
- managed futures strategies are scalable since no downside in sharing the ignal 
- you often need large capit base to start trend following trading => so aggregating respources and not trading from your private room make sense

two main paths for building a futrue trading business:
- managed accounts => clients give power of attorney to trade 
- hedge account => one big account for all client => simplifies the nusimess side but require more legal structure

but... if you are trading someone else money: you need a good pitch, and good story to point out a clear pifture of what the fund does and why it could work (how risk and return profile are, backtest, which returns are we trgeting and so on) => work on presentation and marketin to...

pay attentio not only to overall returns byt in particular to drawdons and volatility => """volatility is the currency used to buy performance"""

use both sharpe and sortino ratio (punishes volatility only on the down side or below a required rate of return)

---


## Chapter 2 : futures data

With equities, if you buy some stocks quoted in usd but you do not earn/spend in usd, you are exposed both to the stock and the currency => the returns depends both on the perfromnce of the stock and the one of the currency. => so your return depends both on buy and sell forex

With future, the situation is different.

When you open a futures position => no money changes hand except for commodities fee
since no money changes hands on initiation of the posiion you have much less forex exhcnage risk => your return depends only on the currency exchange when you close the position.

suppose tha you are chf based. 
- at t = 0 you buy 10 contrast of 10 nasqad futures for 2000 usd with exchange rate 1.56 
- you close position at t= 1 by osseting confracts at price 1834 usd 
- you olost 166  000 usd => 166 bpoinys time the point value (in the case of nasdaq is 100) times the mumber of contracts 
- the exchange rate at t= 1 is 1.44
- so your loss in chf is moreorelss 115300 )=> exchange rate at opening has no impact

the currency exposure is not on the postion => but only on the p&L and varies day by day => oe difficult to hedge but also m,ore impactful because it cannot change the direction/sign of the p&l

open interest for a cntract => number of people actively trading it
- most of the people in futurs trading roll their position => so open interest oscillates month to month => people switch one contract to the other (longer expire) as timegoes on
- as a future traser => you need a clear rule to swithch from one contrac to another (common methdos are based on volude and/or open interest)

![[Pasted image 20261025164357.png]]

NOTE that we often see volume spikes between months
![[Pasted image 20261025164413.png]]
TERM STRUCTURE

term structure or yield curve refers to the shape of the curve if you plot x = delivery month and y = price of the future.

![[Pasted image 20261025164439.png]]
in the normal case, the price goes up in each successive month.
- UPWARD SLOPE => CONTANGO
- DOWNWARD SLOPE => BACKWARDATION

why are the prices higher further in the future?
think about the cost hedging the position.
the fair price of any position is the cost of heding.

so suppose we want to  100kg in the future. the cost of heding is the price of that gold + the cost of storage => so the future for longer months will be more expensive

for financial futures there's no physicla storage cost => so the inerest rate is the main driver of the term structure because.
- less steep curve for financial indtruments than for deliverable ones
- commodieis with stronger storage cost => strong term structure stage 

backwardation is usuallly caused by seasonality, ir conditions or unusual storage cost situation (not common for soft and perishable commodities)

BASIS GAPS

current price of two contracts with same underlying but different delivereis will be always different => the different basis caps.

the reason for discrepancy comes primarly from hedging (carry) cost. => this also ctrates us a problem if we are creating continuous time series for long term simulations using futures since we cannot simply put one contract price series after the other. 

so we need to adjust data. there are several ways to do it and the outcome is almost the same butt... a common method:
- identify hte liquid contract based on opern interest and link the contracts together so that the old contract's close matche new contract close on rollover date keeping any gap on that time => however note that these continuations are not real and are not tradable instruments. (not real pric emovements)

however, we aware of this in:
- backtesting sicne prices can be slighlty different
- this hides rollover costs 


## future sectors

- AGRICOLTURAL COMMODITIES => lot of different products, from coffee and cotton to lean hogs or livestock making it a very large supermarket. 
	- internal corrrelation is not particulary high
	- all affected by inflation to some degreses
	- volatility can varty a lot, each contract is drvien by fundamental developets and adverse and Ωeather and seasonality play a big role
	- new pla a big role 
	- exhcanges have so called limit srules => maximum price change in a single dat
	- all the future are in theory deliveravle => for actual trading this only a impossible theoretical scenario because ,ost brokers do not allow this
	- in agricoltura commodities small players have big advantage since there a lot of less liquidi instruments with low correlation => liquid enough for tradifing accounts with a fre tens of million but the big players can nnot getprofits because of their size
- NON AGRICOLTURAL COMMODITIES
	- domaninting themre is oli and its products
	- highly volatile
	- high correlation each other and they are prone to long term trends and wel suited for a diversified futures trend following 
	- henry hub (HH) natural gas is interesting instrument since is not usually very high correlated 
	- for natural gas: contanto is very larg since it si very expensive to store 
	- GOLD: value of gold is largely psicological and political since it does not hace a lot of industriak application. is usually seen as a store of value an d protection against inflation deflation, wars riots and zombie attacks. similar: copper and silver with high correlation with gold and more industrial use
- CURRIENCES: when you enter a currency fguture, you are long on a currrency and short the other.   currency market is the ost liquid in the world. cta funds tend to have large position of theri funds in currencies. 
	- most of the currenties are agains the USD (if only one currency is named is against the usd)
- EQUITIES: largest future. large correlation as the single cash equities have high internal correlation.
	- the unit used forequity index futures is POINTS on the relevant index. 
		- if you buy 5 contracts at 100 and sell them at 110 and the point value is 10, the gain is (110 - 100) x 5 x 10 x 1 = 500
- RATES: far left of the ield curve has always lower volatility than the dar rifht since these instruments have much lower duraton => eless interest rate risk.
	- how to get underlying contract value: consider for exampe EURODROLLAR, based on three months US dollar libor.
			- notional of this contract is usd 1 million and it is quoted as 
			$$\text{Futures Price} = 100 - \text{Annualized Rate}$$
			- Because the contract represents a **3-month (quarterly)** period rather than a full year, the standard $1,000,000 notional must be adjusted:
					 Annual Notional: $\$1,000,000$
			- Convert to Percentage Points: Divide by $100$ (since quotes are in index points like 98.00).
			- Adjust for the Quarter: Divide by $4$ (since it covers a 3-month period, or 1/4 of a year)
$$\text{Point Value} = \frac{\$1,000,000}{100 \times 4} = \frac{\$1,000,000}{400} = \mathbf{\$2,500 \text{ per full 1.00 point}}$$
			- **Basis Point Value (BPV):** Since 1 full point equals 100 basis points ($0.01$), the value of a single basis point is:

$$\frac{\$2,500}{100} = \mathbf{\$25 \text{ per basis point (bp)}}$$If you hold a **long position** and the contract price moves from **98 to 99**:
- **Price Change:** $+1.00 \text{ full point}$ (which is equivalent to a 100 bps drop in the underlying interest rate)
    $$\text{P\&L} = 1.00 \text{ point} \times \$2,500\text{/point} = \mathbf{\$2,500}$$