import { describe, it, expect } from 'vitest'
import { resolve, getNode, listDir, readFile, isDir, completePath, HOME } from './filesystem'

describe('resolve', () => {
  it('returns absolute paths as-is (after normalization)', () => {
    expect(resolve('/home/edgar', '/tmp')).toBe('/tmp')
    expect(resolve('/home/edgar', '/home/edgar/poems')).toBe('/home/edgar/poems')
  })

  it('resolves relative paths against cwd', () => {
    expect(resolve('/home/edgar', 'poems')).toBe('/home/edgar/poems')
    expect(resolve('/home/edgar', 'documents')).toBe('/home/edgar/documents')
  })

  it('resolves ~ to /home/edgar', () => {
    expect(resolve('/tmp', '~')).toBe(HOME)
    expect(resolve('/tmp', '~/poems')).toBe('/home/edgar/poems')
  })

  it('resolves .. by going up one level', () => {
    expect(resolve('/home/edgar/poems', '..')).toBe('/home/edgar')
    expect(resolve('/home/edgar', '../..')).toBe('/')
  })

  it('treats . as a no-op', () => {
    expect(resolve('/home/edgar', '.')).toBe('/home/edgar')
    expect(resolve('/home/edgar', './poems')).toBe('/home/edgar/poems')
  })

  it('stays at / when .. is used from root', () => {
    expect(resolve('/', '..')).toBe('/')
    expect(resolve('/', '../../..')).toBe('/')
  })

  it('handles combined paths like ~/poems/../todo.txt', () => {
    expect(resolve('/tmp', '~/poems/../todo.txt')).toBe('/home/edgar/todo.txt')
  })
})

describe('getNode', () => {
  it('returns the root directory for /', () => {
    const node = getNode('/')
    expect(node).not.toBeNull()
    expect(node!.type).toBe('directory')
    expect(node!.children).toHaveProperty('home')
  })

  it('returns a file node for a valid file path', () => {
    const node = getNode('/home/edgar/todo.txt')
    expect(node).not.toBeNull()
    expect(node!.type).toBe('file')
    expect(node!.content).toContain('touch grass')
  })

  it('returns a directory node for a valid directory path', () => {
    const node = getNode('/home/edgar/poems')
    expect(node).not.toBeNull()
    expect(node!.type).toBe('directory')
  })

  it('returns null for a non-existent path', () => {
    expect(getNode('/home/edgar/nope.txt')).toBeNull()
    expect(getNode('/nonexistent')).toBeNull()
  })
})

describe('listDir', () => {
  it('lists entries in a directory', () => {
    const entries = listDir('/home/edgar', 'poems')
    expect(entries).not.toBeNull()
    const names = entries!.map((e) => e.name)
    expect(names).toContain('the-raven.md')
  })

  it('returns null for a file path', () => {
    expect(listDir('/home/edgar', 'todo.txt')).toBeNull()
  })

  it('returns null for a non-existent path', () => {
    expect(listDir('/home/edgar', 'nope')).toBeNull()
  })

  it('lists cwd when no path arg is provided', () => {
    const entries = listDir('/home/edgar')
    expect(entries).not.toBeNull()
    const names = entries!.map((e) => e.name)
    expect(names).toContain('todo.txt')
    expect(names).toContain('poems')
  })

  it('resolves path relative to cwd', () => {
    const entries = listDir('/home', 'edgar/poems')
    expect(entries).not.toBeNull()
    expect(entries!.map((e) => e.name)).toContain('the-raven.md')
  })
})

describe('readFile', () => {
  it('returns file content for a valid file', () => {
    const content = readFile('/home/edgar', 'todo.txt')
    expect(content).not.toBeNull()
    expect(content).toContain('figure out how to exit vim')
  })

  it('returns null for a directory', () => {
    expect(readFile('/home/edgar', 'poems')).toBeNull()
  })

  it('returns null for a non-existent path', () => {
    expect(readFile('/home/edgar', 'ghost.txt')).toBeNull()
  })
})

describe('isDir', () => {
  it('returns true for directories', () => {
    expect(isDir('/home/edgar', 'poems')).toBe(true)
    expect(isDir('/', 'home')).toBe(true)
  })

  it('returns false for files', () => {
    expect(isDir('/home/edgar', 'todo.txt')).toBe(false)
  })

  it('returns false for non-existent paths', () => {
    expect(isDir('/home/edgar', 'nope')).toBe(false)
  })
})

describe('completePath', () => {
  it('completes filenames in cwd', () => {
    const results = completePath('/home/edgar', 'to')
    expect(results).toContain('todo.txt')
  })

  it('completes with a path prefix', () => {
    const results = completePath('/home/edgar', 'documents/def')
    expect(results).toContain('documents/definitely-not-a-virus.sh')
  })

  it('adds / suffix for directory matches', () => {
    const results = completePath('/home/edgar', 'po')
    expect(results).toContain('poems/')
  })

  it('returns empty array for a non-existent directory', () => {
    const results = completePath('/home/edgar', 'nope/foo')
    expect(results).toEqual([])
  })
})
