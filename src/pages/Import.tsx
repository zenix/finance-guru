import { useState, useRef } from 'react'
import { useStore } from '../store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { parseOpCsv } from '../parsers/opCsv'
import { parseNordnetCsv } from '../parsers/nordnetCsv'
import type { Transaction, Holding, StockTx } from '../types'

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error'

interface Preview {
  type: 'op' | 'nordnet'
  transactions?: Transaction[]
  holdings?: Holding[]
  stockTxs?: StockTx[]
  filename: string
}

export default function Import() {
  const { addTransactions, setHoldings, addStockTxs } = useStore()
  const [state, setState] = useState<ImportState>('idle')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState('')
  const [imported, setImported] = useState<{ txs: number; holdings: number; stockTxs: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function sniffType(headers: string): 'op' | 'nordnet' {
    const h = headers.toLowerCase()
    if (h.includes('kirjauspäivä') || h.includes('saaja/maksaja') || h.includes('tapahtumalaji')) return 'op'
    return 'nordnet'
  }

  async function handleFile(file: File) {
    setState('parsing')
    setError('')
    try {
      const text = await file.text()
      const firstLine = text.split('\n')[0]
      const type = sniffType(firstLine)

      if (type === 'op') {
        const transactions = await parseOpCsv(file)
        setPreview({ type: 'op', transactions, filename: file.name })
      } else {
        const { holdings, stockTxs } = await parseNordnetCsv(file)
        setPreview({ type: 'nordnet', holdings, stockTxs, filename: file.name })
      }
      setState('preview')
    } catch (e) {
      setError(String(e))
      setState('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function confirmImport() {
    if (!preview) return
    setState('importing')
    let txCount = 0, hCount = 0, stxCount = 0
    if (preview.type === 'op' && preview.transactions) {
      addTransactions(preview.transactions)
      txCount = preview.transactions.length
    } else if (preview.type === 'nordnet') {
      if (preview.holdings?.length) { setHoldings(preview.holdings); hCount = preview.holdings.length }
      if (preview.stockTxs?.length) { addStockTxs(preview.stockTxs); stxCount = preview.stockTxs.length }
    }
    setImported({ txs: txCount, holdings: hCount, stockTxs: stxCount })
    setPreview(null)
    setState('done')
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Import</h1>

      <Card>
        <div
          className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-3">⬆</div>
          <p className="text-slate-300 text-sm font-medium">Drop CSV file here or tap to browse</p>
          <p className="text-slate-500 text-xs mt-1">Supports OP Bank CSV and Nordnet CSV exports</p>
          <input ref={inputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </Card>

      {state === 'parsing' && (
        <div className="text-center text-slate-400 py-4">Parsing file…</div>
      )}

      {state === 'error' && (
        <Card className="border-red-800">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {state === 'preview' && preview && (
        <Card>
          <div className="text-xs text-slate-500 mb-3">{preview.filename}</div>
          <div className="space-y-2 mb-4">
            {preview.type === 'op' && preview.transactions && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Type</span><span className="text-slate-200">OP Bank transactions</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Rows found</span><span className="text-slate-200">{preview.transactions.length}</span></div>
                {preview.transactions.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Date range</span><span className="text-slate-200">{preview.transactions[preview.transactions.length - 1].date} – {preview.transactions[0].date}</span></div>
                  </>
                )}
              </>
            )}
            {preview.type === 'nordnet' && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Type</span><span className="text-slate-200">Nordnet export</span></div>
                {preview.holdings?.length ? <div className="flex justify-between text-sm"><span className="text-slate-400">Holdings</span><span className="text-slate-200">{preview.holdings.length} positions</span></div> : null}
                {preview.stockTxs?.length ? <div className="flex justify-between text-sm"><span className="text-slate-400">Transactions</span><span className="text-slate-200">{preview.stockTxs.length} rows</span></div> : null}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={confirmImport}>Confirm Import</Button>
            <Button variant="secondary" onClick={() => { setPreview(null); setState('idle') }}>Cancel</Button>
          </div>
        </Card>
      )}

      {state === 'done' && imported && (
        <Card className="border-emerald-800">
          <div className="text-emerald-400 font-medium mb-2">Import complete ✓</div>
          <div className="space-y-1 text-sm text-slate-400">
            {imported.txs > 0 && <div>{imported.txs} transactions imported</div>}
            {imported.holdings > 0 && <div>{imported.holdings} holdings updated</div>}
            {imported.stockTxs > 0 && <div>{imported.stockTxs} stock transactions imported</div>}
          </div>
          <Button className="mt-3" variant="secondary" size="sm" onClick={() => setState('idle')}>Import Another</Button>
        </Card>
      )}

      <Card>
        <div className="text-xs text-slate-500 font-medium mb-2">How to export</div>
        <div className="space-y-3 text-xs text-slate-400">
          <div>
            <div className="text-slate-300 font-medium mb-1">OP Bank</div>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Log in to op.fi</li>
              <li>Go to Accounts → Transactions</li>
              <li>Select date range → Export → CSV</li>
            </ol>
          </div>
          <div>
            <div className="text-slate-300 font-medium mb-1">Nordnet</div>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Log in to nordnet.fi</li>
              <li>Go to Portfolio → Holdings or Transactions</li>
              <li>Click Export → CSV</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
