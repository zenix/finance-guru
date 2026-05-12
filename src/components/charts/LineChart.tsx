import { LineChart as RC, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface Series {
  key: string
  color: string
  label: string
}

interface Props {
  data: Record<string, unknown>[]
  series: Series[]
  format?: (v: number) => string
  referenceY?: number
}

export function LineChartWidget({ data, series, format = (v) => v.toFixed(0), referenceY }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RC data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={format} width={60} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
          formatter={(v, name) => [format(v as number), name as string]}
        />
        {referenceY !== undefined && <ReferenceLine y={referenceY} stroke="#475569" strokeDasharray="4 2" />}
        {series.map(s => (
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={s.label} />
        ))}
      </RC>
    </ResponsiveContainer>
  )
}
