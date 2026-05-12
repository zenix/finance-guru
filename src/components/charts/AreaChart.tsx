import { AreaChart as RC, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { date: string; value: number }[]
  color?: string
  format?: (v: number) => string
}

export function AreaChartWidget({ data, color = '#6366f1', format = (v) => v.toFixed(0) }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RC data={data}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={format} width={60} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
          formatter={(v) => [format(v as number), 'Value']}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill="url(#grad)" strokeWidth={2} dot={false} />
      </RC>
    </ResponsiveContainer>
  )
}
