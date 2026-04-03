# Vim :q Easter Egg — Fake Shell Implementation Plan

## Overview

When a user types `:q`, `:wq`, `:x` (or `!` variants) in vim mode, the entire page is replaced with a full-screen fake Linux terminal (green-on-black Matrix style). The terminal supports a small set of commands, tab completion, command history, and a fake filesystem with easter egg files. Typing `exit` returns to the editor. Shutdown commands trigger a systemd-style shutdown animation ending in a permanent black screen (reload required).

**No external dependencies.** Everything is built with plain React + CSS on top of the existing `monaco-vim` `defineEx` API.

---

## File Structure

```
packages/app/src/components/fake-shell/
├── FakeShell.tsx           # Main component (input, output, history, tab completion)
├── ShutdownOverlay.tsx     # Shutdown animation sequence
├── commands.ts             # Command interpreter (pure functions)
├── filesystem.ts           # Fake filesystem tree + utilities
└── neofetch.ts             # ASCII art + system info generator
```

Modified files:

- `packages/app/src/components/editor/vimTypes.ts` — add `defineEx` to `VimAPI`
- `packages/app/src/components/editor/vim.ts` — add `defineEx` hooks + subscriber
- `packages/app/src/components/PoeEditor.tsx` — wire up shell state + render `<FakeShell>`

---

## Phase 1: Foundation (can be parallelized as 3 independent subagents)

### Task 1A: Fake Filesystem

**File:** `packages/app/src/components/fake-shell/filesystem.ts`

Create a static in-memory filesystem tree and utility functions.

**Type:**

```ts
interface FSNode {
  type: "file" | "directory";
  content?: string; // file content
  children?: Record<string, FSNode>; // directory entries
  permissions?: string; // e.g. "-rwxr-xr-x", "drwxr-xr-x"
  size?: number; // byte count for ls -la
}
```

**Filesystem tree:**

```
/
├── home/
│   └── edgar/               ← this is ~ (home dir)
│       ├── documents/
│       │   └── definitely-not-a-virus.sh  → "#!/bin/bash\necho 'You have been hacked!'\necho 'Just kidding.'"
│       ├── .bashrc                        → "# ~/.bashrc\nalias vim='echo just use poe-editor'"
│       ├── .vimrc                         → "\" finally escaped vim\n\" or did I?"
│       ├── todo.txt                       → "1. finish this editor\n2. touch grass\n3. figure out how to exit vim"
│       ├── README.md                      → "You found the secret terminal!\n\nThere is nothing useful here. Go back to writing."
│       └── poems/
│           └── the-raven.md              → First stanza of The Raven by Edgar Allan Poe
├── bin/    (empty directory)
├── etc/    (empty directory)
├── tmp/    (empty directory)
└── var/    (empty directory)
```

**Utility functions to export:**

- `resolve(cwd: string, path: string): string` — resolve relative/absolute/~ paths to absolute
- `getNode(absolutePath: string): FSNode | null` — traverse tree to find node
- `listDir(cwd: string, path?: string): { name: string; node: FSNode }[] | null` — list directory contents
- `readFile(cwd: string, path: string): string | null` — get file content
- `isDir(cwd: string, path: string): boolean` — check if path is a directory
- `completePath(cwd: string, partial: string): string[]` — return matching filenames for tab completion

**Notes:**

- `ls -la` needs permissions, size, and fake dates (use a fixed date like `Mar 15 13:37`)
- `ls` without `-la` should show just names, with directories colored blue and `.sh` files green
- Hidden files (`.bashrc`, `.vimrc`) only shown with `-a`/`-la` flags

---

### Task 1B: Command Interpreter

**File:** `packages/app/src/components/fake-shell/commands.ts`

Pure functions with no React dependency. Each command receives parsed args and returns output.

**Types:**

```ts
interface ShellState {
  cwd: string; // absolute path, starts at /home/edgar
}

interface CommandResult {
  output: string; // text to display (may contain color tokens)
  exit?: boolean; // true = return to editor
  shutdown?: boolean; // true = trigger shutdown sequence
  clear?: boolean; // true = clear scrollback
  newCwd?: string; // if command changed directory
}

type CommandFn = (args: string[], state: ShellState) => CommandResult;
```

**Command table:**

| Command                          | Behavior                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `ls`                             | List current dir. Flags: `-l`, `-a`, `-la`/`-al`. Color dirs blue, `.sh` green.           |
| `cd <dir>`                       | Change cwd. Support `..`, `.`, `~`, absolute paths. Error if not a directory.             |
| `cat <file>`                     | Print file content. Error if not found or is directory.                                   |
| `pwd`                            | Print `state.cwd`                                                                         |
| `echo <...>`                     | Join remaining args with spaces, print                                                    |
| `whoami`                         | `edgar`                                                                                   |
| `uname` / `uname -a` / any flags | `PoeOS 6.6.6-poe #1 SMP PREEMPT_DYNAMIC Edgar x86_64 GNU/Linux`                           |
| `date`                           | Real current date in Linux format (e.g. `Thu Apr  3 12:00:00 UTC 2026`)                   |
| `clear`                          | Return `{ clear: true }`                                                                  |
| `exit`                           | Return `{ exit: true }`                                                                   |
| `vim` / `vi`                     | Print `You just left vim. Are you sure you want to go back?` then return `{ exit: true }` |
| `neofetch`                       | Delegate to neofetch module (Task 1C)                                                     |
| `help`                           | Print list of available commands with one-line descriptions                               |
| `sudo <cmd>`                     | Strip `sudo` prefix, re-parse and execute inner command (no password prompt)              |
| `shutdown` / `poweroff` / `halt` | Return `{ shutdown: true }`                                                               |
| `<empty>`                        | No output, just new prompt                                                                |
| `<anything else>`                | `bash: <cmd>: command not found`                                                          |

**Main entry point:**

```ts
export function executeCommand(input: string, state: ShellState): CommandResult;
```

This function should:

1. Trim and split input on whitespace
2. Handle `sudo` prefix by stripping it and recursing
3. Look up command name in a map
4. Call the handler with remaining args + state
5. Return result

---

### Task 1C: Neofetch ASCII Art

**File:** `packages/app/src/components/fake-shell/neofetch.ts`

**Export:** `function neofetch(): string`

Returns a pre-formatted string with ASCII art and system info side by side.

```
         ___         edgar@poe-editor
        (o o)        ----------------
       (  V  )       OS: PoeOS 6.6.6
       /|   |\       Host: poe-editor
      / |   | \      Kernel: 6.6.6-poe
         m m         Shell: bash 5.2
                     Editor: vim (escaped)
                     Theme: Matrix Green
                     Uptime: since you typed :q
                     Packages: 0 (npm)
                     Memory: 640K (ought to be enough)
```

Use color tokens (same format as the shell output renderer) so the raven art is in green and the labels are bold/colored.

---

## Phase 2: Shell UI Component (depends on Phase 1)

### Task 2A: FakeShell Component

**File:** `packages/app/src/components/fake-shell/FakeShell.tsx`

**Props:**

```ts
interface FakeShellProps {
  onExit: () => void; // called when user types `exit` or `vim`/`vi`
}
```

**Rendering:**

- `position: fixed; inset: 0; z-index: 9999`
- Background: `#000000`
- Text color: `#00ff00` (Matrix green)
- Font: `'Courier New', 'Consolas', monospace`, ~14px
- Slight text-shadow glow: `0 0 5px rgba(0, 255, 0, 0.5)` for CRT feel

**Structure:**

```
<div class="fake-shell">           ← fixed fullscreen, black bg
  <div class="shell-output">       ← scrollable area, grows upward
    {lines.map(line => <Line />)}   ← rendered output lines
  </div>
  <div class="shell-input-line">   ← prompt + input at bottom
    <span>edgar@poe-editor:~$</span>
    <input />                       ← hidden/styled input
  </div>
</div>
```

**State:**

```ts
const [lines, setLines] = useState<OutputLine[]>([motdBanner]);
const [input, setInput] = useState("");
const [shellState, setShellState] = useState<ShellState>({
  cwd: "/home/edgar",
});
const [history, setHistory] = useState<string[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);
const [isShutdown, setIsShutdown] = useState(false);
```

**Input handling (onKeyDown):**

- `Enter` → execute command, append input line + output to `lines`, clear input, reset history index, auto-scroll to bottom
- `Tab` → prevent default, run tab completion:
  - First token: complete against command names
  - Subsequent tokens: complete against filenames via `completePath()`
  - Single match: replace token inline
  - Multiple matches: append line showing all matches
- `ArrowUp` → go back in history (decrement index, set input)
- `ArrowDown` → go forward in history (increment index, set input or clear)
- `Ctrl+C` → clear current input, append `^C` line, new prompt
- `Ctrl+L` → clear scrollback

**MOTD banner on mount:**

```
PoeOS 6.6.6-poe (tty1)

poe-editor login: edgar
Last login: [current date] on tty1

edgar@poe-editor:~$
```

**Prompt format:**

The prompt should reflect `cwd`. When in home dir show `~`, otherwise show path:

- `/home/edgar` → `edgar@poe-editor:~$`
- `/home/edgar/poems` → `edgar@poe-editor:~/poems$`
- `/tmp` → `edgar@poe-editor:/tmp$`

**Special handling:**

- When `executeCommand` returns `{ exit: true }` → call `onExit()`
- When it returns `{ shutdown: true }` → set `isShutdown = true`
- When it returns `{ clear: true }` → clear lines array
- When it returns `{ newCwd }` → update `shellState.cwd`
- `vim`/`vi` command: show the joke message, then after a ~1s timeout call `onExit()`

**Focus management:**

- Auto-focus input on mount
- Re-focus input on any click within the shell div
- Prevent tab from moving focus out

**If `isShutdown` is true:** render `<ShutdownOverlay />` instead of the shell

---

### Task 2B: Shutdown Overlay

**File:** `packages/app/src/components/fake-shell/ShutdownOverlay.tsx`

**Props:** none (this is a terminal state — no escape)

**Sequence** (staggered ~400ms per line):

```
Broadcast message from edgar@poe-editor:
  The system is going down for poweroff NOW!

[  OK  ] Stopped Poe Markdown Daemon
[  OK  ] Stopped Session Manager for edgar
[  OK  ] Unmounted /dev/inspiration
[  OK  ] Deactivated swap: /dev/writers-block
[  OK  ] Stopped Creative Writing Service
[  OK  ] Stopped NetworkManager
[  OK  ] Reached target Shutdown
[  OK  ] Reached target Final Step
         Powering off...
```

**Implementation:**

- Array of message strings
- `useEffect` with `setInterval` or chained `setTimeout`, adding one message at a time to state
- `[  OK  ]` prefix rendered in green, rest in white
- After all messages displayed, wait ~800ms then clear everything to pure black
- Final state: completely black div, no text, no cursor, `position: fixed; inset: 0; z-index: 10000`
- No event handlers, no way out except browser reload

**Styling:** Same monospace green-on-black as the shell.

---

## Phase 3: Wiring (depends on Phase 1 + 2)

### Task 3A: Vim Ex-Command Registration

**Files:**

- `packages/app/src/components/editor/vimTypes.ts`
- `packages/app/src/components/editor/vim.ts`

**Step 1 — Update `VimAPI` type in `vimTypes.ts`:**

Add to the `VimAPI` interface:

```ts
defineEx: (name: string, prefix: string, fn: (cm: CodeMirrorAdapter) => void) => void
```

**Step 2 — Add subscriber + defineEx calls in `vim.ts`:**

Follow the exact same pattern as the existing `onVimSpellCheckChange`:

```ts
// Shell activation subscriber
type ShellActivationCallback = () => void;
const shellActivationSubscribers: ShellActivationCallback[] = [];

export function onShellActivation(
  callback: ShellActivationCallback,
): () => void {
  shellActivationSubscribers.push(callback);
  return () => {
    const index = shellActivationSubscribers.indexOf(callback);
    if (index > -1) shellActivationSubscribers.splice(index, 1);
  };
}
```

Inside `setupVim()`, after existing setup, add:

```ts
const triggerShell = () => {
  shellActivationSubscribers.forEach((cb) => cb());
};

Vim.defineEx("q", "q", triggerShell);
Vim.defineEx("q!", "q!", triggerShell);
Vim.defineEx("wq", "wq", triggerShell);
Vim.defineEx("wq!", "wq!", triggerShell);
Vim.defineEx("x", "x", triggerShell);
```

---

### Task 3B: PoeEditor Integration

**File:** `packages/app/src/components/PoeEditor.tsx`

**Changes:**

1. Import `onShellActivation` from `../components/editor/vim`
2. Import `FakeShell` from `./fake-shell/FakeShell`
3. Add state: `const [shellActive, setShellActive] = useState(false)`
4. Add effect to subscribe:

```ts
useEffect(() => {
  return onShellActivation(() => setShellActive(true));
}, []);
```

5. Conditional render — when `shellActive` is true, render **only** `<FakeShell onExit={() => setShellActive(false)} />` and skip the entire editor UI. This gives full page takeover without unmounting the editor (it's just hidden behind the fixed overlay... actually since we want realism, we should conditionally render to replace, not overlay).

**Decision:** Use conditional rendering. When `shellActive = true`, return `<FakeShell />` instead of the normal JSX. This means the editor unmounts. When the user exits, `shellActive` becomes false, the editor remounts. Since all state is in the URL hash, the document content is fully preserved — the editor restores seamlessly.

---

## Phase 4: Polish & Testing

### Task 4A: Edge Cases & UX Polish

- Ensure hidden files only show with `-a` flag in `ls`
- Verify `cd ..` from `/` stays at `/`
- Test long output scrolling
- Test rapid command entry
- Verify editor state restores correctly after exit
- Verify shell only activates when vim mode is enabled
- Mobile: ensure input works with virtual keyboard (`inputMode="text"`)

### Task 4B: Tests

- Unit tests for `commands.ts` — each command with various args
- Unit tests for `filesystem.ts` — path resolution, listing, reading
- Unit tests for `neofetch.ts` — snapshot test
- Component test for `FakeShell.tsx` — mount, type command, verify output
- Component test for `ShutdownOverlay.tsx` — verify message sequence
- Integration test: verify `:q` in vim mode triggers shell activation callback

---

## Subagent Parallelization Guide

```
Phase 1 (parallel):
  ├── Subagent A: Task 1A (filesystem.ts)
  ├── Subagent B: Task 1B (commands.ts) — can stub filesystem imports
  └── Subagent C: Task 1C (neofetch.ts)

Phase 2 (parallel, after Phase 1):
  ├── Subagent D: Task 2A (FakeShell.tsx)
  └── Subagent E: Task 2B (ShutdownOverlay.tsx)

Phase 3 (parallel, after Phase 2):
  ├── Subagent F: Task 3A (vim.ts + vimTypes.ts)
  └── Subagent G: Task 3B (PoeEditor.tsx)

Phase 4 (sequential, after Phase 3):
  └── Subagent H: Tasks 4A + 4B (polish + tests)
```
