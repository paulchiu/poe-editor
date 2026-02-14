#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * asset-sync.js - Syncs public/ directory to the poe-editor-static R2 bucket.
 *
 * Usage: node scripts/asset-sync.js [--dry-run]
 */

import { readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { execSync } from 'child_process'
import { parseArgs } from 'util'

const BUCKET_NAME = 'poe-editor-static'
const PUBLIC_DIR = 'public'

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    remote: { type: 'boolean', default: false },
  },
})

const dryRun = values['dry-run']
const remote = values['remote']

/**
 * Recursively collect all file paths under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    return entry.isDirectory() ? collectFiles(fullPath) : [fullPath]
  })
}

const files = collectFiles(PUBLIC_DIR)

const target = remote ? 'remote' : 'local'
console.log(`\n☁️  Syncing ${files.length} file(s) to R2 bucket "${BUCKET_NAME}" (${target})...\n`)

if (dryRun) {
  console.log('  (dry-run mode — no files will be uploaded)\n')
}

for (const file of files) {
  const key = relative(PUBLIC_DIR, file)
  const size = (statSync(file).size / 1024).toFixed(1)

  if (dryRun) {
    console.log(`  [dry-run] ${key} (${size} KB)`)
  } else {
    console.log(`  ↑ ${key} (${size} KB)`)
    const remoteFlag = remote ? ' --remote' : ''
    execSync(`npx wrangler r2 object put "${BUCKET_NAME}/${key}" --file "${file}"${remoteFlag}`, {
      stdio: 'inherit',
    })
  }
}

console.log(`\n✅ Done${dryRun ? ' (dry-run)' : ''}.\n`)
