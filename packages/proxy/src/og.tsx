import { ImageResponse } from '@cf-wasm/og'
import { createElement } from 'react'
import { SPLASH_IMAGE_PATH } from './assets'
import { loadAsset, loadImageAsBase64 } from './loaders'
import { Env } from './utils'

/**
 * Generates an OG image using ImageResponse
 * @param title - The title text
 * @param snippet - The snippet text
 * @param platform - The platform variant (home, twitter, or undefined)
 * @param env - The Worker environment
 * @returns ImageResponse object
 */
export async function generateOgImage(
  title: string,
  snippet: string,
  platform: string | null,
  env: Env
): Promise<Response> {
  // Common fonts
  const interFontUrl = '/proxy/fonts/inter-regular.woff'
  const interBoldUrl = '/proxy/fonts/inter-bold.woff'

  // Home Page Design
  if (platform === 'home') {
    const playfairRegularUrl = '/proxy/fonts/playfair-regular.woff'
    const playfairBlackUrl = '/proxy/fonts/playfair-black.woff'
    const playfairItalicUrl = '/proxy/fonts/playfair-italic.woff'

    // Fallbacks
    if (
      !env.CDN_URL_PLAYFAIR_REGULAR ||
      !env.CDN_URL_PLAYFAIR_BLACK ||
      !env.CDN_URL_PLAYFAIR_ITALIC ||
      !env.CDN_URL_SPLASH_IMAGE
    ) {
      throw new Error('Missing one or more CDN URLs for Home page assets')
    }

    const [playfairRegular, playfairBlack, playfairItalic, splashImageBase64] = await Promise.all([
      loadAsset(playfairRegularUrl, env.ASSETS, env.CDN_URL_PLAYFAIR_REGULAR),
      loadAsset(playfairBlackUrl, env.ASSETS, env.CDN_URL_PLAYFAIR_BLACK),
      loadAsset(playfairItalicUrl, env.ASSETS, env.CDN_URL_PLAYFAIR_ITALIC),
      loadImageAsBase64(SPLASH_IMAGE_PATH, env.ASSETS, env.CDN_URL_SPLASH_IMAGE),
    ])

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '1200px',
            height: '630px',
            overflow: 'hidden',
            backgroundColor: '#050508',
            color: 'white',
            fontFamily: '"Playfair Display"',
          }}
        >
          {/* Background Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(to bottom right, #1a1610, #0c0a08, #000000)',
            }}
          />

          {/* Ghostly Illustration */}
          <div
            style={{
              position: 'absolute',
              right: '-50px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '700px',
              height: '700px',
              opacity: 0.25,
              display: 'flex',
            }}
          >
            {/* Using img tag with pre-fetched base64 data to avoid network loopback */}
            <img
              src={splashImageBase64}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Content Container */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              paddingLeft: '96px', // px-24
              maxWidth: '800px',
            }}
          >
            {/* Main Title Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1
                style={{
                  fontSize: '130px',
                  lineHeight: '0.9',
                  fontWeight: 900,
                  color: 'white',
                  margin: 0,
                }}
              >
                Poe
              </h1>
              <h2
                style={{
                  fontSize: '48px', // text-5xl
                  fontWeight: 300, // light
                  color: '#d1d5db', // gray-300
                  marginTop: '8px',
                  letterSpacing: '0.025em', // wide
                  margin: '8px 0 0 0',
                }}
              >
                Markdown Editor
              </h2>
            </div>

            {/* Decorative Divider */}
            <div
              style={{
                height: '2px',
                width: '128px', // w-32
                backgroundColor: '#9B2335',
                marginTop: '40px',
                marginBottom: '40px',
                boxShadow: '0 0 10px rgba(155,35,53,0.45)',
              }}
            />

            {/* Tagline */}
            <p
              style={{
                fontSize: '36px', // text-4xl
                fontStyle: 'italic',
                color: 'rgba(155, 35, 53, 0.75)',
                fontWeight: 300,
                letterSpacing: '0.025em',
                margin: 0,
              }}
            >
              Modal editing for Markdown
            </p>

            {/* Footer / URL */}
            <div
              style={{
                position: 'absolute',
                bottom: '48px', // bottom-12
                left: '96px', // left-24
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280', // gray-500
              }}
            >
              <span
                style={{
                  fontSize: '20px', // text-xl
                  letterSpacing: '0.1em', // widest
                  fontWeight: 600,
                  opacity: 0.6,
                }}
              >
                poemd.dev
              </span>
            </div>
          </div>

          {/* Border Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: playfairRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Playfair Display',
            data: playfairBlack,
            weight: 900,
            style: 'normal',
          },
          {
            name: 'Playfair Display',
            data: playfairItalic,
            weight: 400,
            style: 'italic',
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  }

  // Standard/Twitter Layout
  if (!env.CDN_URL_INTER_REGULAR || !env.CDN_URL_INTER_BOLD) {
    throw new Error('Missing CDN URLs for Inter font')
  }

  const [interFont, interBold] = await Promise.all([
    loadAsset(interFontUrl, env.ASSETS, env.CDN_URL_INTER_REGULAR),
    loadAsset(interBoldUrl, env.ASSETS, env.CDN_URL_INTER_BOLD),
  ])

  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title
  const displaySnippet = snippet.length > 150 ? snippet.slice(0, 147) + '...' : snippet

  const isTwitter = platform === 'twitter'
  const backgroundColor = isTwitter ? '#1D9BF0' : '#1a1a1b' // Twitter Blue or Dark Gray

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: backgroundColor,
          width: '1200px',
          height: '630px',
          padding: '60px',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
          color: 'white',
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              color: isTwitter ? 'rgba(255, 255, 255, 0.9)' : '#818384',
              fontWeight: 400,
            }}
          >
            poemd.dev
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 32px 0',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            maxWidth: '100%',
          }}
        >
          {displayTitle}
        </h1>

        {/* Snippet */}
        <p
          style={{
            fontSize: '32px',
            fontWeight: 400,
            color: isTwitter ? 'rgba(255, 255, 255, 0.9)' : '#818384',
            margin: '0',
            lineHeight: '1.4',
            maxWidth: '100%',
          }}
        >
          {displaySnippet}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interFont,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
}
