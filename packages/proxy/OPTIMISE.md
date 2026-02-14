# OG Image Generation — Remaining Optimisation Ideas

Cloudflare Workers free plan has a **10ms CPU time limit**. The `@cf-wasm/og` pipeline (satori → resvg → PNG) is CPU-intensive. Below are further ideas to reduce generation time, ordered by expected impact.

## High Impact

### Pre-generate the home OG image at build time

The home variant is fully static — the text never changes. Generate it once during CI/deploy and serve it as a static asset (`/og-home.png`) instead of rendering on every request. This already happens in production via the redirect in `handleApiOg`, but the image itself could be generated offline rather than relying on a first-request render.

### Remove the splash image from the home variant

`loadImageAsBase64` reads 24KB from assets, converts it to a base64 string via `btoa(String.fromCharCode(...new Uint8Array(buffer)))` — the spread over a typed array is CPU-expensive. The image is rendered at 25% opacity as a subtle background element. Removing it eliminates both the I/O and the CPU cost of base64 encoding and satori's image compositing.

### Reduce output dimensions

The current output is 1200×630. Most social platforms downscale OG images. Rendering at 600×315 (half resolution) would reduce pixel count by 75%, dramatically cutting resvg's PNG encoding time. Test whether the quality loss is acceptable on target platforms (Twitter, Slack, Discord, iMessage).

## Medium Impact

### Subset fonts with `pyftsubset`

Even with `GoogleFont`, the Google Fonts API returns glyphs for the full Latin subset. For the home variant, only ~20 unique characters are used (`PoeMarkdownEditorModaleitngfr.v`). Use `pyftsubset` at build time to create a minimal `.woff` file and serve it via `CustomFont` instead of `GoogleFont` — avoids the Google Fonts fetch entirely.

```sh
pyftsubset PlayfairDisplay-Black.ttf \
  --text="PoeMarkdownEditorModaleitngfr.v" \
  --flavor=woff \
  --output-file=playfair-subset.woff
```

### Return SVG instead of PNG

`ImageResponse` supports `format: 'svg'` which skips the entire resvg PNG encoding step (the most CPU-intensive part). If the OG image is only used in `<meta>` tags and the target platforms accept SVG, this is a large win. However, most social platforms (Twitter, Facebook, Slack) **do not** support SVG for `og:image` — so this is only viable if you add a separate caching/conversion layer.

### Cache rendered responses at the edge

`@cf-wasm/og`'s `cache.serve()` API can cache responses in Cloudflare's Cache API. For the standard/twitter variants, the title+snippet combination is the cache key. This means the CPU-heavy render only happens once per unique URL, and subsequent requests are served from cache.

```ts
return cache.serve(request, async () => {
  return await ImageResponse.async(element, options)
})
```

## Low Impact

### Use fewer font weights

Each font weight satori processes adds CPU overhead for glyph path extraction. The home variant currently loads weight 400 and 900. If the subtitle/tagline can use weight 900 as well (or vice versa), a single font load would halve the font processing cost.

### Simplify the JSX tree

Satori's layout engine (Yoga WASM) processes every DOM node. The home variant has ~10 nested divs including decorative overlays (gradient, border). Flattening the tree or removing purely decorative elements (the border overlay, the gradient background) reduces layout computation time.

### Explore `@cf-wasm/og` v0.4+ improvements

The library is actively developed. Newer versions may include WASM binary optimisations or built-in font caching. Monitor the [changelog](https://github.com/fineshopdesign/cf-wasm/releases) for performance-related updates.

## Measuring

The `createPerfTracer` utility (in `src/perf.ts`) logs step-by-step CPU timing to the console. Use `wrangler tail` or the Workers dashboard to see real production timings:

```
[perf:generateOgImage] loadAssets: 1.2ms | ImageResponse: 5.3ms | total: 6.5ms
[perf:handleApiOg] verifySignature: 0.1ms | generateOgImage: 6.6ms | total: 6.7ms
```

Focus optimisation efforts on whichever step dominates.
