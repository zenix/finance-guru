export function eur(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(value)
}

export function pct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function num(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fi-FI', { maximumFractionDigits: decimals }).format(value)
}

export function shortDate(iso: string): string {
  return iso.slice(5) // MM-DD
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`
}

export function getLast12Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
