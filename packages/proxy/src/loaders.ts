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
  }

  // 2. Try R2 Bucket (Remote Dev / Fallback)
  if (bucket) {
    const key = path.replace(/^\//, '')
    const object = await bucket.get(key)
    if (object) {
      return await object.arrayBuffer()
    }
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
