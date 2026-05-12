import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useStore } from './store'
import Shell from './components/layout/Shell'
import Login from './pages/Login'
import Passphrase from './pages/Passphrase'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Transactions from './pages/Transactions'
import Portfolio from './pages/Portfolio'
import StockDetail from './pages/StockDetail'
import Import from './pages/Import'
import NetWorth from './pages/NetWorth'
import Settings from './pages/Settings'

function AuthGate() {
  const authState = useStore(s => s.authState)
  const passphraseSet = useStore(s => s.settings.passphraseSet)

  if (authState === 'idle') return <Login />
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    )
  }
  if (authState === 'needs_passphrase') {
    return <Passphrase isNew={!passphraseSet} />
  }

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<AuthGate />}>
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
            <Route path="/networth" element={<NetWorth />} />
            <Route path="/import" element={<Import />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
