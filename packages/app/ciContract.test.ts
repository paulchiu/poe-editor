import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT } from './src/test/repoFiles'

/** Script name CI's test step invokes. */
const CI_TEST_SCRIPT = 'test:coverage'

/** Status check the branch ruleset requires; the job reporting it must be the one running the tests. */
const REQUIRED_STATUS_CHECK = 'Lint, Format & Unit Tests'

interface Workspace {
  location: string
  scripts: Record<string, string>
  devDependencies: Record<string, string>
  ignored: string[]
}

interface WorkflowStep {
  run?: string
}

interface WorkflowJob {
  name?: string
  steps?: WorkflowStep[]
}

interface Workflow {
  jobs: Record<string, WorkflowJob>
}

/**
 * Lists the workspaces npm itself expands, so the set matches what `--workspaces` reaches.
 * @returns One entry per workspace, with its manifest and ignore rules.
 */
function readWorkspaces(): Workspace[] {
  const listed = JSON.parse(
    execFileSync('npm', ['query', '.workspace', '--json'], { cwd: REPO_ROOT, encoding: 'utf8' })
  ) as Array<{ location: string }>

  return listed.map(({ location }) => {
    const manifest = JSON.parse(readFileSync(resolve(REPO_ROOT, location, 'package.json'), 'utf8'))
    const ignorePath = resolve(REPO_ROOT, location, '.gitignore')
    const ignored = existsSync(ignorePath)
      ? readFileSync(ignorePath, 'utf8')
          .split('\n')
          .map((line) => line.trim().replace(/^\/+|\/+$/g, ''))
      : []

    return {
      location,
      scripts: manifest.scripts ?? {},
      devDependencies: manifest.devDependencies ?? {},
      ignored,
    }
  })
}

const WORKSPACES = readWorkspaces()

/**
 * Finds package directories on disk, independently of what the root manifest declares.
 * @returns Repo-relative locations of every directory under `packages/` holding a manifest.
 */
function packageDirectories(): string[] {
  const packagesDir = resolve(REPO_ROOT, 'packages')
  return readdirSync(packagesDir)
    .map((dir) => `packages/${dir}`)
    .filter((location) => existsSync(resolve(REPO_ROOT, location, 'package.json')))
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
 * Decides whether a root script delegates to every workspace.
 * @param script - The script body to inspect.
 * @returns True when it targets all workspaces and skips none.
 */
function fansOutToEveryWorkspace(script: string): boolean {
  const tokens = script.split(/\s+/).filter(Boolean)
  const targetsAll = tokens.includes('--workspaces')
  const targetsSome = tokens.some((token) => token === '-w' || token.startsWith('--workspace='))
  const skipsMissing = tokens.includes('--if-present')

  return targetsAll && !targetsSome && !skipsMissing
}

/**
 * Finds the workflow jobs carrying a given display name.
 * @param name - The job name to match.
 * @returns Every job declaring that name.
 */
function jobsNamed(name: string): WorkflowJob[] {
  const workflow = parse(
    readFileSync(resolve(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8')
  ) as Workflow

  return Object.values(workflow.jobs).filter((job) => job.name === name)
}

describe('ci contract', () => {
  it('exposes the CI test script in every workspace', () => {
    const missing = WORKSPACES.filter((workspace) => !workspace.scripts[CI_TEST_SCRIPT]).map(
      (workspace) => workspace.location
    )

    expect(missing).toEqual([])
  })

  it('declares every package on disk as a workspace', () => {
    const declared = WORKSPACES.map((workspace) => workspace.location)

    expect([...declared].sort()).toEqual([...packageDirectories()].sort())
  })

  it('runs the CI test script across every workspace', () => {
    expect(fansOutToEveryWorkspace(rootScript(CI_TEST_SCRIPT))).toBe(true)
  })

  it('declares the coverage provider in every workspace that measures coverage', () => {
    const undeclared = WORKSPACES.filter((workspace) =>
      workspace.scripts[CI_TEST_SCRIPT]?.includes('--coverage')
    )
      .filter((workspace) => !workspace.devDependencies['@vitest/coverage-v8'])
      .map((workspace) => workspace.location)

    expect(undeclared).toEqual([])
  })

  it('ignores generated coverage output in every workspace', () => {
    const leaking = WORKSPACES.filter((workspace) => !workspace.ignored.includes('coverage')).map(
      (workspace) => workspace.location
    )

    expect(leaking).toEqual([])
  })

  it('names exactly one job to match the required status check', () => {
    expect(jobsNamed(REQUIRED_STATUS_CHECK)).toHaveLength(1)
  })

  it('runs the CI test script from the job the ruleset requires', () => {
    const [job] = jobsNamed(REQUIRED_STATUS_CHECK)
    const commands = (job?.steps ?? []).map((step) => step.run ?? '')

    expect(commands).toContain(`npm run ${CI_TEST_SCRIPT}`)
  })
})
