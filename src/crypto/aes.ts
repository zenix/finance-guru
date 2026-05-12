const PBKDF2_ITERATIONS = 310_000
const SALT_LEN = 16
const IV_LEN = 12

function buf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(plaintext: string, passphrase: string, saltB64?: string): Promise<{ ciphertext: string; salt: string }> {
  const salt = saltB64 ? buf(saltB64) : crypto.getRandomValues(new Uint8Array(SALT_LEN)).buffer
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(passphrase, salt)
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  const out = new Uint8Array(IV_LEN + encrypted.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(encrypted), IV_LEN)
  return { ciphertext: b64(out.buffer), salt: b64(salt) }
}

export async function decrypt(ciphertext: string, passphrase: string, saltB64: string): Promise<string> {
  const data = new Uint8Array(buf(ciphertext))
  const iv = data.slice(0, IV_LEN)
  const payload = data.slice(IV_LEN)
  const key = await deriveKey(passphrase, buf(saltB64))
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload)
  return new TextDecoder().decode(decrypted)
}
