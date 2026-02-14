import fs from 'fs/promises'
import path from 'path'
import type { Font } from 'satori'
import { generatePng, HomeImage, TwitterImage } from './generate'

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
  console.warn('Fetching fonts...')
  const playfair900 = await loadFont('playfair-black.woff')
  const playfair400 = await loadFont('playfair-regular.woff')

  const fonts: Font[] = [
    { name: 'Playfair Display', data: playfair900, weight: 900, style: 'normal' },
    { name: 'Playfair Display', data: playfair400, weight: 400, style: 'normal' },
  ]

  console.warn('Loading assets...')
  const splashSrc = await loadAsset('splash.png')

  // Output directory
  const outputDir = path.resolve(process.cwd(), '../app/public')

  console.warn(`Generating images to ${outputDir}...`)

  // Ensure output directory exists
  try {
    await fs.access(outputDir)
  } catch {
    await fs.mkdir(outputDir, { recursive: true })
  }

  // Generate OG Images
  console.warn('Generating og-home.png (1200x630)...')
  const homePng = await generatePng(<HomeImage splashSrc={splashSrc} />, 1200, 630, fonts)
  await fs.writeFile(path.join(outputDir, 'og-home.png'), homePng)

  console.warn('Generating og-twitter.png (1200x1200)...')
  const twitterPng = await generatePng(<TwitterImage splashSrc={splashSrc} />, 1200, 1200, fonts)
  await fs.writeFile(path.join(outputDir, 'og-twitter.png'), twitterPng)

  console.warn('Done!')
}

main().catch(console.error)
