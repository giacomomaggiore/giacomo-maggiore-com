

*Return stacking is a nicer, more tangible way of saying, “juice up your returns with some leverage”.*

---

##  **Baseline**

Key idea of the model portfolio is stolen from Nicola Protasoni in https://theitalianleathersofa.com/model-portfolio/ which, in contrast, takes inspiration from: https://www.rcmalternatives.com/2021/09/what-is-return-stacking/

Protasoni's model (theoretical) portfolio:
- 60% stocks (via NTSX)
- 40% bonds (via NTSX)
- 20% trend (via DBMF)
- 10% commodities trend (via COM)
- 4% Tail risk (via TAIL)
- -34% cash

---

## What if I don't want too much US? (especially now)

note that NTSX (traded in DOL, ter: 0.20%) is a unique ETF that, through the use of futures, achieve a leveraged allocation that, for every 1$ invested, allocates:
- 90% US equities
- 60% Treasury Bond
Eventually, the global equivalent of NTSX is NTSG (traded in EUR, ter: 0.25) that allocates:
- 90% to global equities
- 60% to global bonds

Therefore, to achieve 60% stocks, we need a 66% investments in NTSX. In this way, the (fictional) allocation of the portfolio sums up to 100% (but it hides the implied leverage in NTSX).

---

Additional important facts:
- to avoid model risk, consider using different etfs for the same diversificator
- using IBKR's leverage allows to go beyond the implied leverage used by NTSG
---
### Which ETFs should I use?

Given the large amount of ETFs described in [passive-investing/return-stacking-deep-dive](passive-investing/return-stacking-deep-dive) which one should i do?

the idea is to relevant asset classes (in case data is present: cluster them to obtain 5/6 asset classes, otherwise rely on reseearch):
- for each asset class => one or more etfs
- portfolio optimization on https://testfol.io/ using both:
	- minimize drawodn
	- max sharpe
	- o some other metric to reduce risk

---

NTSX covers us equities and bonds that, for a european/swiss investor (or in general for whoever doesn't want such an american concentratoin) it is not optimal.

Therefore, some alternatives:
- Diversify NTSX with NTSI (developed markets large caps) and NTSE (developing markets) but be careful that for all of them the bond (futures) componend is US treasuries
- NTSG same logic of NTSX but with global equities and bond but... it applies a ESG filter (why???) and a 0.25% TER
- RSSB covers 100% global equities and 100% us treasuries but... with higher TER (0.36%) and higher tracking error
- Ideally => one could diversify global exposure combining the three etfs from NTS* family (but this requires manually periodically balancing and it may not be optimal for small investor with low capital and time) => furthermore, the model portfolio is already full of etds and it is not the simplest as possible => when possible, keep the complexity low => for this reason, I choose not to proceed on this way
- Use only NTSG => duable and ok, the only I don't like is the ESG filter!!!
- RSSB => higher ter but also higher aum compared to NTSG (510 vs 94 millions)
- Ideally => we want a combination of both but... for the moment I think that I'll stick to NTSG only


---

ok maybe i changed by mind, i don't mind the idea of having a higher stock allocation:
so the idea is to keep the 35% fixed to:
- 20% trend (via DBMF)
- 10% commodities trend (via COM)
- 4% Tail risk (via TAIL)
and then using the remaining 65% to allocate stock and bonds => eventually: i can also go leveraged with that part. 

Resources (that i have actually used!)
https://theitalianleathersofa.com/tail-risk-a-quick-guide/
https://theitalianleathersofa.com/model-portfolio-enhancements/
https://theitalianleathersofa.com/model-portfolio-enhancements-update/
https://theitalianleathersofa.com/ntsg-wisdomtree-global-efficient-core-etf/
https://youtu.be/MjmT7RleJUI?si=v7-e3ykq_s3KUebl
https://www.ch.vanguard/en/professional/vanguard-365/understanding-stock-bond-correlations