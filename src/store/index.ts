import { create } from 'zustand'
import type { Transaction, Category, Holding, StockTx, Liability, ManualAsset, PriceQuote, AppSettings } from '../types'
import { DEFAULT_CATEGORIES } from '../types'
import { loadData, saveData } from '../drive/client'
import { saveSalt, loadSalt } from '../drive/client'
import { encrypt } from '../crypto/aes'

export type AuthState = 'idle' | 'authenticated' | 'needs_passphrase' | 'loading'

interface PersistedData {
  transactions: Transaction[]
  holdings: Holding[]
  stockTxs: StockTx[]
  categories: Category[]
  watchlist: string[]
  liabilities: Liability[]
  manualAssets: ManualAsset[]
  settings: AppSettings
}

interface AppState extends PersistedData {
  authState: AuthState
  userInfo: { email: string; name: string; picture: string } | null
  prices: Record<string, PriceQuote>
  passphrase: string
  salt: string
  error: string | null

  setAuthState: (s: AuthState) => void
  setUserInfo: (u: AppState['userInfo']) => void
  setError: (e: string | null) => void

  initFromDrive: (passphrase: string) => Promise<void>
  setupPassphrase: (passphrase: string) => Promise<void>

  addTransactions: (txs: Transaction[]) => void
  updateTransactionCategory: (id: string, category: string) => void
  setHoldings: (h: Holding[]) => void
  addStockTxs: (txs: StockTx[]) => void
  setCategories: (cats: Category[]) => void
  addToWatchlist: (ticker: string) => void
  removeFromWatchlist: (ticker: string) => void
  setLiabilities: (l: Liability[]) => void
  setManualAssets: (a: ManualAsset[]) => void
  updateSettings: (s: Partial<AppSettings>) => void
  setPrices: (p: Record<string, PriceQuote>) => void
  updatePrice: (ticker: string, q: PriceQuote) => void
  logout: () => void
}

const DEFAULT_SETTINGS: AppSettings = { fmpApiKey: '', passphraseSet: false, defaultCurrency: 'EUR' }

function autoCategory(description: string, categories: Category[]): string {
  const lower = description.toLowerCase()
  for (const cat of categories) {
    if (cat.keywords.some(k => lower.includes(k.toLowerCase()))) return cat.id
  }
  return 'other'
}

export const useStore = create<AppState>((set, get) => ({
  authState: 'idle',
  userInfo: null,
  transactions: [],
  holdings: [],
  stockTxs: [],
  categories: DEFAULT_CATEGORIES,
  watchlist: [],
  liabilities: [],
  manualAssets: [],
  settings: DEFAULT_SETTINGS,
  prices: {},
  passphrase: '',
  salt: '',
  error: null,

  setAuthState: (authState) => set({ authState }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setError: (error) => set({ error }),

  initFromDrive: async (passphrase: string) => {
    set({ authState: 'loading', error: null })
    try {
      const salt = await loadSalt()
      if (!salt) {
        set({ authState: 'needs_passphrase' })
        return
      }
      const data = await loadData(passphrase)
      if (!data) {
        set({ authState: 'needs_passphrase' })
        return
      }
      const persisted = data as PersistedData
      set({
        ...persisted,
        categories: persisted.categories?.length ? persisted.categories : DEFAULT_CATEGORIES,
        passphrase,
        salt,
        authState: 'authenticated',
      })
    } catch {
      set({ authState: 'needs_passphrase', error: 'Could not decrypt — check your passphrase.' })
    }
  },

  setupPassphrase: async (passphrase: string) => {
    set({ authState: 'loading', error: null })
    try {
      const { salt } = await encrypt('init', passphrase)
      await saveSalt(salt)
      const state = get()
      const persisted: PersistedData = {
        transactions: state.transactions,
        holdings: state.holdings,
        stockTxs: state.stockTxs,
        categories: state.categories,
        watchlist: state.watchlist,
        liabilities: state.liabilities,
        manualAssets: state.manualAssets,
        settings: { ...state.settings, passphraseSet: true },
      }
      await saveData(persisted, passphrase, salt)
      set({ passphrase, salt, authState: 'authenticated', settings: persisted.settings })
    } catch (e) {
      set({ authState: 'idle', error: String(e) })
    }
  },

  _persist: async () => {
    const { transactions, holdings, stockTxs, categories, watchlist, liabilities, manualAssets, settings, passphrase, salt } = get()
    if (!passphrase || !salt) return
    const persisted: PersistedData = { transactions, holdings, stockTxs, categories, watchlist, liabilities, manualAssets, settings }
    await saveData(persisted, passphrase, salt).catch(console.error)
  },

  addTransactions: (incoming) => {
    const { categories } = get()
    const existing = get().transactions
    const existingIds = new Set(existing.map(t => t.id))
    const newTxs = incoming
      .filter(t => !existingIds.has(t.id))
      .map(t => ({ ...t, category: t.category || autoCategory(t.description, categories) }))
    const transactions = [...existing, ...newTxs].sort((a, b) => b.date.localeCompare(a.date))
    set({ transactions })
    ;(get() as any)._persist()
  },

  updateTransactionCategory: (id, category) => {
    set(s => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, category } : t) }))
    ;(get() as any)._persist()
  },

  setHoldings: (holdings) => { set({ holdings }); (get() as any)._persist() },

  addStockTxs: (incoming) => {
    const existing = get().stockTxs
    const existingIds = new Set(existing.map(t => t.id))
    const stockTxs = [...existing, ...incoming.filter(t => !existingIds.has(t.id))]
      .sort((a, b) => b.date.localeCompare(a.date))
    set({ stockTxs })
    ;(get() as any)._persist()
  },

  setCategories: (categories) => { set({ categories }); (get() as any)._persist() },

  addToWatchlist: (ticker) => {
    const watchlist = [...new Set([...get().watchlist, ticker.toUpperCase()])]
    set({ watchlist })
    ;(get() as any)._persist()
  },

  removeFromWatchlist: (ticker) => {
    set(s => ({ watchlist: s.watchlist.filter(t => t !== ticker) }))
    ;(get() as any)._persist()
  },

  setLiabilities: (liabilities) => { set({ liabilities }); (get() as any)._persist() },
  setManualAssets: (manualAssets) => { set({ manualAssets }); (get() as any)._persist() },

  updateSettings: (s) => {
    set(st => ({ settings: { ...st.settings, ...s } }))
    ;(get() as any)._persist()
  },

  setPrices: (prices) => set({ prices }),
  updatePrice: (ticker, q) => set(s => ({ prices: { ...s.prices, [ticker]: q } })),

  logout: () => {
    set({
      authState: 'idle',
      userInfo: null,
      passphrase: '',
      salt: '',
      transactions: [],
      holdings: [],
      stockTxs: [],
      categories: DEFAULT_CATEGORIES,
      watchlist: [],
      liabilities: [],
      manualAssets: [],
      settings: DEFAULT_SETTINGS,
      prices: {},
    })
  },
}))
