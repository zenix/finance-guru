import { encrypt, decrypt } from '../crypto/aes'
import { getToken } from '../auth/google'

const DATA_FILENAME = 'finance.json.enc'
const SALT_FILENAME = 'finance.salt'
const APPDATA = 'appDataFolder'

async function authHeaders() {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}` }
}

async function findFile(name: string): Promise<string | null> {
  const headers = await authHeaders()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=${APPDATA}&q=${encodeURIComponent(`name='${name}'`)}&fields=files(id)`,
    { headers },
  )
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function readFile(fileId: string): Promise<string> {
  const headers = await authHeaders()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers },
  )
  return res.text()
}

async function writeFile(name: string, content: string, fileId?: string | null): Promise<void> {
  const headers = await authHeaders()
  const meta = { name, parents: fileId ? undefined : [APPDATA] }
  const blob = new Blob([content], { type: 'text/plain' })
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('media', blob)

  if (fileId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers,
      body: form,
    })
  } else {
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers,
      body: form,
    })
  }
}

export async function loadSalt(): Promise<string | null> {
  const id = await findFile(SALT_FILENAME)
  if (!id) return null
  return readFile(id)
}

export async function saveSalt(salt: string): Promise<void> {
  const id = await findFile(SALT_FILENAME)
  await writeFile(SALT_FILENAME, salt, id)
}

export async function loadData(passphrase: string): Promise<object | null> {
  const [saltId, dataId] = await Promise.all([findFile(SALT_FILENAME), findFile(DATA_FILENAME)])
  if (!saltId || !dataId) return null
  const [salt, ciphertext] = await Promise.all([readFile(saltId), readFile(dataId)])
  const plaintext = await decrypt(ciphertext, passphrase, salt)
  return JSON.parse(plaintext)
}

export async function saveData(data: object, passphrase: string, salt: string): Promise<void> {
  const plaintext = JSON.stringify(data)
  const { ciphertext } = await encrypt(plaintext, passphrase, salt)
  const fileId = await findFile(DATA_FILENAME)
  await writeFile(DATA_FILENAME, ciphertext, fileId)
}
