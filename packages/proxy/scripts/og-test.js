#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * og-test.js - CLI tool for testing OG image generation
 *
 * Parse dev editor URL and interact with the OG image endpoint.
 *
 * Usage: node og-test.js <command> <dev-editor-url> [options]
 *
 * Commands:
 *   preview   Show headers only (fast check)
 *   download  Download the OG image to a file
 *   open      Download and open the image
 *   info      Just display parsed URL info without making requests
 *
 * Examples:
 *   node og-test.js preview "http://localhost:5173/poe-markdown-editors/my-title#content"
 *   node og-test.js download "http://localhost:5173/poe-markdown-editors/my-title#content" -o my-og.png
 *   node og-test.js open "http://localhost:5173/poe-markdown-editors/my-title#content"
 *   node og-test.js info "http://localhost:5173/poe-markdown-editors/my-title#content"
 */

import { spawn } from 'child_process'
import { parseArgs } from 'util'
import { existsSync, rmSync } from 'fs'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const color = (str, colorName) => `${COLORS[colorName]}${str}${COLORS.reset}`

function log(level, message) {
  const colors = {
    info: 'blue',
    success: 'green',
    warn: 'yellow',
    error: 'red',
    cmd: 'cyan',
    header: 'magenta',
  }
  const prefix = {
    info: 'ℹ',
    success: '✓',
    warn: '⚠',
    error: '✗',
    cmd: '$',
    header: '→',
  }
  console.log(`${color(prefix[level], colors[level])} ${message}`)
}

function showHelp() {
  console.log(`
${color('OG Image Test CLI', 'bright')}

${color('Usage:', 'yellow')} node og-test.js <command> <dev-editor-url> [options]

${color('Commands:', 'yellow')}
  ${color('preview', 'green')}   Show headers only (fast connectivity check)
  ${color('download', 'green')}  Download the OG image to a file
  ${color('open', 'green')}      Download and automatically open the image
  ${color('info', 'green')}      Display parsed URL info (no network request)

${color('Options:', 'yellow')}
  -p, --proxy <url>     Proxy server URL (default: http://localhost:8787)
  -o, --output <file>   Output filename for download (default: og-test.png)
  -h, --help            Show this help message

${color('Examples:', 'yellow')}
  node og-test.js ${color('preview', 'cyan')} "http://localhost:5173/poe-markdown-editors/my-title"
  node og-test.js ${color('download', 'cyan')} "http://localhost:5173/poe-markdown-editors/my-title" -o my-image.png
  node og-test.js ${color('open', 'cyan')} "http://localhost:5173/poe-markdown-editors/my-title"
  node og-test.js ${color('info', 'cyan')} "http://localhost:5173/poe-markdown-editors/my-title"

${color('Note:', 'yellow')} Ensure the proxy server is running: ${color('cd packages/proxy && npm run dev', 'dim')}
`)
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function parseEditorUrl(urlString) {
  try {
    const url = new URL(urlString)
    const pathParts = url.pathname.split('/').filter(Boolean)

    const titleSlug = pathParts[0] || 'Untitled'
    const title = slugToTitle(titleSlug)

    const snippetSlug = pathParts[1] || ''
    const snippet = snippetSlug ? slugToTitle(snippetSlug).slice(0, 150) : 'A document on poemd.dev'

    return { title, snippet, fullPath: url.pathname }
  } catch {
    log('error', `Invalid URL "${urlString}"`)
    process.exit(1)
  }
}

function buildOgUrl(proxyUrl, title, snippet) {
  const base = proxyUrl.replace(/\/$/, '')
  const params = new URLSearchParams({ title, snippet })
  return `${base}/api/og?${params.toString()}`
}

function executeCurl(args, description) {
  return new Promise((resolve, reject) => {
    log('cmd', `${description}`)
    console.log(color(`  curl ${args.join(' ')}`, 'dim'))

    const curl = spawn('curl', args, { stdio: ['pipe', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''

    curl.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    curl.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    curl.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`curl failed with code ${code}: ${stderr}`))
      } else {
        resolve(stdout)
      }
    })
  })
}

function parseArguments() {
  try {
    const { values, positionals } = parseArgs({
      options: {
        proxy: { type: 'string', short: 'p', default: 'http://localhost:8787' },
        output: { type: 'string', short: 'o', default: 'og-test.png' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    })

    if (values.help || positionals.length === 0) {
      showHelp()
      process.exit(0)
    }

    const command = positionals[0]
    const editorUrl = positionals[1]

    if (!['preview', 'download', 'open', 'info'].includes(command)) {
      log('error', `Unknown command "${command}"`)
      console.log(`\nRun ${color('node og-test.js --help', 'cyan')} for usage information.`)
      process.exit(1)
    }

    if (!editorUrl && command !== 'info') {
      log('error', 'Missing required dev-editor-url argument')
      showHelp()
      process.exit(1)
    }

    return { command, editorUrl, proxyUrl: values.proxy, outputFile: values.output }
  } catch (error) {
    log('error', error.message)
    process.exit(1)
  }
}

async function runPreview(ogUrl) {
  log('info', 'Fetching headers...')
  try {
    const output = await executeCurl(['-sI', ogUrl], 'HEAD request')
    console.log('')
    log('header', 'Response headers:')
    console.log(color(output, 'dim'))
  } catch (error) {
    log('error', `Preview failed: ${error.message}`)
    process.exit(1)
  }
}

async function runDownload(ogUrl, outputFile) {
  log('info', `Downloading to ${color(outputFile, 'cyan')}...`)

  if (existsSync(outputFile)) {
    log('warn', `File ${outputFile} already exists, overwriting...`)
    try {
      rmSync(outputFile)
    } catch {
      // Ignore cleanup errors
    }
  }

  try {
    await executeCurl(['-s', '-o', outputFile, ogUrl], `Download to ${outputFile}`)
    log('success', `Downloaded successfully: ${color(outputFile, 'cyan')}`)

    const stats = await import('fs').then((fs) => fs.promises.stat(outputFile))
    const size = (stats.size / 1024).toFixed(1)
    log('info', `File size: ${size} KB`)
  } catch (error) {
    log('error', `Download failed: ${error.message}`)
    process.exit(1)
  }
}

async function runOpen(ogUrl, outputFile) {
  await runDownload(ogUrl, outputFile)

  log('info', `Opening ${outputFile}...`)

  const platform = process.platform
  let openCmd, openArgs

  if (platform === 'darwin') {
    openCmd = 'open'
    openArgs = [outputFile]
  } else if (platform === 'win32') {
    openCmd = 'cmd'
    openArgs = ['/c', 'start', outputFile]
  } else {
    openCmd = 'xdg-open'
    openArgs = [outputFile]
  }

  try {
    await new Promise((resolve, reject) => {
      const proc = spawn(openCmd, openArgs, { stdio: 'ignore' })
      proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`${openCmd} exited with code ${code}`))
        } else {
          resolve()
        }
      })
      proc.on('error', reject)
    })
    log('success', `Opened ${color(outputFile, 'cyan')}`)
  } catch {
    log('warn', `Could not automatically open the image.`)
    console.log(`  Run: ${color(`${openCmd} ${outputFile}`, 'cyan')}`)
  }
}

function runInfo(editorUrl, proxyUrl) {
  const { title, snippet, fullPath } = parseEditorUrl(editorUrl)
  const ogUrl = buildOgUrl(proxyUrl, title, snippet)

  console.log('')
  log('header', 'URL Information')
  console.log(`  ${color('Source:', 'yellow')}      ${editorUrl}`)
  console.log(`  ${color('Path:', 'yellow')}        ${fullPath}`)
  console.log(`  ${color('Proxy:', 'yellow')}       ${proxyUrl}`)
  console.log(`  ${color('OG Endpoint:', 'yellow')}  ${ogUrl}`)
  console.log('')
  log('header', 'Parsed Content')
  console.log(`  ${color('Title:', 'yellow')}    ${title}`)
  console.log(
    `  ${color('Snippet:', 'yellow')}  ${snippet.slice(0, 60)}${snippet.length > 60 ? '...' : ''}`
  )
}

async function main() {
  const { command, editorUrl, proxyUrl, outputFile } = parseArguments()

  console.log('')
  log('info', `Running ${color(command, 'green')} command`)

  if (command === 'info') {
    runInfo(editorUrl, proxyUrl)
    return
  }

  const { title, snippet } = parseEditorUrl(editorUrl)
  const ogUrl = buildOgUrl(proxyUrl, title, snippet)

  console.log(`  ${color('Title:', 'dim')}   ${title}`)
  console.log(`  ${color('URL:', 'dim')}     ${ogUrl}`)
  console.log('')

  switch (command) {
    case 'preview':
      await runPreview(ogUrl)
      break
    case 'download':
      await runDownload(ogUrl, outputFile)
      break
    case 'open':
      await runOpen(ogUrl, outputFile)
      break
  }

  console.log('')
}

main().catch((error) => {
  log('error', `Unexpected error: ${error.message}`)
  process.exit(1)
})
