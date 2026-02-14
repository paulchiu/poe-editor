import { GoogleFont, ImageResponse } from '@cf-wasm/og'
import { createPerfTracer } from './perf'

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
  platform: string | null
): Promise<Response> {
  const perf = createPerfTracer('generateOgImage')

  // Home Page Design
  if (platform === 'home') {


    const response = await ImageResponse.async(
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



        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: '96px',
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
                fontSize: '48px',
                fontWeight: 300,
                color: '#d1d5db',
                marginTop: '8px',
                letterSpacing: '0.025em',
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
              width: '128px',
              backgroundColor: '#9B2335',
              marginTop: '40px',
              marginBottom: '40px',
              boxShadow: '0 0 10px rgba(155,35,53,0.45)',
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontSize: '36px',
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
              bottom: '48px',
              left: '96px',
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                letterSpacing: '0.1em',
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
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          new GoogleFont('Playfair Display', { weight: 900 }),
          new GoogleFont('Playfair Display', { weight: 400 }),
        ],
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
    perf.mark('ImageResponse')
    console.warn(perf.summary())
    return response
  }

  // Standard/Twitter Layout
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title
  const displaySnippet = snippet.length > 150 ? snippet.slice(0, 147) + '...' : snippet

  const isTwitter = platform === 'twitter'
  const backgroundColor = isTwitter ? '#1D9BF0' : '#1a1a1b'

  const response = await ImageResponse.async(
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
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
  perf.mark('ImageResponse')
  console.warn(perf.summary())
  return response
}
