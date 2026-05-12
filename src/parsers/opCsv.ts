import Papa from 'papaparse'
import type { Transaction } from '../types'

async function hashId(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

function parseDate(raw: string): string {
  // OP format: DD.MM.YYYY or YYYY-MM-DD
  if (raw.includes('.')) {
    const [d, m, y] = raw.split('.')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return raw
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, '').replace(',', '.'))
}

export async function parseOpCsv(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[]
          const txs: Transaction[] = []
          for (const row of rows) {
            // OP Bank CSV columns vary by export version — try multiple column name variants
            const dateRaw = row['Kirjauspäivä'] || row['Date'] || row['Päivämäärä'] || ''
            const amountRaw = row['Määrä'] || row['Amount'] || row['Summa'] || ''
            const description = row['Saaja/Maksaja'] || row['Selite'] || row['Description'] || row['Payee'] || ''
            if (!dateRaw || !amountRaw) continue
            const date = parseDate(dateRaw.trim())
            const amount = parseAmount(amountRaw.trim())
            const id = await hashId(`${date}|${amount}|${description}`)
            txs.push({ id, date, amount, description: description.trim(), category: '', account: 'op' })
          }
          resolve(txs)
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}
