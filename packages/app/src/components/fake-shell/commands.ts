import {
  resolve,
  getNode,
  listDir,
  readFile,
  HOME,
} from './filesystem'
import { neofetch } from './neofetch'

export interface ShellState {
  cwd: string // absolute path, starts at /home/edgar
}

export interface CommandResult {
  output: string // text to display (may contain ANSI-like color tokens)
  exit?: boolean // true = return to editor
  shutdown?: boolean // true = trigger shutdown sequence
  clear?: boolean // true = clear scrollback
  newCwd?: string // if command changed directory
}

type CommandHandler = (args: string[], state: ShellState) => CommandResult

// Color helpers
const BLUE_BOLD = '\x1b[1;34m'
const GREEN_BOLD = '\x1b[1;32m'
const RESET = '\x1b[0m'

function colorize(name: string, isDirectory: boolean): string {
  if (isDirectory) return `${BLUE_BOLD}${name}${RESET}`
  if (name.endsWith('.sh')) return `${GREEN_BOLD}${name}${RESET}`
  return name
}

// -- Command implementations --

function cmdLs(args: string[], state: ShellState): CommandResult {
  let showAll = false
  let longFormat = false
  let targetPath: string | undefined

  for (const arg of args) {
    if (arg === '-a') {
      showAll = true
    } else if (arg === '-l') {
      longFormat = true
    } else if (arg === '-la' || arg === '-al') {
      showAll = true
      longFormat = true
    } else if (!arg.startsWith('-')) {
      targetPath = arg
    }
  }

  const resolvedTarget = targetPath ? resolve(state.cwd, targetPath) : state.cwd
  const node = getNode(resolvedTarget)
  if (!node) {
    return { output: `ls: cannot access '${targetPath}': No such file or directory` }
  }
  if (node.type !== 'directory') {
    return { output: colorize(resolvedTarget.split('/').pop() ?? '', false) }
  }

  let entries = listDir(resolvedTarget)
  if (!entries) {
    return { output: `ls: cannot access '${targetPath}': No such file or directory` }
  }

  if (!showAll) {
    entries = entries.filter((entry) => !entry.name.startsWith('.'))
  }

  if (longFormat) {
    const lines = entries.map((entry) => {
      const isDirectory = entry.node.type === 'directory'
      const perms = entry.node.permissions ?? (isDirectory ? 'drwxr-xr-x' : '-rw-r--r--')
      const size = String(entry.node.size ?? 0).padStart(5, ' ')
      const coloredName = colorize(entry.name, isDirectory)
      return `${perms}  1 edgar edgar ${size} Mar 15 13:37 ${coloredName}`
    })
    return { output: lines.join('\n') }
  }

  const colored = entries.map((entry) => {
    return colorize(entry.name, entry.node.type === 'directory')
  })
  return { output: colored.join('  ') }
}

function cmdCd(args: string[], state: ShellState): CommandResult {
  const target = args[0] ?? '~'
  const resolved = resolve(state.cwd, target)
  const node = getNode(resolved)

  if (!node) {
    return { output: `bash: cd: ${target}: No such file or directory` }
  }
  if (node.type !== 'directory') {
    return { output: `bash: cd: ${target}: Not a directory` }
  }

  return { output: '', newCwd: resolved }
}

function cmdCat(args: string[], state: ShellState): CommandResult {
  if (args.length === 0) {
    return { output: '' }
  }

  const target = args[0]
  const content = readFile(state.cwd, target)
  if (content === null) {
    const resolved = resolve(state.cwd, target)
    const node = getNode(resolved)
    if (node?.type === 'directory') {
      return { output: `cat: ${target}: Is a directory` }
    }
    return { output: `cat: ${target}: No such file or directory` }
  }

  return { output: content }
}

function cmdPwd(_args: string[], state: ShellState): CommandResult {
  return { output: state.cwd }
}

function cmdEcho(args: string[], _state: ShellState): CommandResult {
  return { output: args.join(' ') }
}

function cmdWhoami(_args: string[], _state: ShellState): CommandResult {
  return { output: 'edgar' }
}

function cmdUname(_args: string[], _state: ShellState): CommandResult {
  return { output: 'PoeOS 6.6.6-poe #1 SMP PREEMPT_DYNAMIC Edgar x86_64 GNU/Linux' }
}

function cmdDate(_args: string[], _state: ShellState): CommandResult {
  const now = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const day = days[now.getUTCDay()]
  const month = months[now.getUTCMonth()]
  const date = String(now.getUTCDate()).padStart(2, ' ')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')
  const year = now.getUTCFullYear()

  return { output: `${day} ${month} ${date} ${hours}:${minutes}:${seconds} UTC ${year}` }
}

function cmdClear(_args: string[], _state: ShellState): CommandResult {
  return { output: '', clear: true }
}

function cmdExit(_args: string[], _state: ShellState): CommandResult {
  return { output: '', exit: true }
}

function cmdVim(_args: string[], _state: ShellState): CommandResult {
  return { output: 'You just left vim. Are you sure you want to go back?', exit: true }
}

function cmdNeofetch(_args: string[], _state: ShellState): CommandResult {
  return { output: neofetch() }
}

function cmdHelp(_args: string[], _state: ShellState): CommandResult {
  const lines = [
    'Available commands:',
    '  ls [path]        List directory contents',
    '  cd [dir]         Change working directory',
    '  cat <file>       Display file contents',
    '  pwd              Print working directory',
    '  echo [text...]   Print text to terminal',
    '  whoami           Display current user',
    '  uname [-a]       Print system information',
    '  date             Display current date and time',
    '  clear            Clear the terminal screen',
    '  exit             Return to the editor',
    '  vim / vi         Open vim (good luck)',
    '  neofetch         Display system info with ASCII art',
    '  help             Show this help message',
    '  sudo <cmd>       Run command as root (not really)',
    '  shutdown         Shut down the system',
    '  rm               Remove files (disabled)',
  ]
  return { output: lines.join('\n') }
}

function cmdShutdown(_args: string[], _state: ShellState): CommandResult {
  return { output: '', shutdown: true }
}

function cmdRm(args: string[], _state: ShellState): CommandResult {
  const joined = args.join(' ')
  if (joined.includes('-rf') && joined.includes('/')) {
    return { output: 'Nice try.' }
  }
  return { output: 'rm: operation not permitted' }
}

// -- Command registry --

const commands: Record<string, CommandHandler> = {
  ls: cmdLs,
  cd: cmdCd,
  cat: cmdCat,
  pwd: cmdPwd,
  echo: cmdEcho,
  whoami: cmdWhoami,
  uname: cmdUname,
  date: cmdDate,
  clear: cmdClear,
  exit: cmdExit,
  vim: cmdVim,
  vi: cmdVim,
  neofetch: cmdNeofetch,
  help: cmdHelp,
  sudo: cmdSudo,
  shutdown: cmdShutdown,
  poweroff: cmdShutdown,
  halt: cmdShutdown,
  rm: cmdRm,
}

// sudo is special: it strips itself and re-dispatches
function cmdSudo(args: string[], state: ShellState): CommandResult {
  if (args.length === 0) {
    return { output: 'usage: sudo <command>' }
  }
  return executeCommand(args.join(' '), state)
}

// -- Public API --

export function executeCommand(input: string, state: ShellState): CommandResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { output: '' }
  }

  const parts = trimmed.split(/\s+/)
  const cmdName = parts[0]
  const args = parts.slice(1)

  const handler = commands[cmdName]
  if (!handler) {
    return { output: `bash: ${cmdName}: command not found` }
  }

  return handler(args, state)
}

export function getCommandNames(): string[] {
  return Object.keys(commands)
}
