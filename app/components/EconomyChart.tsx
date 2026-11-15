'use client'

import React, { useSyncExternalStore } from 'react'
import {
  calculateEconomy,
  calculateWelfare,
  exceedsSubsistence,
  initialEconomyScenario,
  type EconomyScenario,
} from 'lib/economy-chart'

const styles = {
  chart: 'economy-chart', muted: 'economy-muted', controls: 'economy-controls',
  control: 'economy-control',
  diagram: 'economy-diagram',
  incomeHeader: 'economy-income-header', legend: 'economy-legend',
  groups: 'economy-groups', groupTitle: 'economy-group-title', groupLabel: 'economy-group-label',
  person: 'economy-person', bar: 'economy-bar', ubi: 'economy-ubi',
  dividends: 'economy-dividends', wages: 'economy-wages',
  warning: 'economy-warning',
  welfare: 'economy-welfare', welfareBars: 'economy-welfare-bars',
  welfareGroup: 'economy-welfare-group', welfareColumns: 'economy-welfare-columns',
  welfareColumn: 'economy-welfare-column', welfareTrack: 'economy-welfare-track',
  welfareBar: 'economy-welfare-bar', welfareLabel: 'economy-welfare-label',
  welfareSocial: 'economy-welfare-social', welfareInvalid: 'economy-welfare-invalid',
}

const format = (value: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value)

type Language = 'it' | 'en'

const text = {
  it: {
    controls: { profitTax: 'Imposta profitti', wageTax: 'Imposta salari', publicShare: 'Quota pubblica', concentration: 'Disparità proprietà' },
    chartTitle: 'Dalla produzione ai cittadini', flowTitle: 'Distribuzione della produzione',
    flowDescription: 'I flussi mostrano salari, profitti, imposte, dividendi e UBI.',
    production: 'Produzione', grossWages: 'Salari lordi', profits: 'Profitti', state: 'Stato', citizens: 'Cittadini',
    income: 'Reddito per persona', dividends: 'Dividendi', netWage: 'Salario netto',
    employed: 'Occupato', unemployed: 'Non occupato', equalShares: 'quote uguali', highShares: 'molte quote', lowShares: 'poche quote',
    incomeWarning: 'Reddito fuori dal dominio delle formule di consumo e utilità (soglia: 2).',
    welfareTitle: 'Utilità dei cittadini', socialWelfare: 'Welfare sociale totale',
    unavailable: 'non disponibile', utilityUnits: 'unità di utilità', unavailableShort: 'n/d',
    welfareWarning: 'Scenario fuori dal dominio del modello: almeno un reddito corrente o di riferimento non supera la soglia di sussistenza.',
    welfareNote: 'Variazioni di utilità rispetto allo scenario iniziale.',
    scaleNote: 'Le scale si adattano allo scenario: le altezze non sono dunque confrontabili tra scenari.',
  },
  en: {
    controls: { profitTax: 'Profit tax', wageTax: 'Wage tax', publicShare: 'Public share', concentration: 'Ownership inequality' },
    chartTitle: 'From production to citizens', flowTitle: 'Distribution of production',
    flowDescription: 'The flows show wages, profits, taxes, dividends and UBI.',
    production: 'Production', grossWages: 'Gross wages', profits: 'Profits', state: 'State', citizens: 'Citizens',
    income: 'Income per person', dividends: 'Dividends', netWage: 'Net wage',
    employed: 'Employed', unemployed: 'Unemployed', equalShares: 'equal shares', highShares: 'large share', lowShares: 'small share',
    incomeWarning: 'Income is outside the domain of the consumption and utility formulas (threshold: 2).',
    welfareTitle: 'Citizens’ utility', socialWelfare: 'Total social welfare',
    unavailable: 'unavailable', utilityUnits: 'utility units', unavailableShort: 'n/a',
    welfareWarning: 'Scenario outside the model’s domain: at least one current or reference income does not exceed the subsistence threshold.',
    welfareNote: 'Changes in utility relative to the initial scenario.',
    scaleNote: 'The scales adjust to the scenario, so heights cannot be compared across scenarios.',
  },
} satisfies Record<Language, Record<string, string | Record<keyof EconomyScenario, string>>>

const controlKeys: (keyof EconomyScenario)[] = ['profitTax', 'wageTax', 'publicShare', 'concentration']

function Flow({ startX, endX, startY, endY, amount, color }: {
  startX: number; endX: number; startY: number; endY: number; amount: number; color: string
}) {
  if (amount === 0) return null
  const middle = (startX + endX) / 2
  return <path d={`M ${startX} ${startY} C ${middle} ${startY}, ${middle} ${endY}, ${endX} ${endY}`}
    fill="none" stroke={color} strokeOpacity="0.65" strokeWidth={amount / 10} />
}

let sharedScenario = initialEconomyScenario
const scenarioListeners = new Set<() => void>()

function subscribeToScenario(listener: () => void) {
  scenarioListeners.add(listener)
  return () => scenarioListeners.delete(listener)
}

function updateScenario(scenario: EconomyScenario) {
  sharedScenario = scenario
  scenarioListeners.forEach((listener) => listener())
}

function useEconomyScenario() {
  return useSyncExternalStore(
    subscribeToScenario,
    () => sharedScenario,
    () => initialEconomyScenario,
  )
}

function ScenarioControls({ scenario, language }: { scenario: EconomyScenario; language: Language }) {
  const slider = (key: keyof EconomyScenario) => (
    <label className={styles.control} key={key}>
      <span>{text[language].controls[key]} <strong>{Math.round(scenario[key] * 100)}%</strong></span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(scenario[key] * 100)}
        onChange={(event) => updateScenario({
          ...scenario,
          [key]: Number(event.target.value) / 100,
        })}
      />
    </label>
  )

  return <div className={styles.controls}>{controlKeys.map(slider)}</div>
}

export function EconomyChart({ language = 'it' }: { language?: Language }) {
  const scenario = useEconomyScenario()
  const t = text[language]
  const { wageTaxRevenue, profitTaxRevenue, publicDividends, netWages, privateDividends, revenue, groups } = calculateEconomy(scenario)
  const center = (top: number, preceding: number, amount: number) => top + (preceding + amount / 2) / 10
  return (
    <section className={styles.chart} aria-labelledby="economy-chart-title">
      <h4 id="economy-chart-title">{t.chartTitle}</h4>
      <ScenarioControls scenario={scenario} language={language} />

      <svg className={styles.diagram} viewBox="0 0 620 300" role="img" aria-labelledby="economy-flow-title economy-flow-description">
        <title id="economy-flow-title">{t.flowTitle}</title>
        <desc id="economy-flow-description">{t.flowDescription}</desc>
        <text x="0" y="18">{t.production}</text>
        <text x="150" y="18">{t.grossWages}</text><text x="150" y="204">{t.profits}</text>
        <text x="365" y="128">{t.state}</text><text x="557" y="108">{t.citizens}</text>
        <Flow startX={10} endX={155} startY={center(120, 0, 500)} endY={center(45, 0, 500)} amount={500} color="#a3a3a3" />
        <Flow startX={10} endX={155} startY={center(120, 500, 500)} endY={center(215, 0, 500)} amount={500} color="#a3a3a3" />
        <Flow startX={160} endX={600} startY={center(45, 0, netWages)} endY={center(120, 0, netWages)} amount={netWages} color="#bf8536" />
        <Flow startX={160} endX={370} startY={center(45, netWages, wageTaxRevenue)} endY={center(145, 0, wageTaxRevenue)} amount={wageTaxRevenue} color="#a3a3a3" />
        <Flow startX={160} endX={370} startY={center(215, 0, profitTaxRevenue)} endY={center(145, wageTaxRevenue, profitTaxRevenue)} amount={profitTaxRevenue} color="#a3a3a3" />
        <Flow startX={160} endX={370} startY={center(215, profitTaxRevenue, publicDividends)} endY={center(145, wageTaxRevenue + profitTaxRevenue, publicDividends)} amount={publicDividends} color="#a3a3a3" />
        <Flow startX={160} endX={600} startY={center(215, profitTaxRevenue + publicDividends, privateDividends)} endY={center(120, netWages + revenue, privateDividends)} amount={privateDividends} color="#8a70af" />
        <Flow startX={375} endX={600} startY={center(145, 0, revenue)} endY={center(120, netWages, revenue)} amount={revenue} color="#4785bc" />
      </svg>
      <div className={styles.incomeHeader}>
        <p><strong>{t.income}</strong></p>
        <div className={styles.legend}>
        <span><i className={styles.ubi} aria-hidden="true" />UBI</span>
        <span><i className={styles.dividends} aria-hidden="true" />{t.dividends}</span>
        <span><i className={styles.wages} aria-hidden="true" />{t.netWage}</span>
        </div>
      </div>
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={`${group.employed}-${group.highShare}`}>
            <div className={styles.groupTitle}>
              <span className={styles.groupLabel}>
                <svg className={styles.person} viewBox="0 0 20 26" aria-hidden="true"><circle cx="10" cy="5" r="4" fill="currentColor" /><path d="M3 24v-5a7 7 0 0 1 14 0v5z" fill="currentColor" /></svg>
                <span>{group.employed ? t.employed : t.unemployed} · {scenario.concentration === 0 ? t.equalShares : group.highShare ? t.highShares : t.lowShares}</span>
              </span>
              <strong>{format(group.total)}</strong>
            </div>
            <div className={styles.bar} aria-hidden="true">
              <span className={styles.ubi} style={{ width: `${group.ubi / 22.5 * 100}%` }} />
              <span className={styles.dividends} style={{ width: `${group.dividends / 22.5 * 100}%` }} />
              <span className={styles.wages} style={{ width: `${group.wage / 22.5 * 100}%` }} />
            </div>
            {!exceedsSubsistence(group.total) && <div className={styles.warning}>{t.incomeWarning}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function WelfareBar({
  label,
  value,
  scale,
  language,
  social = false,
}: {
  label: string
  value: number | null
  scale: number
  language: Language
  social?: boolean
}) {
  const t = text[language]
  const height = value === null ? 0 : Math.min(Math.abs(value) / scale, 1) * 50
  return (
    <div className={styles.welfareColumn} aria-label={`${label}: ${value === null ? t.unavailable : `${format(value)} ${t.utilityUnits}`}`}>
      <div className={styles.welfareTrack}>
        {value !== null && (
          <span
            className={`${styles.welfareBar} ${social ? styles.welfareSocial : ''}`}
            style={{
              height: `${height}%`,
              top: `${value >= 0 ? 50 - height : 50}%`,
            }}
          />
        )}
      </div>
      <div className={styles.welfareLabel}>{label}</div>
      {value === null && <strong className={styles.welfareInvalid}>{t.unavailableShort}</strong>}
    </div>
  )
}

export function EconomyWelfare({ language = 'it' }: { language?: Language }) {
  const scenario = useEconomyScenario()
  const t = text[language]
  const welfareLabels = [
    `${t.employed} · ${t.lowShares}`,
    `${t.employed} · ${t.highShares}`,
    `${t.unemployed} · ${t.lowShares}`,
    `${t.unemployed} · ${t.highShares}`,
  ]
  const { utilities, welfare } = calculateWelfare(scenario)
  const individualScale = Math.max(...utilities.filter((utility): utility is number => utility !== null).map(Math.abs), 0.1)
  const welfareScale = Math.max(Math.abs(welfare ?? 0), 1)

  return (
    <section className={`${styles.chart} ${styles.welfare}`} aria-labelledby="economy-welfare-title">
      <h4 id="economy-welfare-title">{t.welfareTitle}</h4>
      <ScenarioControls scenario={scenario} language={language} />
      <div className={styles.welfareBars}>
        <div className={styles.welfareGroup}>
          <div className={styles.welfareColumns}>
            {welfareLabels.map((label, index) => (
              <WelfareBar key={label} label={label} value={utilities[index]} scale={individualScale} language={language} />
            ))}
          </div>
        </div>
        <div className={styles.welfareGroup}>
          <div className={styles.welfareColumns}>
            <WelfareBar label={t.socialWelfare} value={welfare} scale={welfareScale} language={language} social />
          </div>
        </div>
      </div>
      {welfare === null && (
        <p className={styles.warning}>
          {t.welfareWarning}
        </p>
      )}
      <p className={styles.muted}>
        <em>
          {t.welfareNote}<br />
          {t.scaleNote}
        </em>
      </p>
    </section>
  )
}
