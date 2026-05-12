import { useMemo } from 'react'
import { useStore } from '../store'
import { Card, CardTitle } from '../components/ui/Card'
import { BarChartWidget } from '../components/charts/BarChart'
import { PieChartWidget } from '../components/charts/PieChart'
import { eur, getLast12Months, monthLabel } from '../utils/format'

export default function Expenses() {
  const { transactions, categories } = useStore()

  const months = getLast12Months()

  const monthlyData = months.map(m => {
    const txs = transactions.filter(t => t.date.startsWith(m))
    const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    return { label: monthLabel(m + '-01'), income, expense }
  })

  const currentMonth = months[months.length - 1]
  const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth) && t.amount < 0)

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    thisMonthTxs.forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id)
        return { name: cat?.name ?? id, value, color: cat?.color ?? '#6b7280', icon: cat?.icon ?? '📦', budget: cat?.budget, id }
      })
  }, [thisMonthTxs, categories])

  const totalExpenses = categoryData.reduce((s, c) => s + c.value, 0)

  const recurring = useMemo(() => {
    const descCount: Record<string, number> = {}
    transactions.filter(t => t.amount < 0).forEach(t => {
      const key = t.description.toLowerCase().slice(0, 20)
      descCount[key] = (descCount[key] ?? 0) + 1
    })
    return Object.entries(descCount)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key)
  }, [transactions])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Expenses</h1>

      <Card>
        <CardTitle>Income vs Expenses (12 months)</CardTitle>
        <BarChartWidget data={monthlyData} stackedIncomeExpense format={v => eur(v, 0)} />
      </Card>

      <Card>
        <CardTitle>This Month by Category</CardTitle>
        {categoryData.length > 0
          ? <PieChartWidget data={categoryData} format={v => eur(v, 0)} />
          : <p className="text-slate-500 text-sm">No expense data for this month.</p>
        }
      </Card>

      {categoryData.length > 0 && (
        <Card>
          <CardTitle>Category Breakdown</CardTitle>
          <div className="space-y-3">
            {categoryData.map(({ id, name, value, color, icon, budget }) => {
              const pct = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
              const overBudget = budget && value > budget
              return (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="text-sm text-slate-300">{name}</span>
                      {overBudget && <span className="text-xs text-red-400">over budget</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-100">{eur(value, 0)}</span>
                      {budget && <span className="text-xs text-slate-500 ml-1">/ {eur(budget, 0)}</span>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: overBudget ? '#ef4444' : color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {recurring.length > 0 && (
        <Card>
          <CardTitle>Detected Recurring Expenses</CardTitle>
          <div className="space-y-1">
            {recurring.map(r => (
              <div key={r} className="text-sm text-slate-400 flex items-center gap-2">
                <span className="text-slate-600">↻</span>
                <span className="capitalize">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
