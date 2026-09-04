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

describe('workspace install', () => {
  it('resolves a single copy of workerd', () => {
    expect(resolvedCopiesOf('workerd')).toHaveLength(1)
  })
})
