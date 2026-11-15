export type EconomyScenario = {
  profitTax: number
  wageTax: number
  publicShare: number
  concentration: number
}

export const initialEconomyScenario: EconomyScenario = {
  profitTax: 0.2,
  wageTax: 0.2,
  publicShare: 0.25,
  concentration: 0.5,
}

export const SUBSISTENCE_THRESHOLD = 2
export const WELFARE_DISCOUNT = 0.9

export function exceedsSubsistence(income: number) {
  return income - SUBSISTENCE_THRESHOLD > 16 * Number.EPSILON * Math.max(income, SUBSISTENCE_THRESHOLD)
}

export function calculateEconomy(scenario: EconomyScenario) {
  const { profitTax, wageTax, publicShare, concentration } = scenario
  const wageTaxRevenue = 500 * wageTax
  const profitTaxRevenue = 500 * profitTax
  const publicDividends = 500 * (1 - profitTax) * publicShare
  const netWages = 500 - wageTaxRevenue
  const privateDividends = 500 * (1 - profitTax) * (1 - publicShare)
  const revenue = wageTaxRevenue + profitTaxRevenue + publicDividends
  const ubi = revenue / 100
  const lowDividends = privateDividends * (1 - concentration) / 100
  const highDividends = privateDividends * (1 + concentration) / 100
  const wage = 12.5 * (1 - wageTax)
  const groups = [
    { employed: true, highShare: false, population: 20, ubi, dividends: lowDividends, wage },
    { employed: true, highShare: true, population: 20, ubi, dividends: highDividends, wage },
    { employed: false, highShare: false, population: 30, ubi, dividends: lowDividends, wage: 0 },
    { employed: false, highShare: true, population: 30, ubi, dividends: highDividends, wage: 0 },
  ].map((group) => ({ ...group, total: group.ubi + group.dividends + group.wage }))

  return { wageTaxRevenue, profitTaxRevenue, publicDividends, netWages, privateDividends, revenue, groups }
}

export function calculateWelfare(scenario: EconomyScenario) {
  const current = calculateEconomy(scenario).groups
  const reference = calculateEconomy(initialEconomyScenario).groups
  const utilities = current.map((group, index) => {
    const currentSurplus = group.total - SUBSISTENCE_THRESHOLD
    const referenceSurplus = reference[index].total - SUBSISTENCE_THRESHOLD
    if (!exceedsSubsistence(group.total) || !exceedsSubsistence(reference[index].total)) return null
    return WELFARE_DISCOUNT * Math.log(currentSurplus / referenceSurplus)
  })
  const welfare = utilities.every((utility): utility is number => utility !== null)
    ? utilities.reduce((sum, utility, index) => sum + current[index].population * utility, 0)
    : null

  return { utilities, welfare }
}
