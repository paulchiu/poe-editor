import React from 'react'
import satori, { type Font } from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { OgImage } from './components'
import { HOME_CONFIG, TWITTER_CONFIG } from './config'

/**
 * Generate a PNG image from a React element using Satori and Resvg
 * @param element - React element to render
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param fonts - Array of font definitions for Satori
 * @returns PNG image as Buffer
 */
export async function generatePng(
  element: React.ReactNode,
  width: number,
  height: number,
  fonts: Font[]
): Promise<Buffer> {
  const svg = await satori(element, { width, height, fonts })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const pngData = resvg.render()
  return pngData.asPng()
}

/**
 * Home page OG image (1200x630)
 * @param splashSrc - Base64 or URL of the splash image
 * @returns React element for home OG image
 */
export const HomeImage = ({ splashSrc }: { splashSrc: string }) => (
  <OgImage splashSrc={splashSrc} config={HOME_CONFIG} />
)

/**
 * Twitter OG image (1200x1200)
 * @param splashSrc - Base64 or URL of the splash image
 * @returns React element for Twitter OG image
 */
export const TwitterImage = ({ splashSrc }: { splashSrc: string }) => (
  <OgImage splashSrc={splashSrc} config={TWITTER_CONFIG} />
)
