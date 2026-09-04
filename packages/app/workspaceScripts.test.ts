import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

/** Script name CI's test step invokes; every workspace must expose it or the step skips work. */
const CI_TEST_SCRIPT = 'test:coverage'

interface Workspace {
  name: string
  scripts: Record<string, string>
}

/**
 * Reads the manifest of every workspace under `packages/`.
 * @returns One entry per workspace, in directory order.
 */
function workspaces(): Workspace[] {
  const packagesDir = resolve(REPO_ROOT, 'packages')
  return readdirSync(packagesDir).map((dir) => {
    const manifest = JSON.parse(readFileSync(resolve(packagesDir, dir, 'package.json'), 'utf8'))
    return { name: dir, scripts: manifest.scripts ?? {} }
  })
}

describe('workspace scripts', () => {
  it('exposes the CI test script in every workspace', () => {
    const missing = workspaces()
      .filter((workspace) => !workspace.scripts[CI_TEST_SCRIPT])
      .map((workspace) => workspace.name)

    expect(missing).toEqual([])
  })
})
