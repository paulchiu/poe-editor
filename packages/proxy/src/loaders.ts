
export async function loadAsset(
  path: string,
  assets: Fetcher | undefined,
  bucket: R2Bucket | undefined
): Promise<ArrayBuffer> {
  // 1. Try Workers Assets (Production / Local)
  if (assets) {
    const url = `http://assets${path}`
    const response = await assets.fetch(url)
    if (response.ok) {
      return await response.arrayBuffer()
    }
    console.warn(`[loadAsset] ASSETS fetch failed for ${path} (${response.status})`)
  }

  // 2. Try R2 Bucket (Remote Dev / Fallback)
  if (bucket) {
    // Remove leading slash for key
    const key = path.replace(/^\//, '')
    const object = await bucket.get(key)
    if (object) {
      console.log(`[loadAsset] Served from R2: ${key}`)
      return await object.arrayBuffer() // R2ObjectBody has arrayBuffer()
    }
    console.warn(`[loadAsset] R2 Bucket lookup failed for ${key}`)
  }

  throw new Error(`Failed to load asset ${path} from ASSETS or R2`)
}

export async function loadImageAsBase64(
  path: string,
  assets: Fetcher | undefined,
  bucket: R2Bucket | undefined
): Promise<string> {
  const buffer = await loadAsset(path, assets, bucket)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return `data:image/png;base64,${base64}`
}
