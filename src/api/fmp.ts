import { useStore } from '../store'

const BASE = 'https://financialmodelingprep.com/api'

const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 60 * 60 * 1000 // 1 hour

function getKey(): string {
  return useStore.getState().settings.fmpApiKey
}

async function get<T>(path: string, cacheTtl = TTL): Promise<T> {
  const key = useStore.getState().settings.fmpApiKey
  const url = `${BASE}${path}&apikey=${key}`
  const hit = cache.get(url)
  if (hit && Date.now() - hit.ts < cacheTtl) return hit.data as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FMP ${res.status}: ${path}`)
  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data as T
}

export interface FmpQuote {
  symbol: string
  price: number
  change: number
  changesPercentage: number
  currency: string
  name: string
  marketCap: number
  volume: number
  avgVolume: number
  open: number
  previousClose: number
  eps: number
  pe: number
  earningsAnnouncement: string
  sharesOutstanding: number
  timestamp: number
}

export interface FmpHistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface FmpIncomeStatement {
  date: string
  period: string
  revenue: number
  grossProfit: number
  operatingIncome: number
  netIncome: number
  eps: number
  epsdiluted: number
  ebitda: number
}

export interface FmpBalanceSheet {
  date: string
  totalAssets: number
  totalLiabilities: number
  totalStockholdersEquity: number
  totalDebt: number
  cashAndCashEquivalents: number
}

export interface FmpCashFlow {
  date: string
  operatingCashFlow: number
  capitalExpenditure: number
  freeCashFlow: number
  dividendsPaid: number
}

export interface FmpKeyMetrics {
  date: string
  peRatio: number
  pbRatio: number
  evToEbitda: number
  debtToEquity: number
  returnOnEquity: number
  netProfitMargin: number
  dividendYield: number
  payoutRatio: number
  beta: number
}

export interface FmpRatios {
  date: string
  dividendYield: number
  payoutRatio: number
  returnOnEquity: number
  netProfitMargin: number
  debtEquityRatio: number
  priceEarningsRatio: number
  priceToBookRatio: number
}

export interface FmpEarnings {
  date: string
  symbol: string
  eps: number
  epsEstimated: number
  revenue: number
  revenueEstimated: number
  updatedFromDate: string
  fiscalDateEnding: string
}

export interface FmpAnalystEstimate {
  date: string
  estimatedRevenueLow: number
  estimatedRevenueHigh: number
  estimatedRevenueAvg: number
  estimatedEpsLow: number
  estimatedEpsHigh: number
  estimatedEpsAvg: number
  numberAnalystEstimatedRevenue: number
  numberAnalystsEstimatedEps: number
}

export interface FmpCompanyProfile {
  symbol: string
  companyName: string
  currency: string
  exchangeShortName: string
  industry: string
  sector: string
  description: string
  website: string
  image: string
  mktCap: number
  price: number
  beta: number
  volAvg: number
  lastDiv: number
  range: string
  changes: number
  dcfDiff: number
  dcf: number
  ipoDate: string
  isEtf: boolean
  country: string
}

export const fmp = {
  quote: (ticker: string) =>
    get<FmpQuote[]>(`/v3/quote/${ticker}?`, 5 * 60 * 1000).then(d => d[0]),

  quotes: (tickers: string[]) =>
    get<FmpQuote[]>(`/v3/quote/${tickers.join(',')}?`, 5 * 60 * 1000),

  history: (ticker: string, from?: string) =>
    get<{ historical: FmpHistoricalPrice[] }>(`/v3/historical-price-full/${ticker}?${from ? `from=${from}&` : ''}`).then(d => d.historical ?? []),

  profile: (ticker: string) =>
    get<FmpCompanyProfile[]>(`/v3/profile/${ticker}?`).then(d => d[0]),

  incomeStatement: (ticker: string, period: 'annual' | 'quarter' = 'annual') =>
    get<FmpIncomeStatement[]>(`/v3/income-statement/${ticker}?period=${period}&limit=10&`),

  balanceSheet: (ticker: string, period: 'annual' | 'quarter' = 'annual') =>
    get<FmpBalanceSheet[]>(`/v3/balance-sheet-statement/${ticker}?period=${period}&limit=10&`),

  cashFlow: (ticker: string, period: 'annual' | 'quarter' = 'annual') =>
    get<FmpCashFlow[]>(`/v3/cash-flow-statement/${ticker}?period=${period}&limit=10&`),

  keyMetrics: (ticker: string) =>
    get<FmpKeyMetrics[]>(`/v3/key-metrics/${ticker}?limit=1&`).then(d => d[0]),

  ratios: (ticker: string) =>
    get<FmpRatios[]>(`/v3/ratios/${ticker}?limit=1&`).then(d => d[0]),

  earnings: (ticker: string) =>
    get<FmpEarnings[]>(`/v3/earnings-surprises/${ticker}?`),

  analystEstimates: (ticker: string) =>
    get<FmpAnalystEstimate[]>(`/v3/analyst-estimates/${ticker}?limit=4&`),

  earningsCalendar: (from: string, to: string) =>
    get<{ date: string; symbol: string; eps: number; epsEstimated: number }[]>(`/v3/earning_calendar?from=${from}&to=${to}&`),

  exchangeRate: (from: string, to = 'EUR') =>
    get<{ open: number }[]>(`/v3/fx/${from}${to}?`, 30 * 60 * 1000).then(d => d[0]?.open ?? 1),
}

// Keep fmpKey in scope for compatibility
export { getKey }
