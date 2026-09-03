import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import viteConfig from './vite.config'

/**
 * monaco-vim@0.4.4 imports this pre-`exports` deep path, which monaco-editor's
 * exports map rewrites to a file that does not exist. See issue #606.
 */
const MONACO_VIM_IMPORT = 'monaco-editor/esm/vs/editor/editor.api'

const require = createRequire(import.meta.url)

function getAlias(): Record<string, string> {
  const alias = (viteConfig as { resolve?: { alias?: Record<string, string> } }).resolve?.alias
  return alias ?? {}
}

describe('vite config', () => {
  it('aliases the monaco-editor subpath that monaco-vim imports', () => {
    expect(getAlias()).toHaveProperty(MONACO_VIM_IMPORT)
  })

  it('points that alias at a file that actually exists', () => {
    const target = getAlias()[MONACO_VIM_IMPORT]
    expect(existsSync(require.resolve(target))).toBe(true)
  })
})
