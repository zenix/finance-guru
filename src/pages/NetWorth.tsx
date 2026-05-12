import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { eur } from '../utils/format'
import type { Liability, ManualAsset } from '../types'

function uid() { return Math.random().toString(36).slice(2) }

export default function NetWorth() {
  const { liabilities, manualAssets, holdings, prices, setLiabilities, setManualAssets } = useStore()
  const [addLiab, setAddLiab] = useState(false)
  const [addAsset, setAddAsset] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const portfolioValue = useMemo(() => {
    return holdings.reduce((s, h) => {
      const q = prices[h.ticker]
      return s + h.quantity * (q?.price ?? h.avgPurchasePrice)
    }, 0)
  }, [holdings, prices])

  const totalManual = manualAssets.reduce((s, a) => s + a.amount, 0)
  const totalAssets = portfolioValue + totalManual
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  function saveLiability() {
    const l: Liability = { id: uid(), name, amount: parseFloat(amount) || 0, currency: 'EUR' }
    setLiabilities([...liabilities, l])
    setName(''); setAmount(''); setAddLiab(false)
  }

  function saveAsset() {
    const a: ManualAsset = { id: uid(), name, amount: parseFloat(amount) || 0, currency: 'EUR' }
    setManualAssets([...manualAssets, a])
    setName(''); setAmount(''); setAddAsset(false)
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Net Worth</h1>

      <Card>
        <div className="text-xs text-slate-500 mb-1">Total Net Worth</div>
        <div className={`text-3xl font-bold tabular-nums ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {eur(netWorth, 0)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-slate-500 mb-1">Total Assets</div>
          <div className="text-xl font-semibold text-slate-100 tabular-nums">{eur(totalAssets, 0)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500 mb-1">Total Liabilities</div>
          <div className="text-xl font-semibold text-red-400 tabular-nums">{eur(totalLiabilities, 0)}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Assets</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setAddAsset(true)}>+ Add</Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">📈 Investment Portfolio</span>
            <span className="text-slate-200 tabular-nums">{eur(portfolioValue, 0)}</span>
          </div>
          {manualAssets.map(a => (
            <div key={a.id} className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🏦 {a.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-200 tabular-nums">{eur(a.amount, 0)}</span>
                <button onClick={() => setManualAssets(manualAssets.filter(x => x.id !== a.id))} className="text-slate-600 hover:text-red-400 text-xs">×</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Liabilities</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setAddLiab(true)}>+ Add</Button>
        </div>
        <div className="space-y-2">
          {liabilities.map(l => (
            <div key={l.id} className="flex justify-between text-sm">
              <span className="text-slate-400">📋 {l.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400 tabular-nums">{eur(l.amount, 0)}</span>
                <button onClick={() => setLiabilities(liabilities.filter(x => x.id !== l.id))} className="text-slate-600 hover:text-red-400 text-xs">×</button>
              </div>
            </div>
          ))}
          {liabilities.length === 0 && <p className="text-slate-600 text-sm">No liabilities added yet.</p>}
        </div>
      </Card>

      <Modal open={addLiab} onClose={() => setAddLiab(false)} title="Add Liability">
        <div className="space-y-3">
          <input placeholder="Name (e.g. Mortgage)" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
          <input type="number" placeholder="Amount (€)" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
          <Button onClick={saveLiability} disabled={!name || !amount}>Save</Button>
        </div>
      </Modal>

      <Modal open={addAsset} onClose={() => setAddAsset(false)} title="Add Manual Asset">
        <div className="space-y-3">
          <input placeholder="Name (e.g. Savings account)" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
          <input type="number" placeholder="Amount (€)" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
          <Button onClick={saveAsset} disabled={!name || !amount}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
