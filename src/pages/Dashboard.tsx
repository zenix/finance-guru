import { useMemo } from 'react'
import { useStore } from '../store'
import { Card, CardTitle, Stat } from '../components/ui/Card'
import { AreaChartWidget } from '../components/charts/AreaChart'
import { eur, getLast12Months, monthLabel } from '../utils/format'

export default function Dashboard() {
  const { transactions, holdings, liabilities, manualAssets, prices, categories } = useStore()

  const portfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const q = prices[h.ticker]
      const price = q ? q.price : h.avgPurchasePrice
      const rate = 1 // TODO: currency conversion handled via prices in EUR
      return sum + h.quantity * price * rate
    }, 0)
  }, [holdings, prices])

  const totalAssets = portfolioValue + manualAssets.reduce((s, a) => s + a.amount, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  const months = getLast12Months()
  const currentMonth = months[months.length - 1]

  const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth))
  const income = thisMonthTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = thisMonthTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const savings = income - expenses
  const savingsRate = income > 0 ? (savings / income) * 100 : 0

  const monthlyData = months.map(m => {
    const txs = transactions.filter(t => t.date.startsWith(m))
    const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    return { date: monthLabel(m + '-01'), value: inc - exp }
  })

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {}
    thisMonthTxs.filter(t => t.amount < 0).forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({ id, name: categories.find(c => c.id === id)?.name ?? id, amount }))
  }, [thisMonthTxs, categories])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Stat label="Net Worth" value={eur(netWorth, 0)} color={netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        </Card>
        <Card>
          <Stat label="Portfolio" value={eur(portfolioValue, 0)} />
        </Card>
        <Card>
          <Stat label="This Month Income" value={eur(income, 0)} color="text-emerald-400" />
        </Card>
        <Card>
          <Stat label="This Month Expenses" value={eur(expenses, 0)} color="text-red-400" />
        </Card>
        <Card>
          <Stat label="Savings" value={eur(savings, 0)} color={savings >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        </Card>
        <Card>
          <Stat label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} color={savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'} />
        </Card>
      </div>

      <Card>
        <CardTitle>Monthly Cash Flow (12 months)</CardTitle>
        <AreaChartWidget data={monthlyData} color="#6366f1" format={v => eur(v, 0)} />
      </Card>

      {topCategories.length > 0 && (
        <Card>
          <CardTitle>Top Expenses This Month</CardTitle>
          <div className="space-y-2">
            {topCategories.map(({ id, name, amount }) => {
              const cat = categories.find(c => c.id === id)
              return (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat?.icon ?? '📦'}</span>
                    <span className="text-sm text-slate-300">{name}</span>
                  </div>
                  <span className="text-sm font-medium text-red-400">{eur(amount, 0)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
