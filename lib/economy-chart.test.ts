import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { calculateEconomy, calculateWelfare, exceedsSubsistence, initialEconomyScenario } from './economy-chart'

test('initial scenario distributes production as specified', () => {
  const result = calculateEconomy(initialEconomyScenario)
  assert.equal(result.revenue, 300)
  assert.deepEqual(result.groups.map((group) => group.total), [14.5, 17.5, 4.5, 7.5])
})

test('slider extremes conserve production and keep UBI equal', () => {
  for (const profitTax of [0, 0.2, 0.29, 1]) for (const wageTax of [0, 0.2, 1]) {
    for (const publicShare of [0, 0.25, 1]) for (const concentration of [0, 0.5, 1]) {
      const result = calculateEconomy({ profitTax, wageTax, publicShare, concentration })
      const total = result.groups.reduce((sum, group) => sum + group.population * group.total, 0)
      assert.ok(Math.abs(total - 1000) < 1e-9)
      assert.ok(result.groups.every((group) => group.ubi === result.revenue / 100))
      assert.ok(result.privateDividends >= 0)
      assert.ok(result.groups.filter((group) => !group.employed).every((group) => group.wage === 0))
    }
  }
})

test('equal shares keep individual income constant when profit policy changes', () => {
  const first = calculateEconomy({ profitTax: 0, wageTax: 0.2, publicShare: 0, concentration: 0 })
  const second = calculateEconomy({ profitTax: 1, wageTax: 0.2, publicShare: 1, concentration: 0 })
  assert.deepEqual(first.groups.map((group) => group.total), second.groups.map((group) => group.total))
  const extreme = calculateEconomy({ profitTax: 0, wageTax: 0, publicShare: 0, concentration: 1 })
  assert.equal(extreme.groups[2].total, 0)
})

test('welfare starts at zero and uses population weights', () => {
  const initial = calculateWelfare(initialEconomyScenario)
  assert.deepEqual(initial.utilities, [0, 0, 0, 0])
  assert.equal(initial.welfare, 0)

  const changed = calculateWelfare({ ...initialEconomyScenario, concentration: 0 })
  const current = calculateEconomy({ ...initialEconomyScenario, concentration: 0 }).groups
  const reference = calculateEconomy(initialEconomyScenario).groups
  const expected = current.map((group, index) => 0.9 * Math.log((group.total - 2) / (reference[index].total - 2)))
  assert.deepEqual(changed.utilities, expected)
  assert.ok(expected[0] > 0 && expected[1] < 0 && expected[2] > 0 && expected[3] < 0)
  assert.equal(changed.welfare, expected.reduce((sum, value, index) => sum + current[index].population * value, 0))
})

test('welfare becomes unavailable when a group leaves the model domain', () => {
  const result = calculateWelfare({ profitTax: 0, wageTax: 0, publicShare: 0, concentration: 1 })
  assert.ok(result.utilities.includes(null))
  assert.equal(result.welfare, null)
})

test('subsistence boundary tolerates rounding without excluding valid slider values', () => {
  const boundary = { profitTax: 0, wageTax: 0.03, publicShare: 0.1, concentration: 0.7 }
  const income = calculateEconomy(boundary).groups[2].total
  assert.ok(income > 2)
  assert.equal(exceedsSubsistence(income), false)
  assert.equal(calculateWelfare(boundary).utilities[2], null)
  assert.equal(calculateWelfare(boundary).welfare, null)

  const above = { profitTax: 0.08, wageTax: 0.12, publicShare: 0.09, concentration: 0.86 }
  assert.equal(exceedsSubsistence(calculateEconomy(above).groups[2].total), true)
  assert.ok(Number.isFinite(calculateWelfare(above).welfare))
})
