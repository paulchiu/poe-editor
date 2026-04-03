import { describe, it, expect } from 'vitest'
import { executeCommand, getCommandNames } from './commands'
import type { ShellState } from './commands'

const defaultState: ShellState = { cwd: '/home/edgar' }

describe('executeCommand', () => {
  it('returns empty output for empty input', () => {
    const result = executeCommand('', defaultState)
    expect(result.output).toBe('')
  })

  it('returns empty output for whitespace-only input', () => {
    const result = executeCommand('   ', defaultState)
    expect(result.output).toBe('')
  })

  it('returns "command not found" for unknown commands', () => {
    const result = executeCommand('nonexistent', defaultState)
    expect(result.output).toContain('command not found')
    expect(result.output).toContain('nonexistent')
  })
})

describe('ls', () => {
  it('lists directory entries for the current directory', () => {
    const result = executeCommand('ls', defaultState)
    expect(result.output).toContain('documents')
    expect(result.output).toContain('todo.txt')
    expect(result.output).toContain('README.md')
    expect(result.output).toContain('poems')
  })

  it('excludes hidden files by default', () => {
    const result = executeCommand('ls', defaultState)
    expect(result.output).not.toContain('.bashrc')
    expect(result.output).not.toContain('.vimrc')
  })

  it('shows hidden files with -a flag', () => {
    const result = executeCommand('ls -a', defaultState)
    expect(result.output).toContain('.bashrc')
    expect(result.output).toContain('.vimrc')
  })

  it('errors for non-existent directory', () => {
    const result = executeCommand('ls fakedir', defaultState)
    expect(result.output).toContain('No such file or directory')
  })

  it('supports long format with -l', () => {
    const result = executeCommand('ls -l', defaultState)
    expect(result.output).toContain('edgar')
    expect(result.output).toContain('drwxr-xr-x')
  })

  it('supports combined -la flag', () => {
    const result = executeCommand('ls -la', defaultState)
    expect(result.output).toContain('.bashrc')
    expect(result.output).toContain('edgar')
  })
})

describe('cd', () => {
  it('changes the working directory', () => {
    const result = executeCommand('cd documents', defaultState)
    expect(result.newCwd).toBe('/home/edgar/documents')
    expect(result.output).toBe('')
  })

  it('navigates to home with ~ shorthand', () => {
    const state: ShellState = { cwd: '/tmp' }
    const result = executeCommand('cd ~', state)
    expect(result.newCwd).toBe('/home/edgar')
  })

  it('defaults to home when no argument is given', () => {
    const state: ShellState = { cwd: '/tmp' }
    const result = executeCommand('cd', state)
    expect(result.newCwd).toBe('/home/edgar')
  })

  it('navigates up with ..', () => {
    const result = executeCommand('cd ..', defaultState)
    expect(result.newCwd).toBe('/home')
  })

  it('errors for non-existent directory', () => {
    const result = executeCommand('cd nope', defaultState)
    expect(result.output).toContain('No such file or directory')
  })

  it('errors when target is a file, not a directory', () => {
    const result = executeCommand('cd todo.txt', defaultState)
    expect(result.output).toContain('Not a directory')
  })
})

describe('cat', () => {
  it('returns file content', () => {
    const result = executeCommand('cat todo.txt', defaultState)
    expect(result.output).toContain('finish this editor')
    expect(result.output).toContain('exit vim')
  })

  it('errors for a directory', () => {
    const result = executeCommand('cat documents', defaultState)
    expect(result.output).toContain('Is a directory')
  })

  it('errors for a non-existent file', () => {
    const result = executeCommand('cat ghost.txt', defaultState)
    expect(result.output).toContain('No such file or directory')
  })

  it('returns empty output when called with no arguments', () => {
    const result = executeCommand('cat', defaultState)
    expect(result.output).toBe('')
  })
})

describe('pwd', () => {
  it('returns the current working directory', () => {
    const result = executeCommand('pwd', defaultState)
    expect(result.output).toBe('/home/edgar')
  })

  it('reflects a different cwd', () => {
    const result = executeCommand('pwd', { cwd: '/tmp' })
    expect(result.output).toBe('/tmp')
  })
})

describe('echo', () => {
  it('joins arguments into a single string', () => {
    const result = executeCommand('echo hello world', defaultState)
    expect(result.output).toBe('hello world')
  })

  it('returns empty string with no arguments', () => {
    const result = executeCommand('echo', defaultState)
    expect(result.output).toBe('')
  })
})

describe('whoami', () => {
  it('returns "edgar"', () => {
    const result = executeCommand('whoami', defaultState)
    expect(result.output).toBe('edgar')
  })
})

describe('uname', () => {
  it('returns the PoeOS system string', () => {
    const result = executeCommand('uname', defaultState)
    expect(result.output).toContain('PoeOS')
    expect(result.output).toContain('GNU/Linux')
  })
})

describe('date', () => {
  it('returns a non-empty date string', () => {
    const result = executeCommand('date', defaultState)
    expect(result.output.length).toBeGreaterThan(0)
    expect(result.output).toContain('UTC')
  })
})

describe('clear', () => {
  it('returns clear flag set to true', () => {
    const result = executeCommand('clear', defaultState)
    expect(result.clear).toBe(true)
  })
})

describe('exit', () => {
  it('returns exit flag set to true', () => {
    const result = executeCommand('exit', defaultState)
    expect(result.exit).toBe(true)
  })
})

describe('vim / vi', () => {
  it('vim returns exit with a message', () => {
    const result = executeCommand('vim', defaultState)
    expect(result.exit).toBe(true)
    expect(result.output).toContain('vim')
  })

  it('vi returns exit with a message', () => {
    const result = executeCommand('vi', defaultState)
    expect(result.exit).toBe(true)
    expect(result.output).toContain('vim')
  })
})

describe('help', () => {
  it('returns help text listing available commands', () => {
    const result = executeCommand('help', defaultState)
    expect(result.output).toContain('Available commands')
    expect(result.output).toContain('ls')
    expect(result.output).toContain('cd')
    expect(result.output).toContain('cat')
    expect(result.output).toContain('exit')
  })
})

describe('sudo', () => {
  it('strips the sudo prefix and executes the inner command', () => {
    const result = executeCommand('sudo whoami', defaultState)
    expect(result.output).toBe('edgar')
  })

  it('returns usage message when called with no arguments', () => {
    const result = executeCommand('sudo', defaultState)
    expect(result.output).toContain('usage')
  })

  it('passes through arguments to the inner command', () => {
    const result = executeCommand('sudo echo hello', defaultState)
    expect(result.output).toBe('hello')
  })
})

describe('shutdown / poweroff / halt', () => {
  it('shutdown returns shutdown flag', () => {
    const result = executeCommand('shutdown', defaultState)
    expect(result.shutdown).toBe(true)
  })

  it('poweroff returns shutdown flag', () => {
    const result = executeCommand('poweroff', defaultState)
    expect(result.shutdown).toBe(true)
  })

  it('halt returns shutdown flag', () => {
    const result = executeCommand('halt', defaultState)
    expect(result.shutdown).toBe(true)
  })
})

describe('rm', () => {
  it('returns "Nice try." for rm -rf /', () => {
    const result = executeCommand('rm -rf /', defaultState)
    expect(result.output).toBe('Nice try.')
  })

  it('returns "operation not permitted" for normal rm usage', () => {
    const result = executeCommand('rm file.txt', defaultState)
    expect(result.output).toContain('operation not permitted')
  })
})

describe('getCommandNames', () => {
  it('returns an array of strings', () => {
    const names = getCommandNames()
    expect(Array.isArray(names)).toBe(true)
    expect(names.length).toBeGreaterThan(0)
    names.forEach((name) => expect(typeof name).toBe('string'))
  })

  it('includes expected commands', () => {
    const names = getCommandNames()
    expect(names).toContain('ls')
    expect(names).toContain('cd')
    expect(names).toContain('cat')
    expect(names).toContain('pwd')
    expect(names).toContain('echo')
    expect(names).toContain('whoami')
    expect(names).toContain('vim')
    expect(names).toContain('vi')
    expect(names).toContain('help')
    expect(names).toContain('sudo')
    expect(names).toContain('rm')
  })
})
