import { BarChart as RC, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface Props {
  data: { label: string; income?: number; expense?: number; value?: number }[]
  format?: (v: number) => string
  stackedIncomeExpense?: boolean
}

export function BarChartWidget({ data, format = (v) => v.toFixed(0), stackedIncomeExpense }: Props) {
  if (stackedIncomeExpense) {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <RC data={data} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={format} width={60} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
            formatter={(v, name) => [format(Math.abs(v as number)), name as string]}
          />
          <ReferenceLine y={0} stroke="#334155" />
          <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </RC>
      </ResponsiveContainer>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RC data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={format} width={60} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
          formatter={(v) => [format(v as number), 'Value']}
        />
        <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </RC>
    </ResponsiveContainer>
  )
}
