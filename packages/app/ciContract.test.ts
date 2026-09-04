import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

/** Script name CI's test step invokes; every workspace must expose it or the step skips work. */
const CI_TEST_SCRIPT = 'test:coverage'

/** Status check the branch ruleset requires; renaming the job that reports it silently unblocks merges. */
const REQUIRED_STATUS_CHECK = 'Lint, Format & Unit Tests'

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

/**
 * Reads a workspace's own git ignore rules.
 * @param dir - Workspace directory name under `packages/`.
 * @returns Ignore patterns, or an empty list when the workspace has no `.gitignore`.
 */
function gitignoreOf(dir: string): string[] {
  const path = resolve(REPO_ROOT, 'packages', dir, '.gitignore')
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
}

describe('ci contract', () => {
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

  it('ignores the coverage output every covered workspace generates', () => {
    const leaking = workspaces()
      .filter((workspace) => workspace.scripts[CI_TEST_SCRIPT]?.includes('--coverage'))
      .filter((workspace) => !gitignoreOf(workspace.name).includes('coverage/'))
      .map((workspace) => workspace.name)

    expect(leaking).toEqual([])
  })

  it('names a job to match the required status check', () => {
    const workflow = parse(readFileSync(resolve(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8'))
    const jobNames = Object.values(workflow.jobs as Record<string, { name: string }>).map(
      (job) => job.name
    )

    expect(jobNames).toContain(REQUIRED_STATUS_CHECK)
  })
})
