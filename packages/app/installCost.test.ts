import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

/**
 * Locates every resolved copy of a package in the lockfile.
 * @param name - The package name to look for.
 * @returns Lockfile keys, one per copy npm would install.
 */
function resolvedCopiesOf(name: string): string[] {
  const lockfile = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package-lock.json'), 'utf8'))
  return Object.keys(lockfile.packages).filter((key) => key.endsWith(`node_modules/${name}`))
}

/**
 * Reads the repo's own npm settings, ignoring any user or environment config.
 * @returns Settings declared in the committed `.npmrc`.
 */
function repoNpmSettings(): Record<string, string> {
  return readFileSync(resolve(REPO_ROOT, '.npmrc'), 'utf8')
    .split('\n')
    .filter((line) => /^\s*[^;#\s]/.test(line))
    .reduce<Record<string, string>>((settings, line) => {
      const [key, ...rest] = line.split('=')
      return { ...settings, [key.trim()]: rest.join('=').trim() }
    }, {})
}

/** Large native binaries where a duplicate copy costs a second multi-megabyte download. */
const SINGLE_COPY_BINARIES = ['workerd', 'esbuild']

describe('install cost', () => {
  it.each(SINGLE_COPY_BINARIES)('resolves a single copy of %s', (name) => {
    expect(resolvedCopiesOf(name)).toHaveLength(1)
  })

  it('enables prefer-offline for everyone who clones the repo', () => {
    expect(repoNpmSettings()['prefer-offline']).toBe('true')
  })
})
