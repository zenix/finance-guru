import { useState } from 'react'
import { useStore } from '../store'
import { clearToken } from '../auth/google'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { Category } from '../types'

function uid() { return Math.random().toString(36).slice(2) }

export default function Settings() {
  const { settings, updateSettings, categories, setCategories, watchlist, removeFromWatchlist, userInfo, logout } = useStore()
  const [fmpKey, setFmpKey] = useState(settings.fmpApiKey)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')
  const [newCatIcon, setNewCatIcon] = useState('📦')

  function saveFmpKey() {
    updateSettings({ fmpApiKey: fmpKey.trim() })
  }

  function addKeyword(cat: Category) {
    if (!newKeyword.trim()) return
    const updated = { ...cat, keywords: [...cat.keywords, newKeyword.trim().toLowerCase()] }
    setCategories(categories.map(c => c.id === cat.id ? updated : c))
    setEditCat(updated)
    setNewKeyword('')
  }

  function removeKeyword(cat: Category, kw: string) {
    const updated = { ...cat, keywords: cat.keywords.filter(k => k !== kw) }
    setCategories(categories.map(c => c.id === cat.id ? updated : c))
    setEditCat(updated)
  }

  function addCategory() {
    if (!newCatName.trim()) return
    const cat: Category = { id: uid(), name: newCatName, color: newCatColor, icon: newCatIcon, keywords: [] }
    setCategories([...categories, cat])
    setNewCatName(''); setNewCatColor('#6366f1'); setNewCatIcon('📦')
    setAddCatOpen(false)
  }

  function handleLogout() {
    clearToken()
    logout()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Settings</h1>

      {userInfo && (
        <Card>
          <div className="flex items-center gap-3">
            {userInfo.picture && <img src={userInfo.picture} alt="" className="w-10 h-10 rounded-full" />}
            <div>
              <div className="text-sm text-slate-200 font-medium">{userInfo.name}</div>
              <div className="text-xs text-slate-500">{userInfo.email}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-auto">Sign out</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Financial Modeling Prep API Key</CardTitle>
        <p className="text-xs text-slate-500 mb-3">Free at financialmodelingprep.com — 250 calls/day</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={fmpKey}
            onChange={e => setFmpKey(e.target.value)}
            placeholder="Paste your API key"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <Button onClick={saveFmpKey} size="sm">Save</Button>
        </div>
        {settings.fmpApiKey && <p className="text-xs text-emerald-500 mt-2">✓ API key saved</p>}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Categories & Auto-categorization</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setAddCatOpen(true)}>+ Add</Button>
        </div>
        <div className="space-y-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setEditCat(cat)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left"
            >
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="text-sm text-slate-300">{cat.name}</span>
                <span className="text-xs text-slate-600">{cat.keywords.length} keywords</span>
              </div>
              <span className="text-xs text-slate-500">→</span>
            </button>
          ))}
        </div>
      </Card>

      {watchlist.length > 0 && (
        <Card>
          <CardTitle>Watchlist</CardTitle>
          <div className="space-y-2">
            {watchlist.map(ticker => (
              <div key={ticker} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 font-medium">{ticker}</span>
                <button onClick={() => removeFromWatchlist(ticker)} className="text-slate-600 hover:text-red-400 text-sm">Remove</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!editCat} onClose={() => { setEditCat(null); setNewKeyword('') }} title={`Edit: ${editCat?.name}`}>
        {editCat && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-2">Auto-match keywords (description must contain)</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editCat.keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-300">
                    {kw}
                    <button onClick={() => removeKeyword(editCat, kw)} className="text-slate-500 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Add keyword"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword(editCat)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <Button size="sm" onClick={() => addKeyword(editCat)}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addCatOpen} onClose={() => setAddCatOpen(false)} title="New Category">
        <div className="space-y-3">
          <input placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Icon</label>
              <input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Color</label>
              <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer" />
            </div>
          </div>
          <Button onClick={addCategory} disabled={!newCatName}>Create Category</Button>
        </div>
      </Modal>
    </div>
  )
}
