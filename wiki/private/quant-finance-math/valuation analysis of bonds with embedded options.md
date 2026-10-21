# Valuation and Analysis of Bonds with Embedded Options

## Intro

Valuation of fixed-rate, option-free bonds generally requires determining their future cash flows and discounting them.

Valuation becomes complicated when one or more embedded options are present, because the values of embedded options depend on interest rates.

Issuers manage rate exposure with embedded options, such as call provisions.

Investors in callable bonds must consider the risk of being called. This risk is represented by the premium and by an increased coupon/yield compared with that of an identical option-free bond.

## Overview

Embedded options enable their holders to take advantage of interest-rate movements. They can be exercised by the issuer or the bondholder, or they may be exercised automatically, depending on the scenario.

Examples:

- a call option: the issuer can retire the bond and reissue it at a lower cost

- a put option: allows the bondholder to benefit from higher interest rates by putting the bond back to the issuer and reinvesting at a higher yield

---

## Simple Embedded Options

## Callable bonds

A callable bond includes an embedded call option.

The call option is an issuer option, i.e., the issuer has the right to exercise the option and redeem the bond prior to maturity.

(Early redemption usually happens when the issuer has the opportunity to replace a high-coupon bond with one on more favorable terms, typically when interest rates have fallen or when the issuer's credit quality has improved.)

- Until the 1990s, most long-term corporate bonds were callable after either 5-10 years.

    - The initial call price (exercise price) was typically at a premium above par.

- Today, most investment-grade corporate bonds are nonrefundable. They may have a "make-whole call"; i.e., the call price is such that bondholders are compensated for surrendering their bonds.

Most callable bonds have a protection period.

They may also have different types of call features:

 - European-style callable bond: the call can be exercised only once, on the call date.

- American-style callable bond: the bond is continuously callable.

- Bermudan-style call option: the call can be exercised only on predetermined dates on a specified schedule.

Generally speaking, government-sponsored enterprises in the US issue callable bonds with:

- short maturities, 5-10 years

- short protection periods

- Bermudan style

Tax-exempt municipal bonds (usually called munis and considered non-sovereign (local) bonds) are almost always callable at 100%.

## Put options and extension options 

A putable bond is a bond that includes an embedded put option.

The put option is owned by the investor, who has the right to exercise the option by putting the bond back to the issuer prior to maturity, usually at par. (This usually happens when interest rates have risen and higher-yielding bonds are available.)

Another type of embedded option that resembles a put option is an extension option, under which, at maturity, the investor can keep the bond for a number of years after maturity (possibly with different coupons).

    - In this case, the terms of the bond's indenture or offering circular are modified, but the bond remains outstanding.

## Complex embedded options

Other types of bonds with embedded options:

- bonds that are both callable and putable

- convertible bonds (allow bondholders to convert their bonds into the issuer's common stock. Convertible bonds are usually also callable by the issuer; the call provision allows the issuer to take advantage of lower interest rates or to force conversion.)

- options contingent on some events

- sinking fund bond (sinker): the issuer has to set aside funds over time to retire the bond issue, thus reducing credit risk (sinkers may be callable and may include options related to the sinking funds, such as an acceleration provision or delivery options)

    - In particular, in a sinker, the underlying bond has an amortizing structure and may include the following options:

        - standard call above par with declining premiums

        - acceleration provision that allows the issuer to repurchase more than the mandatory amount

        - delivery option that allows the issuer to deliver bonds to the bond's trustee instead of making a sinking fund payment

From the issuer's perspective, the combination of the call option and the delivery options is a "long straddle," an option strategy involving the purchase of put and call options on the same underlying, with the same exercise price and expiration.

    - At expiration, if the price of the underlying is above the exercise price: the put is zero, and the call is ITM.

    - At expiration, if the price of the underlying is below the exercise price: the put is ITM, and the call is OTM.

    So, the straddle benefits the investor when the underlying price moves up or down (the greater the movement, the greater the benefit).

    As a consequence, the sinking fund bond benefits the issuer if interest rates decline or rise.

## Valuation and analysis of callable and putable bonds

The value of a bond with embedded options is the value of the straight bond adjusted for the values of the embedded options. From the investor's perspective, an issuer-owned call is subtracted, while an investor-owned put is added.

For example, for a callable bond, the right to exercise belongs to the issuer, so the issuer is long on the call and the investor is long on the bond but short on the option. Therefore, from the investor's perspective:

$$

V_{\text{callable}} = V_{\text{straight}} - C_{\text{issuer}}

$$

Note that the value of the call option depends on the ability to refinance at lower costs (i.e., when interest rates are lower), so the value of the call option can be calculated as:

$$

C_{\text{issuer}} = V_{\text{straight}} - V_{\text{callable}}

$$

For a putable bond, the decision to exercise is on the investor's side, so the investor has a long position on both the call and the put option. As a consequence, from the investor's perspective:

$$

V_{\text{putable}} = V_{\text{straight}} + P_{\text{investor}}

$$

---

## Valuation of default-free and option-free bonds

We now spend some time remembering how straight bonds are calculated.

Generally speaking, the value of a bond is the present value of its future expected cash flows.

However, the fundamental question is: which discount factor should we use?

- Each cash flow should be discounted at the spot rate corresponding to the cash flow payment. If the spot factors are not directly observable, they can be inferred from available information, usually from market prices of actively traded sovereign bonds of different maturities.

- The prices are transformed into spot rates and then forward rates, thanks to the no-arbitrage condition.

$$

(1 + r_{0,2})^2 = (1 + f_{0,1})(1 + f_{1,2})

$$

## Valuation of default-free callable and putable bonds in the absence of interest rate volatility

When valuing bonds with embedded options, relying on one-period forward rates is a better framework than relying on spot rates, because we need to know the value of the bond at different points in the future to understand whether the option will be exercised.

### Valuation of a callable bond at zero volatility

We apply the proposed approach to the valuation of a Bermudan-style three-year 4.25% annual coupon bond, callable at par one and two years from now (the decision to call is obviously taken by the issuer).

Because the issuer has borrowed money, it will exercise the call option when the value of the bond's future cash flows is higher than the call price (100).

|  | today | year 1 | year 2 | year 3 |

| cashflow | 0 | 4.250 | 4.250 | 104.250 |

| one-year forward rate | 0 | 2.500% | 3.158% | 4.564% |

| value of straight bond if not called (ex-coupon) | 102.456 | 100.767 | 99.700 | 0.000 |

| value of callable bond (ex-coupon) | 101.707 | 100.000 | 99.700 | 0.000 |

Bond values are ex-coupon; coupon payments are shown separately in the cashflow row. The issuer calls the bond at year 1 because its continuation value (100.767) exceeds the par call price of 100. At year 2, the continuation value (99.700) is below par, so the bond is not called.

We start by discounting bond cash flows at maturity to year 2.

The present value of the bond's future cash flows at year 2 is $99.700$, which is lower than the call price of $100$, so we expect the issuer not to call the bond.

The year-2 continuation value is calculated by discounting the year-3 cash flow by the year-3 forward rate:

$$

V_2^{\text{straight}} = \frac{104.250}{1 + 0.04564} = 99.700

$$

To find the year-1 continuation value, we add the year-2 coupon to the year-2 value and discount by the year-2 forward rate:

$$

V_1^{\text{straight}} = \frac{4.250 + V_2^{\text{straight}}}{1 + 0.03158} = 100.767 > 100

$$

Since the year-1 continuation value is greater than the par call price, the issuer calls the bond at year 1.

The callable bond's value today is the present value of the year-1 coupon and the par call price, discounted by the year-1 forward rate:

$$

V_0^{\text{callable}} = \frac{4.250 + 100}{1 + 0.025} = 101.707

$$

The value of the straight bond today is:

$$

V_0^{\text{straight}} = \frac{4.250 + V_1^{\text{straight}}}{1 + 0.025} = 102.456

$$

We can now calculate the value of the issuer's call option:

$$

C_{\text{issuer}} = V_0^{\text{straight}} - V_0^{\text{callable}} = 102.456 - 101.707 = 0.749

$$

---

## valuation of a putable bond at zrro volatility

we can apply the same reasoning to the valuation of a bermuda stzle 3 zears 4.25% annual coupo bond, putable at par one year and two years fro now. the decition to exercise the put is n the investo side => he will exercise the put option if the value og bond's future cashflows is lower tha the ut price (exercise price)

| | today |year 1 | year 2 | year 3|

| cashflow | - | 4,250 | 4,250 | 104,250|

| discount rate | 2.5 % | 3.5128% | 4.564%| 

| value of putable bond | 100.707 + 4.250)/1.0250 | 100 + 4.250 )/1.03518 = 100.707 ( no put) | 104.250 / 1.045 = 99.7 => put at 100

again, mwe start from the last zear and we calculate the present value for the previous year for the bond, we then check ue value compared to the exercise pric

---

However, note that the presented approach for valuing bonds with embedded optoins assumes that the option holders are risk neutral, i.e. they exercise only if the beenfoit from exercising is greater tham the expected benefit of waiting wijle, on rality, optios holders may be risk adverse and exercise earlz i f the option is more alive tha dead.

---

## Effect of interest rate volatility on the value of callable and puttable bonds

Recall that the value of any embedded optoin, regardless of the tzpe of the optoin, increases with interest ratevolatility, since with increase volatilitz there are ore opportunites for the embedded optoin to be exercise. THerfreo, issuers and invesotrs have to understand the effects on ir volatility on the values of bonds with embedded options.

In general, we can say that with greater volatility there's much dispersion in the interest rates, so the value of the option increases.

Therefore, if we model the value of a callable bond as the difference between the straight bond and the call option, we can say that:

- the value of a straight bond is unaffeted by ir volatility 

- the value of the callable is decreased by interest rate volatilit

In contrast, if e consider the value of a putable bond and we model it as the sum of the straight bond and the put option:

- the value of the straight bond is constant 

- the value of the put option increses => so the value of the putable bond increases as well

## level and shape of the yield curve

the value of a callale/putable bnd is also affected by te changes in the level and the shape of the yield curvre.

We first consider the efffects on the value of a callable. If interest rates decline:

- the value of a straight bond rises 

- the value of the call otion increases (But less than the value of the straight bond)

- the overall effect is that the callable bold increases less rapidlz than the alue of the straight bon d(so the upside potential for the investor is limited)

the value of a call option, and therefore of a callables, is also affected by changes inthe shape of the curve.

ALl things equal, the value of a call option increases if the yield curve flattens, examples:

- if the yield curve is upward sloping (from 2 to 4%) => value of the call is approx 8% of par

- if the yield cutve is flat at 4% => value of the call approx 10 % of par

- if the yield curve is downward sloping (from 4 to 2%) => value of the call si approx 12%

the intuition is that, whe the yield curve is upward sloping, the open period forward ratesare high and opportunites for the issuer to call are wever.

Therefore whe the yield flatens or inverts, this implies lower rates and the increase the opportunites to call.

the same reasoning can be appied (on the opposite direction to a put option)

## valuation of risky callable and putable bonds

most bonds are subject to default, so we have to model this features of the bond. there are two common way to do this:

- increase the discount rate to reflect the default risk

- explicitly model the default probabilitz for eatch time period and specifying the recovery vaue given default aas a % of par 

## option adjusted spread

depending on the info, there are two standard approaches to construct a yield cutve for a risky bond:

- less conveniet and more satisfactory: use a issuer-specific curve that represen'ts issuer borrowinc rates over different maturies (but most of bond professionals do not have information at this granularity)

- increase the one year forward rate derived from the default free benchmarkk yield curve by a fixed spred estimated from the market price of bonds of similar credit uality (this fixed spread is known as the yero-volatility spread o, in other terms, z_spread)

the same approach can be applied to the interest rate tree when valuingi rksy bonds with embeddedoptions. in this case, an option adjusted sprad (OAS) is used. OAS is the constant spread that, when added to the forwar rates on the interest rate tree. makes the arbitrage free value of the bond equal to its market value

(note that the y_spread for an option free bond is its oas at zero volatility)

all things equal (i.e. with bonds with similar characteristic and credit quality):

- lower OAS mean the bond is OVERpriced and should be avoided (lwoer discount factor and so higher present value)

the dispersion of interes rate is volatility depend and the same applies to the OAS.

For a callable bond,  the OAS is a decreasing function of the interest rate volatility (higher volatility => lower OA)

---

##  bonds with embeddded options: effective duration

The duration of a bond is the sesitivity of the bond's full price (including accrued interest) to changes in the bond's ytm or in the benchmark interest rate.

Howerver, yield duration and modified duration can only be used for option free bobds, because they assume that bond's expected cash flows do not change whem the interest rate change.

Therefore, for bonds with embedded options, we should instead consider the optio adjusted duration.

The effective duratio indicades the sensitify of the bond's price to a 100 bps parallel shift of the benchamark yield curve and it is calculate as:

Effective Duration = \frac{PV_ - PV+}{2 x \Delta Curve P_0}

where \Delta curve is the mgnitude of the parallel shift, P_0 the current price of the bond, PV_ the full price of the bond for a down shifted curve and PV+ the full price of the bond when the curve is shifted up.

Note that the effective duration of a callable bond cannto exceed the one of a the stright bond:

- when interest rates are high relative to the bond coupon => the call option is OTM => the bond is unlikely to be called

    - so the effect of ir changei a callable is similar to the one of the straight bond 

- but if interest rates fall => the call option moves ITM => so the call option value increases and limits the price apprecciation of the callable bond

Similarlz, the effcetive duration of a puttable exceed the one of the corresponding straight bond:

- when interest rates are low relative to the bond's coupon => the put option is OTM => so the bond iunlikely to be called

    - so duration of putable and straight bond are similar

- whe intere rate rie => the put option moves ITM => value of the put otpion increase => this reduce the price depreciation of the straight bond 

when the embedded otion is deep OTM => the duration of the bond with the embedded option is verz similar to th eone of the straight bond

However, note thatwhen the embedded otion is in the monez, the price of the bond has limited upseid potential if the bond is callable and limited downside potential if the bond is putable 

=> therefore the price sensitivtz of the bond with embedded option is not simmetricsl

We can then calculate one-side duration, as the duration if the ir raises or decline.

- in general, for a callable bond, the duration if interest rate go up is greater than the one with interest rate declining

Kez duration, on the oher hand (also defined "partial durationa") is the change in the bond price with respect to a change in specific maturities of the yield curve, i.e. changes in the shape of the cutve.

## Effective convexity

Duration is a first order approximation of the expected bond price in response to change in interest rates. however, note that the change inprice is not linear, in particular for bonds with embdeed options.

Therefore, effecitve convexitz measures the sensitivitz to change in inter rates and it is given by

Effective DUation = \fra{PV_ + PV+  2(2 * PV_0)}{ \Delta CUrve ^2 * PV_0}

When the value of the call is low, callables and straight bonds have similar behaviors for changes of IR and thez show both positive convexity.

However, the convexity for a callavke bond turns negative whe call otption is near the monez => since whe intrest rates decline, the price of the callable bond is capped bz the price of the call opsion

On the other hand puttable bond have always positive convexity