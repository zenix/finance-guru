export interface Transaction {
  id: string
  date: string
  amount: number
  description: string
  category: string
  account: 'op'
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  budget?: number
  keywords: string[]
}

export interface Holding {
  ticker: string
  name: string
  quantity: number
  avgPurchasePrice: number
  currency: 'EUR' | 'USD' | 'SEK'
}

export interface StockTx {
  id: string
  date: string
  ticker: string
  type: 'buy' | 'sell' | 'dividend'
  quantity: number
  price: number
  currency: string
}

export interface Liability {
  id: string
  name: string
  amount: number
  currency: 'EUR'
}

export interface ManualAsset {
  id: string
  name: string
  amount: number
  currency: 'EUR'
}

export interface PriceQuote {
  price: number
  change: number
  changePercent: number
  currency: string
  updatedAt: number
}

export interface AppSettings {
  fmpApiKey: string
  passphraseSet: boolean
  defaultCurrency: 'EUR'
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', color: '#22c55e', icon: '🛒', keywords: ['s-market', 'k-market', 'lidl', 'alepa', 'prisma', 'siwa'] },
  { id: 'transport', name: 'Transport', color: '#3b82f6', icon: '🚌', keywords: ['hsl', 'vr ', 'parking', 'pysäköinti', 'taksi', 'uber'] },
  { id: 'restaurants', name: 'Restaurants', color: '#f97316', icon: '🍽️', keywords: ['ravintola', 'restaurant', 'cafe', 'kahvila', 'pizzeria', 'mcdonalds', 'subway'] },
  { id: 'housing', name: 'Housing', color: '#8b5cf6', icon: '🏠', keywords: ['vuokra', 'rent', 'vastike', 'water', 'vesi', 'electricity', 'sähkö'] },
  { id: 'utilities', name: 'Utilities', color: '#06b6d4', icon: '💡', keywords: ['telia', 'elisa', 'dna ', 'netflix', 'spotify', 'amazon', 'google', 'apple'] },
  { id: 'healthcare', name: 'Healthcare', color: '#ef4444', icon: '💊', keywords: ['apteekki', 'pharmacy', 'lääkäri', 'doctor', 'hammaslääkäri'] },
  { id: 'entertainment', name: 'Entertainment', color: '#eab308', icon: '🎬', keywords: ['elokuva', 'cinema', 'teatteri', 'konsertti', 'concert'] },
  { id: 'travel', name: 'Travel', color: '#14b8a6', icon: '✈️', keywords: ['finnair', 'ryanair', 'airbnb', 'booking', 'hotelli', 'hotel'] },
  { id: 'clothing', name: 'Clothing', color: '#ec4899', icon: '👕', keywords: ['h&m', 'zara', 'uniqlo', 'stadium', 'intersport'] },
  { id: 'income', name: 'Income', color: '#10b981', icon: '💰', keywords: ['palkka', 'salary', 'palkkio'] },
  { id: 'other', name: 'Other', color: '#6b7280', icon: '📦', keywords: [] },
]
