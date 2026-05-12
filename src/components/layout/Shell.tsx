import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/expenses', label: 'Expenses', icon: '💳' },
  { to: '/transactions', label: 'Transactions', icon: '≡' },
  { to: '/portfolio', label: 'Portfolio', icon: '📈' },
  { to: '/networth', label: 'Net Worth', icon: '⚖' },
  { to: '/import', label: 'Import', icon: '⬆' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Shell() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 px-1 z-50">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
