import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createTrendBacktest, defaultTrendSettings, InvalidTrendNav, type TrendData, type TrendResult, type TrendSettings } from '../lib/trend-following'

const data: TrendData = JSON.parse(readFileSync('public/data/trend-following-v1.json', 'utf8'))
const { scenarios }: { scenarios: (Pick<TrendResult, 'trend' | 'correlation' | 'trendMetrics' | 'benchmarkMetrics'> & { settings: TrendSettings })[] } = JSON.parse(
  readFileSync('tests/fixtures/trend-following-v1.json', 'utf8'),
)
const run = createTrendBacktest(data)
const epochDay = (date: string) => Date.parse(date) / 86_400_000
const tolerance = 1e-8

function compare(label: string, actual: (number | null)[], expected: (number | null)[]) {
  assert.equal(actual.length, expected.length, label)
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i], e = expected[i]
    if (a === null || e === null) assert.equal(a, e, `${label}[${i}]`)
    else assert.ok(Math.abs(a - e) <= tolerance, `${label}[${i}]: ${a} vs ${e}`)
  }
}

const labels = ['baseline EMA', 'long-warm-up SMA', 'weekly rebalancing with higher costs', 'zero target risk', 'flat NAV']
for (const [i, expected] of scenarios.entries()) {
  test(`matches notebook daily levels, correlation and metrics: ${labels[i]}`, () => {
    if (i === 0) assert.deepEqual(expected.settings, defaultTrendSettings)
    const result = run(expected.settings)
    assert.equal(data.dates[data.start], epochDay('2000-05-25'))
    assert.equal(result.dates.length, 5930)
    assert.equal(result.dates[0], epochDay('2001-03-28'))
    assert.equal(result.dates.at(-1), epochDay('2024-03-28'))
    assert.deepEqual(result.dates, data.shared.map(index => data.dates[index]))
    assert.deepEqual(result.benchmark, data.benchmark)
    assert.ok(Math.abs(result.benchmark.at(-1)! - 494.398473) < 5e-7)
    assert.equal(result.trend[0], 100)
    assert.equal(result.benchmark[0], 100)
    assert.ok(result.correlation.slice(0, 252).every(value => value === null))
    for (const key of ['trend', 'correlation', 'trendMetrics', 'benchmarkMetrics'] as const) {
      compare(key, result[key], expected[key])
    }
  })
}

test('rejects invalid windows and a scenario with nonpositive NAV', () => {
  assert.throws(() => run({ ...defaultTrendSettings, fast: defaultTrendSettings.slow }), RangeError)
  assert.throws(() => run({ ...defaultTrendSettings, transactionBps: 10_000 }), InvalidTrendNav)
})
