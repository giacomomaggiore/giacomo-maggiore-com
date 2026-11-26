'use client'

import { memo, useEffect, useId, useRef, useState } from 'react'
import { defaultTrendSettings, type TrendResult, type TrendSettings } from 'lib/trend-following'
import type { TrendReply, TrendRequest } from 'lib/trend-following.worker'
import { TrendFollowingPlots } from './TrendFollowingPlots'
import styles from './TrendFollowingDashboard.module.css'

type Language = 'it' | 'en'
type Status = 'idle' | 'updating' | 'invalid' | 'ready' | 'load' | 'calculation' | { day: number }
const Plot = memo(TrendFollowingPlots)

const copy = {
  it: {
    title: 'Sensibilità della strategia', retry: 'Riprova',
    groups: ['Medie mobili', 'Breakout', 'Dimensionamento', 'Costi e liquidità'],
    average: 'Tipo di media', sessions: 'sedute', day: 'giorno', days: 'giorni',
    controls: ['Finestra veloce', 'Finestra lenta', 'Finestra di ingresso', 'Finestra di uscita',
      'Ribilanciamento', 'Moltiplicatore rischio', 'Costo di transazione per lato',
      'Costo di roll annuale', 'Moltiplicatore liquidità'],
    updating: 'Aggiornamento dello scenario…', retained: 'Grafici e tabella mostrano l’ultimo scenario valido.',
    invalid: 'La finestra veloce deve essere più corta di quella lenta.',
    load: 'Impossibile caricare i dati della simulazione.', calculation: 'Impossibile calcolare lo scenario.',
    nav: 'Il valore del portafoglio non è positivo o non è calcolabile il',
    tableLabel: 'Metriche della strategia', metric: 'Metrica', benchmark: 'MSCI World Net Return USD',
    metrics: ['CAGR', 'Volatilità annualizzata', 'Sharpe', 'Sortino', 'Drawdown massimo', 'Durata media dei drawdown (giorni)'],
  },
  en: {
    title: 'Strategy sensitivity', retry: 'Retry',
    groups: ['Moving averages', 'Breakout', 'Position sizing', 'Costs and cash'],
    average: 'Average type', sessions: 'sessions', day: 'day', days: 'days',
    controls: ['Fast window', 'Slow window', 'Entry window', 'Exit window',
      'Rebalancing', 'Risk multiplier', 'Transaction cost per side',
      'Annual roll cost', 'Cash multiplier'],
    updating: 'Updating scenario…', retained: 'Charts and table show the last valid scenario.',
    invalid: 'The fast window must be shorter than the slow window.',
    load: 'Could not load the simulation data.', calculation: 'Could not calculate this scenario.',
    nav: 'Portfolio NAV is not positive or could not be calculated on',
    tableLabel: 'Strategy metrics', metric: 'Metric', benchmark: 'MSCI World Net Return USD',
    metrics: ['CAGR', 'Annualized volatility', 'Sharpe', 'Sortino', 'Maximum drawdown', 'Average drawdown duration (days)'],
  },
}

const sliders = [
  ['fast', 2, 250, 1, 'sessions'], ['slow', 3, 300, 1, 'sessions'],
  ['entry', 1, 300, 1, 'sessions'], ['exit', 1, 300, 1, 'sessions'],
  ['rebalanceDays', 1, 30, 1, 'days'], ['riskMultiplier', 0, 2, 0.05, '×'],
  ['transactionBps', 0, 50, 0.5, 'bp'], ['rollPercent', 0, 5, 0.05, '%'],
  ['cashMultiplier', 0, 2, 0.05, '×'],
] as const
const groupSliders = [[0, 1], [2, 3], [4, 5], [6, 7, 8]]
const minIntervalMs = 90

export function TrendFollowingDashboard({ language = 'it' }: { language?: Language }) {
  const t = copy[language]
  const locale = language === 'it' ? 'it-IT' : 'en-US'
  const statusId = useId()
  const section = useRef<HTMLElement>(null)
  const [settings, setSettings] = useState(defaultTrendSettings)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<TrendResult>()
  const [retry, setRetry] = useState(0)
  const latest = useRef<TrendRequest>({ id: 0, settings: defaultTrendSettings })
  const dragging = useRef(false)
  const schedule = useRef<(immediate: boolean) => void>()

  useEffect(() => {
    let worker: Worker | undefined, observer: IntersectionObserver | undefined
    let activeId: number | undefined, sentId: number | undefined
    let timer: number | undefined, lastStart = -Infinity, urgent = false, failed = false
    const dispatch = () => {
      window.clearTimeout(timer)
      const { id, settings } = latest.current
      if (settings.fast >= settings.slow) { urgent = false; return }
      if (failed) { setStatus('load'); return }
      if (!worker) return
      if (sentId === id) { urgent = false; return }
      if (activeId !== undefined) return
      const delay = lastStart + minIntervalMs - performance.now()
      if (!urgent && delay > 0) {
        timer = window.setTimeout(dispatch, delay)
        return
      }
      urgent = false
      activeId = sentId = id
      lastStart = performance.now()
      worker.postMessage(latest.current)
    }
    schedule.current = immediate => { urgent ||= immediate; dispatch() }
    const fail = () => {
      failed = true
      worker?.terminate()
      worker = undefined
      setStatus(latest.current.settings.fast >= latest.current.settings.slow ? 'invalid' : 'load')
    }
    const start = () => {
      observer?.disconnect()
      try {
        worker = new Worker(new URL('../../lib/trend-following.worker.ts', import.meta.url))
        worker.onerror = fail
        worker.onmessageerror = fail
        worker.onmessage = ({ data }: MessageEvent<TrendReply>) => {
          activeId = undefined
          if (data.id === latest.current.id) {
            if ('result' in data) { setResult(data.result); setStatus('ready') }
            else setStatus(data.error === 'nav' ? { day: data.day } : data.error)
          }
          dispatch()
        }
        const { fast, slow } = latest.current.settings
        setStatus(fast < slow ? 'updating' : 'invalid')
        dispatch()
      } catch {
        fail()
      }
    }
    const settle = () => {
      if (!dragging.current) return
      dragging.current = false
      schedule.current?.(true)
    }
    window.addEventListener('pointerup', settle)
    window.addEventListener('pointercancel', settle)
    if (retry > 0 || !('IntersectionObserver' in window)) start()
    else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start()
      }, { rootMargin: '400px' })
      if (section.current) observer.observe(section.current)
    }
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerup', settle)
      window.removeEventListener('pointercancel', settle)
      observer?.disconnect()
      worker?.terminate()
      schedule.current = undefined
    }
  }, [retry])

  function change(values: Partial<TrendSettings>, immediate = !dragging.current) {
    const next = { ...latest.current.settings, ...values }
    latest.current = { id: latest.current.id + 1, settings: next }
    setSettings(next)
    setStatus(next.fast >= next.slow ? 'invalid' : 'updating')
    schedule.current?.(immediate)
  }

  const message = typeof status === 'object'
    ? `${t.nav} ${new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(status.day * 86_400_000)}.`
    : status === 'idle' || status === 'ready' ? '' : t[status]
  const fmt = (value: number, decimals = 0) => new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value)
  const metric = (value: number | null, i: number) => value === null ? '—'
    : [0, 1, 4].includes(i) ? new Intl.NumberFormat(locale, {
      style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value) : fmt(value, 2)

  return (
    <section ref={section} className={styles.dashboard} lang={language} aria-label={t.title}>
      <div className={styles.groups}>
        {t.groups.map((group, g) => <fieldset key={group} className={g === 3 ? styles.costControls : undefined}>
          <legend>{group}</legend>
          {g === 0 && <label className={styles.control}>
            <span>{t.average}</span>
            <select value={settings.maType} onChange={event => change({ maType: event.target.value === 'sma' ? 'sma' : 'ema' }, true)}>
              <option value="ema">EMA</option><option value="sma">SMA</option>
            </select>
          </label>}
          {groupSliders[g].map(i => {
            const [key, min, max, step, unit] = sliders[i]
            const suffix = unit === 'days' ? (settings[key] === 1 ? t.day : t.days)
              : unit === 'sessions' ? t.sessions : unit
            const value = `${fmt(settings[key], step < 1 ? 2 : 0)}${suffix === '%' || suffix === '×' ? '' : ' '}${suffix}`
            const isWindow = key === 'fast' || key === 'slow'
            return <label key={key} className={styles.control}>
              <span>{t.controls[i]}</span>
              <output aria-hidden="true">{value}</output>
              <input type="range" min={min} max={max} step={step} value={settings[key]}
                aria-valuetext={value} aria-invalid={isWindow && status === 'invalid' || undefined}
                aria-describedby={isWindow && status === 'invalid' ? statusId : undefined}
                onPointerDown={() => { dragging.current = true }}
                onChange={event => change({ [key]: Number(event.target.value) })} />
            </label>
          })}
        </fieldset>)}
      </div>
      <div className={styles.status}>
        <span id={statusId} role="status">{message}{message && result && ` ${t.retained}`}</span>
        {status === 'load' && <button type="button" onClick={() => setRetry(value => value + 1)}>{t.retry}</button>}
      </div>
      {result && <>
        <Plot {...result} language={language} />
        <table className={styles.table} aria-label={t.tableLabel}>
          <thead><tr><th scope="col">{t.metric}</th><th scope="col">Trend Following</th><th scope="col">{t.benchmark}</th></tr></thead>
          <tbody>{t.metrics.map((label, i) => <tr key={label}>
            <th scope="row">{label}</th><td>{metric(result.trendMetrics[i], i)}</td><td>{metric(result.benchmarkMetrics[i], i)}</td>
          </tr>)}</tbody>
        </table>
      </>}
    </section>
  )
}
