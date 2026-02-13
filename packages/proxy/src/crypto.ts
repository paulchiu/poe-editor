
/**
 * Generates an HMAC SHA-256 signature for the given parameters
 * @param title - The document title to sign
 * @param snippet - The document snippet to sign
 * @param platform - The platform variant
 * @param secret - The secret key for signing
 * @returns A hex-encoded HMAC SHA-256 signature
 */
export async function generateSignature(
  title: string,
  snippet: string,
  platform: string | null,
  secret: string
): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Include platform in the signature if it exists
  const data = JSON.stringify({ title, snippet, platform: platform || '' })
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies the signature matches the parameters
 * @param title - The document title to verify
 * @param snippet - The document snippet to verify
 * @param platform - The platform variant
 * @param signature - The signature to verify
 * @param secret - The secret key for verification
 * @returns True if the signature is valid, false otherwise
 */
export async function verifySignature(
  title: string,
  snippet: string,
  platform: string | null,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(title, snippet, platform, secret)
  return signature === expectedSignature
}
