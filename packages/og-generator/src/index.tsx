import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'
import { generatePng, HomeImage } from './generate'

const require = createRequire(import.meta.url)

// Font loading helper
async function loadFont(fontPath: string): Promise<Buffer> {
  // Fonts are now in packages/og-generator/fonts
  const fullPath = path.resolve(process.cwd(), 'fonts', fontPath)
  return fs.readFile(fullPath)
}

// Asset loading helper
async function loadAsset(assetPath: string): Promise<string> {
  const fullPath = path.resolve(process.cwd(), 'assets', assetPath)
  const buffer = await fs.readFile(fullPath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function main() {
  console.log('Fetching fonts...')
  const playfair900 = await loadFont('playfair-black.woff')
  const playfair400 = await loadFont('playfair-regular.woff')
  // Inter fonts are no longer needed for the Home design if we only use one

  const fonts = [
    { name: 'Playfair Display', data: playfair900, weight: 900, style: 'normal' },
    { name: 'Playfair Display', data: playfair400, weight: 400, style: 'normal' },
  ] as any[]

  console.log('Loading assets...')
  const splashSrc = await loadAsset('splash.png')

  // Output directory
  const outputDir = path.resolve(process.cwd(), '../app/public')

  console.log(`Generating images to ${outputDir}...`)

  // Ensure output directory exists
  try {
      await fs.access(outputDir)
  } catch {
      await fs.mkdir(outputDir, { recursive: true })
  }

  // Generate Single Image (og-home.png)
  console.log('Generating og-home.png...')
  const homePng = await generatePng(<HomeImage splashSrc={splashSrc} />, 1200, 630, fonts)
  await fs.writeFile(path.join(outputDir, 'og-home.png'), homePng)

  console.log('Done!')
}

main().catch(console.error)
