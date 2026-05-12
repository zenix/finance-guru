import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Card, CardTitle } from '../components/ui/Card'
import { PieChartWidget } from '../components/charts/PieChart'
import { ChangeChip } from '../components/ui/Badge'
import { eur, pct } from '../utils/format'
import { fmp } from '../api/fmp'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6']

export default function Portfolio() {
  const { holdings, prices, settings, updatePrice } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!settings.fmpApiKey || !holdings.length) return
    const tickers = holdings.map(h => h.ticker)
    fmp.quotes(tickers)
      .then(quotes => {
        quotes.forEach(q => {
          updatePrice(q.symbol, { price: q.price, change: q.change, changePercent: q.changesPercentage, currency: q.currency ?? 'EUR', updatedAt: Date.now() })
        })
      })
      .catch(console.error)
  }, [holdings.map(h => h.ticker).join(','), settings.fmpApiKey])

  const rows = useMemo(() => {
    return holdings.map((h, i) => {
      const q = prices[h.ticker]
      const price = q?.price ?? h.avgPurchasePrice
      const value = h.quantity * price
      const cost = h.quantity * h.avgPurchasePrice
      const gain = value - cost
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0
      return { ...h, price, value, gain, gainPct, quote: q, color: COLORS[i % COLORS.length] }
    }).sort((a, b) => b.value - a.value)
  }, [holdings, prices])

  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalGain = rows.reduce((s, r) => s + r.gain, 0)
  const totalCost = rows.reduce((s, r) => s + r.quantity * r.avgPurchasePrice, 0)
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const pieData = rows.map(r => ({ name: r.ticker, value: r.value, color: r.color }))

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-bold text-slate-100">Portfolio</h1>
        {!settings.fmpApiKey && (
          <span className="text-xs text-amber-400">Set FMP API key in Settings</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-slate-500">Total Value</div>
          <div className="text-xl font-semibold tabular-nums text-slate-100">{eur(totalValue, 0)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Total Gain</div>
          <div className={`text-xl font-semibold tabular-nums ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {eur(totalGain, 0)}
          </div>
          <div className={`text-xs ${totalGainPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pct(totalGainPct)}</div>
        </Card>
      </div>

      {pieData.length > 0 && (
        <Card>
          <CardTitle>Allocation</CardTitle>
          <PieChartWidget data={pieData} format={v => eur(v, 0)} />
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <CardTitle>Holdings</CardTitle>
        </div>
        <div className="divide-y divide-slate-800">
          {rows.map(r => (
            <button
              key={r.ticker}
              onClick={() => navigate(`/stock/${r.ticker}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 text-left"
            >
              <div>
                <div className="text-sm font-medium text-slate-200">{r.ticker}</div>
                <div className="text-xs text-slate-500">{r.name}</div>
                <div className="text-xs text-slate-500">{r.quantity} × {eur(r.price)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-100 tabular-nums">{eur(r.value, 0)}</div>
                <div className={`text-xs tabular-nums ${r.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {eur(r.gain, 0)} ({pct(r.gainPct)})
                </div>
                {r.quote && <ChangeChip value={r.quote.changePercent} />}
              </div>
            </button>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No holdings yet. Import a Nordnet CSV to get started.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
