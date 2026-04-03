export interface FSNode {
  type: 'file' | 'directory'
  content?: string
  children?: Record<string, FSNode>
  permissions?: string
  size?: number
}

export const HOME = '/home/edgar'

function file(content: string, permissions = '-rw-r--r--'): FSNode {
  return { type: 'file', content, permissions, size: content.length }
}

function dir(children: Record<string, FSNode> = {}, permissions = 'drwxr-xr-x'): FSNode {
  return { type: 'directory', children, permissions, size: 4096 }
}

function executableFile(content: string): FSNode {
  return file(content, '-rwxr-xr-x')
}

const fs: FSNode = dir({
  home: dir({
    edgar: dir({
      documents: dir({
        'definitely-not-a-virus.sh': executableFile(
          "#!/bin/bash\necho 'You have been hacked!'\necho 'Just kidding.'"
        ),
      }),
      '.bashrc': file("# ~/.bashrc\nalias vim='echo just use poe-editor'"),
      '.vimrc': file('" finally escaped vim\n" or did I?'),
      'todo.txt': file('1. finish this editor\n2. touch grass\n3. figure out how to exit vim'),
      'README.md': file(
        'You found the secret terminal!\n\nThere is nothing useful here. Go back to writing.'
      ),
      poems: dir({
        'the-raven.md': file(
          [
            'Once upon a midnight dreary, while I pondered, weak and weary,',
            'Over many a quaint and curious volume of forgotten lore,',
            'While I nodded, nearly napping, suddenly there came a tapping,',
            'As of some one gently rapping, rapping at my chamber door.',
            '"\'Tis some visitor," I muttered, "tapping at my chamber door;',
            'Only this and nothing more."',
          ].join('\n')
        ),
      }),
    }),
  }),
  bin: dir(),
  etc: dir(),
  tmp: dir(),
  var: dir(),
})

/**
 * Resolve a relative, absolute, or ~-prefixed path against a working directory.
 * Returns a normalized absolute path (no trailing slash, except for root "/").
 */
export function resolve(cwd: string, path: string): string {
  let segments: string[]

  if (path.startsWith('~')) {
    segments = (HOME + path.slice(1)).split('/').filter(Boolean)
  } else if (path.startsWith('/')) {
    segments = path.split('/').filter(Boolean)
  } else {
    segments = cwd.split('/').filter(Boolean).concat(path.split('/').filter(Boolean))
  }

  const resolved: string[] = []
  for (const seg of segments) {
    if (seg === '.') continue
    if (seg === '..') {
      resolved.pop()
    } else {
      resolved.push(seg)
    }
  }

  return '/' + resolved.join('/')
}

/**
 * Traverse the filesystem tree and return the node at the given absolute path.
 * Returns null if the path does not exist.
 */
export function getNode(absolutePath: string): FSNode | null {
  const segments = absolutePath.split('/').filter(Boolean)
  let node: FSNode = fs

  for (const seg of segments) {
    if (node.type !== 'directory' || !node.children?.[seg]) {
      return null
    }
    node = node.children[seg]
  }

  return node
}

/**
 * List entries in a directory. If no path is provided, lists the cwd.
 * Returns null if the target is not a directory or does not exist.
 */
export function listDir(cwd: string, path?: string): { name: string; node: FSNode }[] | null {
  const target = path !== undefined ? resolve(cwd, path) : cwd
  const node = getNode(target)

  if (!node || node.type !== 'directory' || !node.children) {
    return null
  }

  return Object.entries(node.children).map(([name, child]) => ({
    name,
    node: child,
  }))
}

/**
 * Read the content of a file. Returns null if the path does not exist or is a directory.
 */
export function readFile(cwd: string, path: string): string | null {
  const abs = resolve(cwd, path)
  const node = getNode(abs)

  if (!node || node.type !== 'file') {
    return null
  }

  return node.content ?? ''
}

/**
 * Check whether a path resolves to a directory.
 */
export function isDir(cwd: string, path: string): boolean {
  const abs = resolve(cwd, path)
  const node = getNode(abs)
  return node?.type === 'directory'
}

/**
 * Return matching filenames/directory names for tab completion.
 * The partial string may include a path prefix (e.g. "documents/def").
 * Returns completions relative to that same prefix.
 */
export function completePath(cwd: string, partial: string): string[] {
  const lastSlash = partial.lastIndexOf('/')
  const dirPart = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : ''
  const prefix = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial

  const dirPath = dirPart ? resolve(cwd, dirPart) : cwd
  const node = getNode(dirPath)

  if (!node || node.type !== 'directory' || !node.children) {
    return []
  }

  return Object.entries(node.children)
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, child]) => {
      const suffix = child.type === 'directory' ? '/' : ''
      return dirPart + name + suffix
    })
}
