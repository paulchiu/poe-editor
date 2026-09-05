import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { subset, validRange } from 'semver'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT, repoNpmSettings } from './src/test/repoFiles'

interface NodeDeclaration {
  source: string
  version: string
}

interface LockfileEntry {
  engines?: { node?: string }
  os?: string[]
  optional?: boolean
}

interface WorkflowStep {
  uses?: string
  run?: string
  with?: Record<string, unknown>
}

interface Workflow {
  jobs: Record<string, { steps?: WorkflowStep[] }>
}

/** Platforms the repo runs on; packages gated to anything else are never installed. */
const SUPPORTED_PLATFORMS = ['darwin', 'linux']

const WORKFLOW_DIR = '.github/workflows'

/** Files that must pin Node, so deleting a pin fails rather than silently shrinking the checked set. */
const REQUIRED_SOURCES = ['.nvmrc', 'mise.toml']

/**
 * Reads every workflow definition, keyed by the path used to report it.
 * @returns One entry per workflow file.
 */
function workflows(): Array<{ source: string; workflow: Workflow }> {
  const workflowDir = resolve(REPO_ROOT, WORKFLOW_DIR)

  return readdirSync(workflowDir)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => ({
      source: `${WORKFLOW_DIR}/${file}`,
      workflow: parse(readFileSync(resolve(workflowDir, file), 'utf8')) as Workflow,
    }))
}

/**
 * Lists the steps of a workflow, flattened across its jobs.
 * @param workflow - The parsed workflow.
 * @returns Every step the workflow runs.
 */
function stepsOf(workflow: Workflow): WorkflowStep[] {
  return Object.values(workflow.jobs).flatMap((job) => job.steps ?? [])
}

/**
 * Finds workflows invoking npm, which decide a Node version whether or not they pin one.
 * @returns Paths of workflows that must carry a `setup-node` pin.
 */
function workflowsRunningNpm(): string[] {
  return workflows()
    .filter(({ workflow }) => stepsOf(workflow).some((step) => /\bnpm\b/.test(step.run ?? '')))
    .map(({ source }) => source)
}

/**
 * Collects every Node version the repo commits, across the tools that read them.
 * @returns One entry per declaration, labelled by the file it came from.
 */
function nodeDeclarations(): NodeDeclaration[] {
  const miseNode = /^\s*node\s*=\s*(?:"([^"]+)"|\{[^}]*version\s*=\s*"([^"]+)")/m.exec(
    readFileSync(resolve(REPO_ROOT, 'mise.toml'), 'utf8')
  )
  const misePin = miseNode?.[1] ?? miseNode?.[2]

  const workflowDeclarations = workflows().flatMap(({ source, workflow }) =>
    stepsOf(workflow)
      .filter((step) => step.uses?.startsWith('actions/setup-node'))
      .flatMap((step) => {
        const pinned = step.with?.['node-version']
        return pinned === undefined ? [] : [{ source, version: String(pinned) }]
      })
  )

  return [
    { source: '.nvmrc', version: readFileSync(resolve(REPO_ROOT, '.nvmrc'), 'utf8').trim() },
    ...(misePin ? [{ source: 'mise.toml', version: misePin }] : []),
    ...workflowDeclarations,
  ]
}

/**
 * Reads the Node range the repo advertises to anyone installing it.
 * @returns The root `engines.node` range.
 */
function declaredEngineRange(): string {
  const manifest = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'))
  return manifest.engines.node
}

/**
 * Decides whether a package is an optional binary built for a platform this repo never uses,
 * which npm therefore never installs and whose engine range cannot bind.
 * @param entry - The lockfile entry to judge.
 * @returns True when the entry is skipped on every platform the repo runs on.
 */
function neverInstalled(entry: LockfileEntry): boolean {
  return (
    entry.optional === true &&
    entry.os !== undefined &&
    !entry.os.some((os) => SUPPORTED_PLATFORMS.includes(os))
  )
}

/**
 * Collects the Node constraint of every package npm would actually install here.
 * @returns One entry per installable package declaring `engines.node`.
 */
function dependencyNodeRanges(): Array<{ name: string; range: string }> {
  const lockfile = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package-lock.json'), 'utf8'))

  return Object.entries(lockfile.packages as Record<string, LockfileEntry>).flatMap(
    ([key, entry]) => {
      const range = entry.engines?.node

      return range && !neverInstalled(entry)
        ? [{ name: key.replace(/^node_modules\//, ''), range }]
        : []
    }
  )
}

describe('node version', () => {
  it('pins the same Node line in every file that declares one', () => {
    const declarations = nodeDeclarations()
    const lines = [...new Set(declarations.map(({ version }) => version))]

    expect(lines, JSON.stringify(declarations)).toHaveLength(1)
  })

  it('pins Node in every file that must declare one', () => {
    const declared = new Set(nodeDeclarations().map(({ source }) => source))
    const missing = [...REQUIRED_SOURCES, ...workflowsRunningNpm()].filter(
      (source) => !declared.has(source)
    )

    expect(missing).toEqual([])
  })

  it('pins Node lines that cannot resolve outside the declared engine range', () => {
    const engineRange = declaredEngineRange()
    const unusable = nodeDeclarations()
      .filter(({ version }) => !validRange(version) || !subset(version, engineRange))
      .map(({ source, version }) => `${source} pins ${version}`)

    expect(unusable).toEqual([])
  })

  it('leaves engine-strict unset so dependency updates keep resolving', () => {
    expect(repoNpmSettings()['engine-strict']).toBeUndefined()
  })

  it('advertises a range no installable dependency rejects', () => {
    const engineRange = declaredEngineRange()
    const rejecting = dependencyNodeRanges()
      .filter(({ range }) => !subset(engineRange, range))
      .map(({ name, range }) => `${name} requires ${range}`)

    expect(rejecting).toEqual([])
  })
})
