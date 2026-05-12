import { useState } from 'react'
import { useStore } from '../store'
import { Button } from '../components/ui/Button'

export default function Passphrase({ isNew }: { isNew: boolean }) {
  const { initFromDrive, setupPassphrase, error } = useStore()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  async function handleSubmit() {
    if (isNew) {
      if (pass.length < 8) { setValidationError('Passphrase must be at least 8 characters.'); return }
      if (pass !== confirm) { setValidationError('Passphrases do not match.'); return }
    }
    setValidationError('')
    setLoading(true)
    if (isNew) {
      await setupPassphrase(pass)
    } else {
      await initFromDrive(pass)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-4xl mb-4 text-center">🔐</div>
        <h1 className="text-xl font-bold text-slate-100 mb-1 text-center">
          {isNew ? 'Set Your Passphrase' : 'Enter Your Passphrase'}
        </h1>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isNew
            ? 'Choose a strong passphrase. It encrypts all your data — never forgotten or reset.'
            : 'Enter your passphrase to decrypt your data from Google Drive.'}
        </p>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Passphrase"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isNew && handleSubmit()}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {isNew && (
            <input
              type="password"
              placeholder="Confirm passphrase"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          )}

          {(validationError || error) && (
            <p className="text-red-400 text-sm">{validationError || error}</p>
          )}

          <Button onClick={handleSubmit} disabled={loading || !pass} className="w-full justify-center">
            {loading ? 'Loading…' : isNew ? 'Set Passphrase' : 'Unlock'}
          </Button>
        </div>
      </div>
    </div>
  )
}
