import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { intersects, subset, validRange } from 'semver'
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
}

interface WorkflowStep {
  uses?: string
  with?: Record<string, unknown>
}

interface Workflow {
  jobs: Record<string, { steps?: WorkflowStep[] }>
}

/** Platforms the repo runs on; packages gated to anything else are never installed. */
const SUPPORTED_PLATFORMS = ['darwin', 'linux']

const WORKFLOW_DIR = '.github/workflows'

/**
 * Collects every Node version the repo commits, across the tools that read them.
 * @returns One entry per declaration, labelled by the file it came from.
 */
function nodeDeclarations(): NodeDeclaration[] {
  const miseNode = /^\s*node\s*=\s*"([^"]+)"/m.exec(
    readFileSync(resolve(REPO_ROOT, 'mise.toml'), 'utf8')
  )

  const workflowDir = resolve(REPO_ROOT, WORKFLOW_DIR)
  const workflowDeclarations = readdirSync(workflowDir)
    .filter((file) => /\.ya?ml$/.test(file))
    .flatMap((file) => {
      const workflow = parse(readFileSync(resolve(workflowDir, file), 'utf8')) as Workflow

      return Object.values(workflow.jobs)
        .flatMap((job) => job.steps ?? [])
        .filter((step) => step.uses?.startsWith('actions/setup-node'))
        .map((step) => ({
          source: `${WORKFLOW_DIR}/${file}`,
          version: String(step.with?.['node-version']),
        }))
    })

  return [
    { source: '.nvmrc', version: readFileSync(resolve(REPO_ROOT, '.nvmrc'), 'utf8').trim() },
    ...(miseNode ? [{ source: 'mise.toml', version: miseNode[1] }] : []),
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
 * Collects the Node constraint of every package npm would actually install here.
 * @returns One entry per installable package declaring `engines.node`.
 */
function dependencyNodeRanges(): Array<{ name: string; range: string }> {
  const lockfile = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package-lock.json'), 'utf8'))

  return Object.entries(lockfile.packages as Record<string, LockfileEntry>).flatMap(
    ([key, entry]) => {
      const range = entry.engines?.node
      const installable = !entry.os || entry.os.some((os) => SUPPORTED_PLATFORMS.includes(os))

      return range && installable ? [{ name: key.replace(/^node_modules\//, ''), range }] : []
    }
  )
}

describe('node version', () => {
  it('pins the same Node line in every file that declares one', () => {
    const declarations = nodeDeclarations()
    const lines = [...new Set(declarations.map(({ version }) => version))]

    expect(lines, JSON.stringify(declarations)).toHaveLength(1)
  })

  it('pins a Node line the declared engine range accepts', () => {
    const engineRange = declaredEngineRange()
    const unusable = nodeDeclarations()
      .filter(({ version }) => !validRange(version) || !intersects(version, engineRange))
      .map(({ source, version }) => `${source} pins ${version}`)

    expect(unusable).toEqual([])
  })

  it('fails the install outright on an out-of-range Node', () => {
    expect(repoNpmSettings()['engine-strict']).toBe('true')
  })

  it('advertises a range no installable dependency rejects', () => {
    const engineRange = declaredEngineRange()
    const rejecting = dependencyNodeRanges()
      .filter(({ range }) => !subset(engineRange, range))
      .map(({ name, range }) => `${name} requires ${range}`)

    expect(rejecting).toEqual([])
  })
})
