

*Return stacking is a nicer, more tangible way of saying, “juice up your returns with some leverage”.*

---

## **Baseline**

The key idea of the model portfolio is stolen from Nicola Protasoni in https://theitalianleathersofa.com/model-portfolio/, which, in contrast, takes inspiration from: https://www.rcmalternatives.com/2021/09/what-is-return-stacking/

Protasoni's model (theoretical) portfolio:
- 60% stocks (via NTSX)
- 40% bonds (via NTSX)
- 20% trend (via DBMF)
- 10% commodities trend (via COM)
- 4% tail risk (via TAIL)
- -34% cash


---

## What if I don't want too much US? (especially now)

Note that NTSX (traded in USD, TER: 0.20%) is a unique ETF that, through the use of futures, achieves a leveraged allocation such that, for every $1 invested, it allocates:
- 90% US equities
- 60% Treasury bonds

Eventually, the global equivalent of NTSX is NTSG (traded in EUR, TER: 0.25%) that allocates:
- 90% to global equities
- 60% to global bonds

Therefore, to achieve 60% stocks, we need a 66% investment in NTSX. In this way, the (fictional) allocation of the portfolio sums up to 100% (but it hides the implied leverage in NTSX).

---

Additional important facts:
- To avoid model risk, consider using different ETFs for the same diversifier.
- Using IBKR's leverage allows one to go beyond the implied leverage used by NTSG.

---
### Which ETFs should I use?

Given the large amount of ETFs described in [return-stacking-deep-dive](return-stacking-deep-dive.md), which one should I do?

The idea is to select relevant asset classes (in case data is present: cluster them to obtain 5/6 asset classes; otherwise, rely on research):
- For each asset class => one or more ETFs
- Portfolio optimization on https://testfol.io/ using both:
	- minimize drawdown
	- max Sharpe
	- or some other metric to reduce risk

---

NTSX covers US equities and bonds, but for a European/Swiss investor (or, in general, for whoever doesn't want such an American concentration), it is not optimal.

Therefore, some alternatives:
- Diversify NTSX with NTSI (developed markets large caps) and NTSE (developing markets), but be careful that for all of them the bond (futures) component is US treasuries.
- NTSG follows the same logic as NTSX but with global equities and bonds; however, it applies an ESG filter (why???) and a 0.25% TER.
- RSSB covers 100% global equities and 100% US treasuries, but... with higher TER (0.36%) and higher tracking error.
- Ideally => one could diversify global exposure by combining the three ETFs from the NTS* family (but this requires manually balancing them periodically and it may not be optimal for a small investor with low capital and time) => furthermore, the model portfolio is already full of ETFs and it is not as simple as possible => when possible, keep the complexity low => for this reason, I choose not to proceed in this way.
- Use only NTSG => doable and okay; the only thing I don't like is the ESG filter!!!
- RSSB => higher TER, but also higher AUM compared to NTSG (510 vs 94 million)
- Ideally => we want a combination of both, but... for the moment I think that I'll stick to NTSG only.

---

OK, maybe I changed my mind; I don't mind the idea of having a higher stock allocation:

So the idea is to keep the 35% fixed to:
- 20% trend (via DBMF)
- 10% commodities trend (via COM)
- 4% tail risk (via TAIL)

And then use the remaining 65% to allocate stocks and bonds => eventually: I can also go leveraged with that part.


=> maybe... acccording to this https://www.returnstacked.com/what-is-return-stacking-for-diversification/: could make sense to add gold in small % to the portfolio
=> but i should better deep dive the role of gold inside portfolio diversification
i could also use:
- GDE (0.9 large cap us equities + 0.6 gold)
- RSSX (1 large cap us equities + 0.8 gold + 0.2 btc)

Resources (that I have actually used!)
https://theitalianleathersofa.com/tail-risk-a-quick-guide/
https://theitalianleathersofa.com/model-portfolio-enhancements/
https://theitalianleathersofa.com/model-portfolio-enhancements-update/
https://theitalianleathersofa.com/ntsg-wisdomtree-global-efficient-core-etf/
https://youtu.be/MjmT7RleJUI?si=v7-e3ykq_s3KUebl
https://www.ch.vanguard/en/professional/vanguard-365/understanding-stock-bond-correlations

https://www.returnstacked.com/what-is-return-stacking-for-diversification/

![[Pasted image 20260918112653.png]]


###

