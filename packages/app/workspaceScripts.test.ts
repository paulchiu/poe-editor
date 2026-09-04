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
 * Reads a script declared by the repo-root manifest.
 * @param name - The script name to look up.
 * @returns The script body, or an empty string when it is not declared.
 */
function rootScript(name: string): string {
  const manifest = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'))
  return manifest.scripts?.[name] ?? ''
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

  it('runs the CI test script across every workspace', () => {
    expect(rootScript(CI_TEST_SCRIPT)).toContain('--workspaces')
  })

  it('fails on a workspace missing the CI test script rather than skipping it', () => {
    expect(rootScript(CI_TEST_SCRIPT)).not.toContain('--if-present')
  })
})
