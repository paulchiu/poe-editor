import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Absolute path to the monorepo root, for tests asserting on committed repo-level config. */
export const REPO_ROOT = resolve(import.meta.dirname, '../../../..')

/**
 * Reads the repo's own npm settings, ignoring any user or environment config.
 * @returns Settings declared in the committed `.npmrc`.
 */
export function repoNpmSettings(): Record<string, string> {
  return readFileSync(resolve(REPO_ROOT, '.npmrc'), 'utf8')
    .split('\n')
    .filter((line) => /^\s*[^;#\s]/.test(line))
    .reduce<Record<string, string>>((settings, line) => {
      const [key, ...rest] = line.split('=')
      return { ...settings, [key.trim()]: rest.join('=').trim() }
    }, {})
}
