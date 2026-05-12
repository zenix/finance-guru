import Papa from 'papaparse'
import type { Holding, StockTx } from '../types'

async function hashId(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

function parseNum(s: string): number {
  return parseFloat((s || '0').replace(/\s/g, '').replace(',', '.')) || 0
}

function parseDate(s: string): string {
  // Nordnet format: YYYY-MM-DD
  return s?.trim().slice(0, 10) || ''
}

export interface NordnetParseResult {
  holdings: Holding[]
  stockTxs: StockTx[]
}

export async function parseNordnetCsv(file: File): Promise<NordnetParseResult> {
  return new Promise((resolve, reject) => {
    // Nordnet exports with tab separator and BOM
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[]
          if (!rows.length) { resolve({ holdings: [], stockTxs: [] }); return }

          // Detect if this is a holdings export or transaction export by checking columns
          const cols = Object.keys(rows[0])
          const isHoldings = cols.some(c => c.toLowerCase().includes('antal') || c.toLowerCase().includes('quantity'))
            && !cols.some(c => c.toLowerCase().includes('transaktionstyp') || c.toLowerCase().includes('transaction type'))

          if (isHoldings) {
            const holdings: Holding[] = rows.map(row => {
              const ticker = (row['Värdepapper'] || row['Instrument'] || row['Symbol'] || '').trim()
              const name = (row['Namn'] || row['Name'] || ticker).trim()
              const quantity = parseNum(row['Antal'] || row['Quantity'] || '0')
              const avgPrice = parseNum(row['Genomsnittligt anskaffningsvärde'] || row['Average acquisition price'] || row['Köpkurs'] || '0')
              const currency = (row['Valuta'] || row['Currency'] || 'EUR').trim() as 'EUR' | 'USD' | 'SEK'
              return { ticker, name, quantity, avgPurchasePrice: avgPrice, currency }
            }).filter(h => h.ticker && h.quantity > 0)
            resolve({ holdings, stockTxs: [] })
          } else {
            const stockTxs: StockTx[] = []
            for (const row of rows) {
              const dateRaw = row['Bokföringsdag'] || row['Trade date'] || row['Handelsdatum'] || ''
              const typeRaw = (row['Transaktionstyp'] || row['Transaction type'] || '').toLowerCase()
              const ticker = (row['Värdepapper'] || row['Instrument'] || row['Symbol'] || '').trim()
              const quantity = parseNum(row['Antal'] || row['Quantity'] || '0')
              const price = parseNum(row['Kurs'] || row['Price'] || '0')
              const currency = (row['Valuta'] || row['Currency'] || 'EUR').trim()

              let type: StockTx['type'] = 'buy'
              if (typeRaw.includes('sälj') || typeRaw.includes('sell')) type = 'sell'
              else if (typeRaw.includes('utdelning') || typeRaw.includes('dividend')) type = 'dividend'
              else if (typeRaw.includes('köp') || typeRaw.includes('buy')) type = 'buy'
              else continue

              if (!ticker || !dateRaw) continue
              const date = parseDate(dateRaw)
              const id = await hashId(`${date}|${ticker}|${type}|${quantity}|${price}`)
              stockTxs.push({ id, date, ticker, type, quantity, price, currency })
            }
            resolve({ holdings: [], stockTxs })
          }
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}
