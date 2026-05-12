export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

export function ChangeChip({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={`text-xs font-medium tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}
