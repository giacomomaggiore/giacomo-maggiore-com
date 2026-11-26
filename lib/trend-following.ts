export const defaultTrendSettings = {
  maType: 'ema' as 'ema' | 'sma', fast: 50, slow: 100, entry: 100, exit: 50,
  rebalanceDays: 1, riskMultiplier: 1, transactionBps: 5, rollPercent: 0.2, cashMultiplier: 1,
}

export type TrendSettings = typeof defaultTrendSettings

type MarketRow = [index: number, adjusted: number, reset: 0 | 1, move: number, riskMove: number,
  notional: number, riskAtClose: number | null]

export type TrendData = {
  version: 1
  dates: number[]
  start: number
  shared: number[]
  benchmark: number[]
  cashGrowth: number[]
  cashRate: (number | null)[]
  benchmarkRisk: (number | null)[]
  markets: { name: string; rows: MarketRow[] }[]
}

export type TrendResult = {
  dates: number[]
  trend: number[]
  benchmark: number[]
  correlation: (number | null)[]
  trendMetrics: (number | null)[]
  benchmarkMetrics: (number | null)[]
}

export class InvalidTrendNav extends Error {
  constructor(readonly day: number) {
    super('Trend-following NAV is not positive and finite')
  }
}

const riskWindow = 63

function priorChannel(rows: MarketRow[], span: number) {
  const lows = new Float64Array(rows.length), highs = new Float64Array(rows.length)
  const minQueue = new Int32Array(rows.length), maxQueue = new Int32Array(rows.length)
  let minHead = 0, minTail = 0, maxHead = 0, maxTail = 0
  for (let i = 0; i < rows.length; i++) {
    const [, close, reset] = rows[i]
    if (reset) minHead = minTail = maxHead = maxTail = 0
    if (minHead < minTail && minQueue[minHead] < i - span) minHead++
    if (maxHead < maxTail && maxQueue[maxHead] < i - span) maxHead++
    lows[i] = minHead < minTail ? rows[minQueue[minHead]][1] : -Infinity
    highs[i] = maxHead < maxTail ? rows[maxQueue[maxHead]][1] : Infinity
    while (minTail > minHead && rows[minQueue[minTail - 1]][1] >= close) minTail--
    while (maxTail > maxHead && rows[maxQueue[maxTail - 1]][1] <= close) maxTail--
    minQueue[minTail++] = maxQueue[maxTail++] = i
  }
  return { lows, highs }
}

function directionAtCloses(rows: MarketRow[], s: TrendSettings) {
  const directions = new Int8Array(rows.length)
  const entry = priorChannel(rows, s.entry)
  const exit = s.entry === s.exit ? entry : priorChannel(rows, s.exit)
  const warmup = 252 + Math.max(100, s.slow, s.entry, s.exit)
  let segment = 0, side = 0, fast = 0, slow = 0, flat = 0
  let fastAdd = 0, fastRemove = 0, slowAdd = 0, slowRemove = 0
  const fastAlpha = 2 / (s.fast + 1), slowAlpha = 2 / (s.slow + 1)
  for (let i = 0; i < rows.length; i++) {
    const [, close, reset] = rows[i]
    if (reset) {
      segment = i
      side = 0
      fast = slow = s.maType === 'ema' ? close : 0
      fastAdd = fastRemove = slowAdd = slowRemove = 0
    }
    const age = i - segment + 1
    flat = age > 1 && rows[i - 1][1] === close ? flat + 1 : 1
    if (s.maType === 'ema') {
      if (!reset) {
        if (fast !== close) fast = (1 - fastAlpha) * fast + fastAlpha * close
        if (slow !== close) slow = (1 - slowAlpha) * slow + slowAlpha * close
      }
    } else {
      // Compensated rolling sums match the notebook's treatment of almost equal averages.
      if (age > s.fast) {
        const term = -rows[i - s.fast][1] - fastRemove
        const sum = fast + term
        fastRemove = sum - fast - term
        fast = sum
      }
      if (age > s.slow) {
        const term = -rows[i - s.slow][1] - slowRemove
        const sum = slow + term
        slowRemove = sum - slow - term
        slow = sum
      }
      const ft = close - fastAdd, st = close - slowAdd
      const fs = fast + ft, ss = slow + st
      fastAdd = fs - fast - ft
      slowAdd = ss - slow - st
      fast = fs
      slow = ss
    }
    if (age < warmup) continue
    directions[i] = side
    const channel = side === 0 ? entry : exit
    const low = channel.lows[i], high = channel.highs[i]
    const rising = s.maType === 'ema' ? fast > slow
      : (flat >= s.fast ? close : fast / s.fast) > (flat >= s.slow ? close : slow / s.slow)
    if (side === 0) {
      if (rising && close >= high) side = 1
      else if (!rising && close <= low) side = -1
    } else if ((side > 0 && close <= low) || (side < 0 && close >= high)) side = 0
  }
  return directions
}

function returns(levels: number[]) {
  return levels.slice(1).map((value, i) => value / levels[i] - 1)
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function summarize(levels: number[], daily: number[], cash: number[], dates: number[], cashOnly = false) {
  // The unscaled cash-only scenario tracks risk-free exactly before compounding round-off.
  const excess = daily.map((value, i) => cashOnly ? 0 : value - cash[i])
  const dailyMean = mean(daily), excessMean = mean(excess)
  const annualize = Math.sqrt(252)
  const deviation = (values: number[], average: number) => Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1),
  )
  const risk = deviation(excess, excessMean)
  const downside = Math.sqrt(mean(excess.map(value => Math.min(value, 0) ** 2)))
  let peak = levels[0], peakDay = dates[0], maxDrawdown = 0, underwater = false
  let durations = 0, drawdowns = 0
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] < peak) {
      underwater = true
      maxDrawdown = Math.min(maxDrawdown, levels[i] / peak - 1)
    } else {
      if (underwater) { durations += dates[i] - peakDay; drawdowns++ }
      underwater = false
      peak = levels[i]
      peakDay = dates[i]
    }
  }
  const last = levels.length - 1
  if (underwater) { durations += dates[last] - peakDay; drawdowns++ }
  return [
    (levels[last] / levels[0]) ** (365.25 / (dates[last] - dates[0])) - 1,
    deviation(daily, dailyMean) * annualize,
    risk > 0 ? excessMean / risk * annualize : null,
    downside > 0 ? excessMean / downside * annualize : null,
    maxDrawdown,
    drawdowns ? durations / drawdowns : 0,
  ].map(value => value !== null && Number.isFinite(value) ? value : null)
}

function rollingCorrelation(a: number[], b: number[]) {
  const window = 252
  const result: (number | null)[] = Array(a.length + 1).fill(null)
  for (let end = window; end <= a.length; end++) {
    const start = end - window
    let ax = 0, bx = 0
    for (let i = start; i < end; i++) {
      ax += a[i] - a[start]
      bx += b[i] - b[start]
    }
    ax /= window
    bx /= window
    let aa = 0, bb = 0, ab = 0
    for (let i = start; i < end; i++) {
      const x = a[i] - a[start] - ax, y = b[i] - b[start] - bx
      aa += x * x; bb += y * y; ab += x * y
    }
    if (aa > 0 && bb > 0) result[end] = Math.max(-1, Math.min(1, ab / Math.sqrt(aa * bb)))
  }
  return result
}

export function createTrendBacktest(data: TrendData) {
  const count = data.markets.length
  const size = data.dates.length * count
  const move = new Float64Array(size), riskMove = new Float64Array(size)
  const notional = new Float64Array(size), priorNotional = new Float64Array(size), risk = new Float64Array(size)
  const observed = new Uint8Array(size), reset = new Uint8Array(size)
  for (let j = 0; j < count; j++) {
    const { rows } = data.markets[j]
    let cursor = 0, lastNotional = 0, lastRisk = 0
    for (let i = 0; i < data.dates.length; i++) {
      const k = i * count + j
      priorNotional[k] = lastNotional
      risk[k] = lastRisk
      if (rows[cursor]?.[0] !== i) continue
      const [, , boundary, pnl, cleanMove, active, closeRisk] = rows[cursor++]
      observed[k] = 1
      reset[k] = boundary
      move[k] = pnl
      riskMove[k] = cleanMove
      notional[k] = lastNotional = active
      if (closeRisk !== null) lastRisk = closeRisk
    }
  }
  const dates = data.shared.map(i => data.dates[i])
  const benchmarkReturns = returns(data.benchmark), cashReturns = returns(data.cashGrowth)
  const benchmarkMetrics = summarize(data.benchmark, benchmarkReturns, cashReturns, dates)
  let previousSignalKey = '', directions = new Int8Array(size)

  return (s: TrendSettings): TrendResult => {
    if (s.fast >= s.slow) throw new RangeError('Fast window must be shorter than slow window')
    const signalKey = [s.maType, s.fast, s.slow, s.entry, s.exit].join(':')
    if (signalKey !== previousSignalKey) {
      directions = new Int8Array(size)
      for (let j = 0; j < count; j++) {
        const { rows } = data.markets[j]
        const signals = directionAtCloses(rows, s)
        let cursor = 0, side = 0
        for (let i = 0; i < data.dates.length; i++) {
          if (rows[cursor]?.[0] === i) side = signals[cursor++]
          directions[i * count + j] = side
        }
      }
      previousSignalKey = signalKey
    }
    const holdings = new Float64Array(count), unitPositions = new Float64Array(count)
    const pending = new Uint8Array(count), trades = new Uint8Array(count)
    const navHistory = new Float64Array(data.dates.length)
    const transactionRate = s.transactionBps / 10_000, rollRate = s.rollPercent / 100
    let nav = 100_000, nextResize = data.dates[data.start]
    navHistory[data.start] = nav
    for (let i = data.start + 1; i < data.dates.length; i++) {
      const offset = i * count, day = data.dates[i], elapsed = day - data.dates[i - 1]
      const priorNav = nav
      let gross = 0, pnl = 0
      for (let j = 0; j < count; j++) {
        gross += Math.abs(holdings[j]) * priorNotional[offset + j]
        pnl += holdings[j] * move[offset + j]
      }
      nav -= gross * rollRate * elapsed / 365
      nav += pnl
      nav += priorNav * (data.cashRate[i] ?? NaN) * s.cashMultiplier * elapsed / 360
      if (day >= nextResize) {
        pending.fill(1)
        nextResize = day + s.rebalanceDays
      }
      let hasTrade = false, hasUnits = false
      for (let j = 0; j < count; j++) {
        const k = offset + j
        const side = reset[k] ? 0 : directions[k]
        trades[j] = observed[k] && (pending[j] || side !== Math.sign(holdings[j])) ? 1 : 0
        unitPositions[j] = risk[k] > 0 ? side / risk[k] : 0
        hasTrade ||= trades[j] === 1
        hasUnits ||= unitPositions[j] !== 0
      }
      if (hasTrade) {
        let scale = 0
        const benchmarkRisk = data.benchmarkRisk[i]
        if (s.riskMultiplier && i >= riskWindow && hasUnits && benchmarkRisk !== null) {
          let average = 0, squares = 0, n = 0
          for (let k = offset - riskWindow * count; k < offset; k += count) {
            let basketMove = 0
            for (let j = 0; j < count; j++) basketMove += riskMove[k + j] * unitPositions[j]
            const delta = basketMove - average
            average += delta / ++n
            squares += delta * (basketMove - average)
          }
          const basketRisk = Math.sqrt(squares / (riskWindow - 1))
          if (basketRisk > 0) scale = priorNav * s.riskMultiplier * benchmarkRisk / basketRisk
        }
        let turnover = 0
        for (let j = 0; j < count; j++) {
          if (!trades[j]) continue
          const target = unitPositions[j] * scale
          turnover += Math.abs(target - holdings[j]) * notional[offset + j]
          holdings[j] = target
          pending[j] = 0
        }
        nav -= turnover * transactionRate
      }
      if (!(nav > 0) || !Number.isFinite(nav)) throw new InvalidTrendNav(day)
      navHistory[i] = nav
    }
    const trend = data.shared.map(i => navHistory[i] / navHistory[data.shared[0]] * 100)
    const daily = returns(trend)
    return {
      dates, trend, benchmark: data.benchmark, correlation: rollingCorrelation(daily, benchmarkReturns),
      trendMetrics: summarize(trend, daily, cashReturns, dates, s.riskMultiplier === 0 && s.cashMultiplier === 1),
      benchmarkMetrics,
    }
  }
}
