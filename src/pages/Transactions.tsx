import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { eur } from '../utils/format'
import type { Transaction } from '../types'

export default function Transactions() {
  const { transactions, categories, updateTransactionCategory } = useStore()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [page, setPage] = useState(0)
  const PAGE = 50

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCat && t.category !== filterCat) return false
      if (filterMonth && !t.date.startsWith(filterMonth)) return false
      return true
    })
  }, [transactions, search, filterCat, filterMonth])

  const page_txs = filtered.slice(page * PAGE, (page + 1) * PAGE)
  const totalPages = Math.ceil(filtered.length / PAGE)

  const months = useMemo(() => [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse(), [transactions])

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-slate-100">Transactions</h1>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2">
          <select
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(0) }}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select
            value={filterMonth}
            onChange={e => { setFilterMonth(e.target.value); setPage(0) }}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none"
          >
            <option value="">All months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="text-xs text-slate-500">{filtered.length} transactions</div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {page_txs.map(t => {
            const cat = categories.find(c => c.id === t.category)
            return (
              <button
                key={t.id}
                onClick={() => setEditing(t)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0">{cat?.icon ?? '📦'}</span>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-200 truncate">{t.description}</div>
                    <div className="text-xs text-slate-500">{t.date}</div>
                  </div>
                </div>
                <span className={`text-sm font-medium tabular-nums ml-3 shrink-0 ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {eur(t.amount)}
                </span>
              </button>
            )
          })}
          {page_txs.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No transactions found</div>
          )}
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="text-sm text-indigo-400 disabled:text-slate-600">← Prev</button>
          <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="text-sm text-indigo-400 disabled:text-slate-600">Next →</button>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Change Category">
        {editing && (
          <div className="space-y-2">
            <div className="text-sm text-slate-300 mb-3">{editing.description}</div>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { updateTransactionCategory(editing.id, c.id); setEditing(null) }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${editing.category === c.id ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
