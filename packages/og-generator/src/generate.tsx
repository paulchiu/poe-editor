import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

export async function generatePng(element: React.ReactNode, width: number, height: number, fonts: any[]): Promise<Buffer> {
  const svg = await satori(element, {
    width,
    height,
    fonts,
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  })

  const pngData = resvg.render()
  return pngData.asPng()
}

export const HomeImage = ({ splashSrc }: { splashSrc: string }) => (
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

    {/* Splash Image Overlay */}
     <img
        src={splashSrc}
        style={{
          position: 'absolute',
          right: '-50px',
          top: '-35px',
          width: '700px',
          height: '700px',
          opacity: 0.5,
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
  </div>
)
