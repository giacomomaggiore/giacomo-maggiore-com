import { createTrendBacktest, InvalidTrendNav, type TrendData, type TrendResult, type TrendSettings } from './trend-following'

export type TrendRequest = { id: number; settings: TrendSettings }
export type TrendReply = { id: number } & (
  { result: TrendResult } | { error: 'nav'; day: number } | { error: 'load' | 'calculation' }
)

let backtest: ReturnType<typeof createTrendBacktest> | undefined

self.onmessage = async ({ data: { id, settings } }: MessageEvent<TrendRequest>) => {
  if (!backtest) {
    try {
      const response = await fetch('/data/trend-following-v1.json')
      if (!response.ok) throw new Error('Missing trend dataset')
      const data: TrendData = await response.json()
      if (data.version !== 1) throw new Error('Unexpected trend dataset version')
      backtest = createTrendBacktest(data)
    } catch {
      self.postMessage({ id, error: 'load' } satisfies TrendReply)
      return
    }
  }
  try {
    self.postMessage({ id, result: backtest(settings) } satisfies TrendReply)
  } catch (error) {
    self.postMessage(error instanceof InvalidTrendNav
      ? { id, error: 'nav', day: error.day } satisfies TrendReply
      : { id, error: 'calculation' } satisfies TrendReply)
  }
}
