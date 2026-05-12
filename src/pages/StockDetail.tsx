import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Card, CardTitle } from '../components/ui/Card'
import { AreaChartWidget } from '../components/charts/AreaChart'
import { BarChartWidget } from '../components/charts/BarChart'
import { ChangeChip } from '../components/ui/Badge'
import { eur, pct, shortDate } from '../utils/format'
import { fmp } from '../api/fmp'
import type { FmpQuote, FmpHistoricalPrice, FmpIncomeStatement, FmpKeyMetrics, FmpEarnings, FmpCompanyProfile } from '../api/fmp'

type Period = '1W' | '1M' | '6M' | '1Y' | '5Y'

const PERIOD_DAYS: Record<Period, number> = { '1W': 7, '1M': 30, '6M': 180, '1Y': 365, '5Y': 1825 }

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const { holdings, settings, addToWatchlist, removeFromWatchlist, watchlist } = useStore()
  const [period, setPeriod] = useState<Period>('1Y')
  const [sellQty, setSellQty] = useState('')

  const [quote, setQuote] = useState<FmpQuote | null>(null)
  const [history, setHistory] = useState<FmpHistoricalPrice[]>([])
  const [income, setIncome] = useState<FmpIncomeStatement[]>([])
  const [metrics, setMetrics] = useState<FmpKeyMetrics | null>(null)
  const [earnings, setEarnings] = useState<FmpEarnings[]>([])
  const [profile, setProfile] = useState<FmpCompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const holding = holdings.find(h => h.ticker === ticker)
  const inWatchlist = watchlist.includes(ticker ?? '')

  useEffect(() => {
    if (!ticker || !settings.fmpApiKey) return
    setLoading(true)
    Promise.all([
      fmp.quote(ticker),
      fmp.history(ticker, daysAgo(PERIOD_DAYS[period])),
      fmp.incomeStatement(ticker),
      fmp.keyMetrics(ticker),
      fmp.earnings(ticker),
      fmp.profile(ticker),
    ]).then(([q, hist, inc, km, earn, prof]) => {
      setQuote(q)
      setHistory(hist.slice().reverse())
      setIncome(inc)
      setMetrics(km)
      setEarnings(earn)
      setProfile(prof)
    }).catch(console.error).finally(() => setLoading(false))
  }, [ticker, period, settings.fmpApiKey])

  const histData = history.map(h => ({ date: shortDate(h.date), value: h.close }))

  const cost = holding ? holding.quantity * holding.avgPurchasePrice : 0
  const currentVal = holding && quote ? holding.quantity * quote.price : 0
  const unrealizedGain = currentVal - cost

  const sellQtyNum = parseFloat(sellQty) || 0
  const grossProceeds = sellQtyNum * (quote?.price ?? 0)
  const gainOnSale = sellQtyNum * ((quote?.price ?? 0) - (holding?.avgPurchasePrice ?? 0))
  const taxEst = gainOnSale > 0 ? (Math.min(gainOnSale, 30000) * 0.30 + Math.max(0, gainOnSale - 30000) * 0.34) : 0

  if (!settings.fmpApiKey) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-400 mb-4">← Back</button>
        <p className="text-slate-400 text-sm">Set your FMP API key in Settings to view stock data.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">{ticker}</h1>
          {profile && <p className="text-xs text-slate-500">{profile.companyName} · {profile.exchangeShortName}</p>}
        </div>
        <button
          onClick={() => inWatchlist ? removeFromWatchlist(ticker!) : addToWatchlist(ticker!)}
          className={`text-sm ${inWatchlist ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {inWatchlist ? '★' : '☆'}
        </button>
      </div>

      {quote && (
        <Card>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold tabular-nums text-slate-100">{eur(quote.price)}</div>
            <div className="mb-1"><ChangeChip value={quote.changesPercentage} /></div>
            <div className={`mb-1 text-sm tabular-nums ${quote.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {quote.change >= 0 ? '+' : ''}{eur(quote.change)}
            </div>
          </div>
        </Card>
      )}

      {holding && (
        <Card>
          <CardTitle>Your Position</CardTitle>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><div className="text-slate-500 text-xs">Shares</div><div className="text-slate-100">{holding.quantity}</div></div>
            <div><div className="text-slate-500 text-xs">Avg Cost</div><div className="text-slate-100">{eur(holding.avgPurchasePrice)}</div></div>
            <div><div className="text-slate-500 text-xs">Value</div><div className="text-slate-100">{eur(currentVal, 0)}</div></div>
            <div><div className="text-slate-500 text-xs">Gain</div><div className={unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'}>{eur(unrealizedGain, 0)}</div></div>
            <div><div className="text-slate-500 text-xs">Return</div><div className={unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'}>{cost > 0 ? pct((unrealizedGain / cost) * 100) : '—'}</div></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex gap-2 mb-3">
          {(['1W','1M','6M','1Y','5Y'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs px-2 py-1 rounded ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {p}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-600">Loading…</div>
        ) : (
          <AreaChartWidget data={histData} color="#6366f1" format={v => eur(v)} />
        )}
      </Card>

      {metrics && (
        <Card>
          <CardTitle>Key Figures</CardTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              ['P/E', metrics.peRatio?.toFixed(1) ?? '—'],
              ['P/B', metrics.pbRatio?.toFixed(2) ?? '—'],
              ['EV/EBITDA', metrics.evToEbitda?.toFixed(1) ?? '—'],
              ['D/E', metrics.debtToEquity?.toFixed(2) ?? '—'],
              ['ROE', metrics.returnOnEquity ? pct(metrics.returnOnEquity * 100) : '—'],
              ['Net Margin', metrics.netProfitMargin ? pct(metrics.netProfitMargin * 100) : '—'],
              ['Div Yield', metrics.dividendYield ? pct(metrics.dividendYield * 100) : '—'],
              ['Beta', metrics.beta?.toFixed(2) ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-800 py-1">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-200 tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {earnings.length > 0 && (
        <Card>
          <CardTitle>Quarterly Earnings</CardTitle>
          <BarChartWidget
            data={earnings.slice(0, 8).reverse().map(e => ({ label: e.date.slice(0, 7), value: e.eps }))}
            format={v => `€${v.toFixed(2)}`}
          />
          <div className="mt-3 space-y-1">
            {earnings.slice(0, 4).map(e => {
              const surprise = e.epsEstimated !== 0 ? ((e.eps - e.epsEstimated) / Math.abs(e.epsEstimated)) * 100 : 0
              return (
                <div key={e.date} className="flex items-center justify-between text-xs text-slate-400">
                  <span>{e.date.slice(0, 7)}</span>
                  <span>EPS {e.eps?.toFixed(2)} vs est {e.epsEstimated?.toFixed(2)}</span>
                  <span className={surprise >= 0 ? 'text-emerald-400' : 'text-red-400'}>{pct(surprise)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {income.length > 0 && (
        <Card>
          <CardTitle>Income Statement (Annual)</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <td className="pb-2">Year</td>
                  <td className="pb-2 text-right">Revenue</td>
                  <td className="pb-2 text-right">Net Inc.</td>
                  <td className="pb-2 text-right">EPS</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {income.slice(0, 5).map(r => (
                  <tr key={r.date} className="text-slate-300">
                    <td className="py-1.5">{r.date.slice(0, 4)}</td>
                    <td className="py-1.5 text-right tabular-nums">{eur(r.revenue / 1e6, 0)}M</td>
                    <td className="py-1.5 text-right tabular-nums">{eur(r.netIncome / 1e6, 0)}M</td>
                    <td className="py-1.5 text-right tabular-nums">{r.epsdiluted?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {holding && quote && (
        <Card>
          <CardTitle>Finnish Capital Gains Calculator</CardTitle>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Shares to sell</label>
              <input
                type="number"
                value={sellQty}
                onChange={e => setSellQty(e.target.value)}
                max={holding.quantity}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder={`Max ${holding.quantity}`}
              />
            </div>
            {sellQtyNum > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Gross proceeds</span><span className="text-slate-200">{eur(grossProceeds)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gain</span><span className={gainOnSale >= 0 ? 'text-emerald-400' : 'text-red-400'}>{eur(gainOnSale)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Est. Finnish tax (30/34%)</span><span className="text-red-400">{taxEst > 0 ? eur(taxEst) : '—'}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400 font-medium">Net after tax</span><span className="text-slate-100 font-medium">{eur(grossProceeds - taxEst)}</span></div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
