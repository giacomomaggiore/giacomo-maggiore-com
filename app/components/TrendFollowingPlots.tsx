'use client'

import { useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import styles from './TrendFollowingPlots.module.css'

const dayMs = 86_400_000
const epochDay = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / dayMs
const scale = 1000

const text = {
  it: {
    growth: 'Crescita di 100 USD',
    trend: 'Trend following su futures',
    benchmark: 'MSCI World Net Return USD',
    correlation: 'Correlazione mobile a 252 sedute',
    unavailable: 'non disponibile',
  },
  en: {
    growth: 'Growth of USD 100',
    trend: 'Trend Following',
    benchmark: 'MSCI World Net Return USD',
    correlation: '252-session rolling correlation',
    unavailable: 'unavailable',
  },
}

type Series = (number | null)[]
type Position = { x: number; y: number; style: string }

function nearestSession(dates: number[], day: number) {
  let left = 0
  let right = dates.length - 1
  while (left < right) {
    const middle = Math.floor((left + right) / 2)
    if (dates[middle] < day) left = middle + 1
    else right = middle
  }
  return left > 0 && day - dates[left - 1] <= dates[left] - day ? left - 1 : left
}

function seriesPath(values: Series, x: number[], y: (value: number) => number) {
  let path = ''
  let connected = false
  for (let i = 0; i < x.length; i++) {
    const value = values[i]
    if (value == null || !Number.isFinite(value)) {
      connected = false
      continue
    }
    const next = values[i + 1]
    const isolated = !connected && (next == null || !Number.isFinite(next) || i === x.length - 1)
    path += `${connected ? 'L' : 'M'}${x[i].toFixed(2)} ${y(value).toFixed(2)}${isolated ? 'l0 .001' : ''}`
    connected = true
  }
  return path
}

const toPercent = (position: number) => `${position / 10}%`
const correlationY = (value: number) => (1 - value) * scale / 2

export function TrendFollowingPlots({ dates, trend, benchmark, correlation, language }: {
  dates: number[]
  trend: number[]
  benchmark: number[]
  correlation: Series
  language: 'it' | 'en'
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activePanel, setActivePanel] = useState<'growth' | 'correlation' | null>(null)
  const t = text[language]
  const locale = language === 'it' ? 'it-IT' : 'en-US'
  const { dateFormat, numberFormat, tickFormat } = useMemo(() => ({
    dateFormat: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }),
    numberFormat: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    tickFormat: new Intl.NumberFormat(locale),
  }), [locale])
  const start = dates[0] ?? 0
  const end = dates[dates.length - 1] ?? start
  const span = Math.max(1, end - start)
  const time = useMemo(() => {
    const x = (day: number) => (day - start) / span * scale
    return {
      sessions: dates.map(x),
      ticks: [2006, 2011, 2016, 2021].flatMap(year => {
        const day = epochDay(year, 1, 1)
        return day > start && day < end ? [{ year, x: x(day) }] : []
      }),
    }
  }, [dates, start, end, span])
  const growth = useMemo(() => {
    let max = 100
    for (const series of [trend, benchmark]) {
      for (const value of series) if (Number.isFinite(value)) max = Math.max(value, max)
    }
    const roughStep = max / 4
    const magnitude = 10 ** Math.floor(Math.log10(roughStep))
    const step = ([1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= roughStep) ?? 10) * magnitude
    const ceiling = Math.ceil(max / step) * step
    const y = (value: number) => (1 - value / ceiling) * scale
    return {
      y,
      ticks: Array.from({ length: Math.round(ceiling / step) + 1 }, (_, index) => index * step),
      trendPath: seriesPath(trend, time.sessions, y),
      benchmarkPath: seriesPath(benchmark, time.sessions, y),
    }
  }, [trend, benchmark, time.sessions])
  const correlationPath = useMemo(() => seriesPath(correlation, time.sessions, correlationY), [correlation, time.sessions])

  if (dates.length === 0) return null

  const selected = selectedDay === null ? null : nearestSession(dates, selectedDay)
  const cursorX = selected === null ? null : time.sessions[selected]
  const dateLabel = selected === null ? '—' : dateFormat.format(dates[selected] * dayMs)
  const dataLabel = (series: Series) => {
    const value = selected === null ? null : series[selected]
    return value == null || !Number.isFinite(value) ? '—' : numberFormat.format(value)
  }
  const trendLabel = dataLabel(trend)
  const benchmarkLabel = dataLabel(benchmark)
  const correlationLabel = dataLabel(correlation)
  const describe = (label: string, value: string) => `${label}: ${value === '—' ? t.unavailable : value}`

  function onPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' && !event.buttons && event.type === 'pointermove') return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width) return
    const position = (event.clientX - bounds.left) / bounds.width
    const day = start + position * span
    setSelectedDay(dates[nearestSession(dates, day)])
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let index = selected ?? dates.length - 1
    switch (event.key) {
      case 'ArrowLeft': case 'ArrowDown': index--; break
      case 'ArrowRight': case 'ArrowUp': index++; break
      case 'PageDown': index -= 21; break
      case 'PageUp': index += 21; break
      case 'Home': index = 0; break
      case 'End': index = dates.length - 1; break
      default: return
    }
    event.preventDefault()
    setSelectedDay(dates[Math.max(0, Math.min(dates.length - 1, index))])
  }

  function point(series: Series, y: (value: number) => number, style: string): Position[] {
    if (selected === null || cursorX === null) return []
    const value = series[selected]
    return value == null || !Number.isFinite(value) ? [] : [{ x: cursorX, y: y(value), style }]
  }

  function panel({ name, ticks, y, points, children, correlationPanel = false, description }: {
    name: string; ticks: number[]; y: (value: number) => number; points: Position[]; children: ReactNode;
    correlationPanel?: boolean; description: string;
  }) {
    const panelKey = correlationPanel ? 'correlation' : 'growth'
    const selectPointer = (event: PointerEvent<HTMLDivElement>) => {
      setActivePanel(panelKey)
      onPointer(event)
    }
    return (
      <div className={styles.panel}>
        <div className={styles.yAxis} aria-hidden="true">
          {ticks.map(value => <span key={value} style={{ top: toPercent(y(value)) }}>
            {value > 0 && correlationPanel ? '+' : ''}{tickFormat.format(value).replace('-', '−')}
          </span>)}
        </div>
        <div className={`${styles.plot} ${correlationPanel ? styles.lower : styles.upper}`}
          role="slider" tabIndex={0} aria-label={name} aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown PageUp PageDown Home End"
          aria-valuemin={1} aria-valuemax={dates.length} aria-valuenow={(selected ?? dates.length - 1) + 1}
          aria-valuetext={selected === null ? undefined : `${dateLabel}; ${description}`}
          onFocus={() => { setSelectedDay(day => day ?? end); setActivePanel(panelKey) }}
          onBlur={() => setActivePanel(current => current === panelKey ? null : current)}
          onKeyDown={event => { setActivePanel(panelKey); onKeyDown(event) }}
          onPointerMove={selectPointer} onPointerDown={selectPointer}
          onPointerLeave={event => {
            if (event.pointerType === 'mouse' && document.activeElement !== event.currentTarget) setActivePanel(null)
          }}
        >
          <svg className={styles.svg} viewBox={`0 0 ${scale} ${scale}`} preserveAspectRatio="none" aria-hidden="true">
            {ticks.map(value => <line key={value} x1={0} x2={scale} y1={y(value)} y2={y(value)}
              className={correlationPanel && value === 0 ? styles.zeroLine : styles.gridLine} />)}
            {children}
          </svg>
          {correlationPanel ? <span className={`${styles.correlationLegend} ${styles.correlation}`} aria-hidden="true">
            {name}
          </span> : <div className={styles.seriesLegend} aria-hidden="true">
            <span><i className={styles.trend} />{t.trend}</span>
            <span><i className={styles.benchmark} />{t.benchmark}</span>
          </div>}
          {cursorX !== null && <span className={styles.cursorLine} style={{ left: toPercent(cursorX) }} aria-hidden="true" />}
          {points.map(({ x, y, style }) => <span key={style} className={`${styles.dot} ${style}`}
            style={{ left: toPercent(x), top: toPercent(y) }} aria-hidden="true" />)}
          {cursorX !== null && activePanel === panelKey && <div className={styles.tooltip}
            style={cursorX < scale / 2 ? { right: 6 } : { left: 6 }} aria-hidden="true">
            <strong>{dateLabel}</strong>
            {correlationPanel ? <span>{correlationLabel}</span> : <>
              <span className={styles.trend}>Trend <b>{trendLabel}</b></span>
              <span className={styles.benchmark}>MSCI <b>{benchmarkLabel}</b></span>
            </>}
          </div>}
        </div>
        {correlationPanel && <div className={styles.xAxis} aria-hidden="true">
          <span>{new Date(start * dayMs).getUTCFullYear()}</span>
          {time.ticks.map(({ year, x }) => <span key={year} className={year === 2006 || year === 2021 ? styles.wideTick : ''}
            style={{ left: toPercent(x) }}>{year}</span>)}
          <span>{new Date(end * dayMs).getUTCFullYear()}</span>
        </div>}
      </div>
    )
  }

  return (
    <div className={styles.plots}>
      {panel({
        name: t.growth, ticks: growth.ticks, y: growth.y,
        description: `${describe(t.trend, trendLabel)}; ${describe(t.benchmark, benchmarkLabel)}`,
        points: [...point(trend, growth.y, styles.trend), ...point(benchmark, growth.y, styles.benchmark)],
        children: <><path className={`${styles.series} ${styles.benchmark}`} d={growth.benchmarkPath} />
          <path className={`${styles.series} ${styles.trend}`} d={growth.trendPath} /></>,
      })}
      {panel({
        name: t.correlation, ticks: [1, 0.5, 0, -0.5, -1], y: correlationY, correlationPanel: true,
        description: describe(t.correlation, correlationLabel), points: point(correlation, correlationY, styles.correlation),
        children: <path className={`${styles.series} ${styles.correlation}`} d={correlationPath} />,
      })}
    </div>
  )
}
