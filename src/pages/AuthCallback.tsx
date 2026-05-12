import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleCallback, getUserInfo } from '../auth/google'
import { loadSalt } from '../drive/client'
import { useStore } from '../store'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUserInfo, setAuthState, updateSettings, setError } = useStore()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errParam = params.get('error')

    if (errParam) { setError(errParam); navigate('/'); return }
    if (!code || !state) { navigate('/'); return }

    handleCallback(code, state)
      .then(async (token) => {
        const info = await getUserInfo(token)
        setUserInfo(info)
        // Check if this account already has encrypted data in Drive
        const salt = await loadSalt().catch(() => null)
        if (salt) {
          // Existing user — prompt for passphrase to decrypt
          updateSettings({ passphraseSet: true })
          setAuthState('needs_passphrase')
        } else {
          // New user — prompt to set up passphrase
          setAuthState('needs_passphrase')
        }
        navigate('/')
      })
      .catch(err => {
        setError(String(err))
        setAuthState('idle')
        navigate('/')
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Signing in…</div>
    </div>
  )
}
