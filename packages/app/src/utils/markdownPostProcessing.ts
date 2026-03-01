const GITHUB_CALLOUT_MARKER_TO_TYPE = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'important',
  WARNING: 'warning',
  CAUTION: 'caution',
} as const

type GithubCalloutMarker = keyof typeof GITHUB_CALLOUT_MARKER_TO_TYPE

const GITHUB_CALLOUT_MARKER_PATTERN = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:\r?\n|$)/i

function toCalloutTitle(marker: GithubCalloutMarker): string {
  return marker[0] + marker.slice(1).toLowerCase()
}

function transformGithubCalloutBlockquote(blockquote: Element, document: Document): void {
  const firstChild = blockquote.firstElementChild
  if (!firstChild || firstChild.tagName.toLowerCase() !== 'p') return

  const firstParagraph = firstChild as HTMLParagraphElement
  const markerMatch = firstParagraph.innerHTML.match(GITHUB_CALLOUT_MARKER_PATTERN)
  if (!markerMatch) return

  const marker = markerMatch[1]?.toUpperCase() as GithubCalloutMarker
  const calloutType = GITHUB_CALLOUT_MARKER_TO_TYPE[marker]
  if (!calloutType) return

  const calloutTitle = document.createElement('p')
  calloutTitle.className = 'markdown-alert-title'
  calloutTitle.textContent = toCalloutTitle(marker)
  blockquote.insertBefore(calloutTitle, blockquote.firstChild)
  blockquote.classList.add('markdown-alert', `markdown-alert-${calloutType}`)

  const remainingContent = firstParagraph.innerHTML.slice(markerMatch[0].length).trim()
  if (!remainingContent) {
    firstParagraph.remove()
    return
  }

  firstParagraph.innerHTML = remainingContent
}

/**
 * Converts GitHub callout blockquote syntax to alert-marked HTML blockquotes.
 * @param html - Rendered markdown HTML.
 * @returns HTML with callout transformations applied.
 */
export function renderGithubCallouts(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const blockquotes = Array.from(document.body.querySelectorAll('blockquote'))

  for (const blockquote of blockquotes) {
    transformGithubCalloutBlockquote(blockquote, document)
  }

  return document.body.innerHTML
}

/**
 * Converts markdown task-list notation into checkbox inputs with stable task indexes.
 * @param html - Rendered markdown HTML.
 * @returns HTML with task list markup transformed.
 */
export function renderTaskLists(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const listItems = Array.from(document.body.querySelectorAll('li'))
  let taskIndex = 0

  for (const listItem of listItems) {
    const firstElement = listItem.firstElementChild
    const container =
      firstElement && firstElement.tagName.toLowerCase() === 'p' ? firstElement : listItem
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

    let firstTextNode: Text | null = null
    while (walker.nextNode()) {
      const candidate = walker.currentNode as Text
      const candidateText = candidate.textContent ?? ''
      if (candidateText.trim().length === 0) continue
      firstTextNode = candidate
      break
    }

    if (!firstTextNode) continue

    const initialText = firstTextNode.textContent ?? ''
    const taskPrefixMatch = initialText.match(/^(\s*)\[([ xX])\](\s+|$)/)
    if (!taskPrefixMatch) continue

    const checked = taskPrefixMatch[2].toLowerCase() === 'x'
    firstTextNode.textContent = initialText.slice(taskPrefixMatch[0].length)

    const checkbox = document.createElement('input')
    checkbox.setAttribute('type', 'checkbox')
    checkbox.setAttribute('class', 'task-list-item-checkbox')
    checkbox.setAttribute('data-task-index', String(taskIndex))
    checkbox.setAttribute('aria-label', `Toggle task ${taskIndex + 1}`)
    if (checked) checkbox.setAttribute('checked', '')

    container.insertBefore(checkbox, firstTextNode)
    container.insertBefore(document.createTextNode(' '), firstTextNode)

    listItem.classList.add('task-list-item')
    const parentList = listItem.closest('ul,ol')
    if (parentList) parentList.classList.add('contains-task-list')

    taskIndex += 1
  }

  return document.body.innerHTML
}
