import { PieChart as RC, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Slice {
  name: string
  value: number
  color: string
}

export function PieChartWidget({ data, format = (v) => v.toFixed(0) }: { data: Slice[]; format?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RC>
        <Pie data={data} cx="50%" cy="45%" outerRadius={75} dataKey="value" strokeWidth={0}>
          {data.map((s, i) => <Cell key={i} fill={s.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
          formatter={(v, name) => [format(v as number), name as string]}
        />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
      </RC>
    </ResponsiveContainer>
  )
}
