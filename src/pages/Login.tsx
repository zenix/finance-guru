import { startLogin } from '../auth/google'
import { Button } from '../components/ui/Button'

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">💳</div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Personal Finance</h1>
      <p className="text-slate-400 text-sm mb-8 max-w-xs">
        Your data stays encrypted in your Google Drive — nobody else can read it.
      </p>
      <Button onClick={startLogin} size="md">
        Sign in with Google
      </Button>
      <p className="text-xs text-slate-600 mt-6 max-w-xs">
        Requires Google Drive access to store your encrypted data. No server involved.
      </p>
    </div>
  )
}
