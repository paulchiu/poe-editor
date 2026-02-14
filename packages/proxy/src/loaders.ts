
export async function loadAsset(
  path: string,
  assets: Fetcher | undefined,
  fallbackUrl: string
): Promise<ArrayBuffer> {
  let response: Response

  if (assets) {
    // Use the binding to fetch local assets directly (bypassing network)
    // path is expected to be relative like '/proxy/fonts/...'
    // The binding expects a request to a domain it handles, often just needs the path if correctly bound,
    // but typically we construct a full URL. `assets.fetch` handles requests.
    // In previous steps we used `http://assets${path}` which worked.
    const url = `http://assets${path}`
    response = await assets.fetch(url)
  } else {
    // Fallback: fetch from the provided fallback URL (CDN or other)
    console.log(`[loadAsset] Fallback for ${path} => ${fallbackUrl}`)
    response = await fetch(fallbackUrl)
  }

  if (!response.ok) {
    const attemptedUrl = assets ? `http://assets${path}` : fallbackUrl
    console.error(`[loadAsset] Failed to fetch: ${attemptedUrl} (Status: ${response.status})`)
    throw new Error(
      `Failed to fetch asset ${path}: ${response.status} ${response.statusText} (${attemptedUrl})`
    )
  }

  return await response.arrayBuffer()
}

export async function loadImageAsBase64(
  path: string,
  assets: Fetcher | undefined,
  fallbackUrl: string
): Promise<string> {
  const buffer = await loadAsset(path, assets, fallbackUrl)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return `data:image/png;base64,${base64}`
}
