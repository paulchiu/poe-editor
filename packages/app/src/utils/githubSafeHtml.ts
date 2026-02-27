const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'ins',
  'input',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
])

const DROP_CONTENT_TAGS = new Set(['embed', 'form', 'iframe', 'object', 'script', 'style'])

const GLOBAL_ALLOWED_ATTRIBUTES = new Set([
  'align',
  'aria-label',
  'class',
  'data-language',
  'data-task-index',
  'data-raw-code',
  'title',
])
const TAG_ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title']),
  details: new Set(['open']),
  img: new Set(['align', 'alt', 'height', 'src', 'title', 'width']),
  input: new Set(['checked', 'disabled', 'type']),
  li: new Set(['value']),
  ol: new Set(['start']),
  td: new Set(['align', 'colspan', 'rowspan']),
  th: new Set(['align', 'colspan', 'rowspan']),
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const URL_ATTRIBUTE_NAMES = new Set(['href', 'src'])

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function isSafeRelativeUrl(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.startsWith('./') ||
    url.startsWith('../') ||
    url.startsWith('#') ||
    url.startsWith('?')
  )
}

function isSafeUrl(url: string): boolean {
  const normalizedUrl = url.trim()

  if (!normalizedUrl) return false
  if (isSafeRelativeUrl(normalizedUrl) || normalizedUrl.startsWith('//')) return true

  try {
    return SAFE_PROTOCOLS.has(new URL(normalizedUrl).protocol)
  } catch {
    return false
  }
}

function sanitizeAttributes(element: Element): void {
  const tagName = element.tagName.toLowerCase()
  const tagAttributes = TAG_ALLOWED_ATTRIBUTES[tagName] ?? new Set<string>()

  for (const attribute of Array.from(element.attributes)) {
    const attributeName = attribute.name.toLowerCase()
    const attributeValue = attribute.value
    const isAllowed =
      tagAttributes.has(attributeName) || GLOBAL_ALLOWED_ATTRIBUTES.has(attributeName)

    if (attributeName.startsWith('on') || !isAllowed) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (URL_ATTRIBUTE_NAMES.has(attributeName) && !isSafeUrl(attributeValue)) {
      element.removeAttribute(attribute.name)
    }
  }

  if (tagName === 'input') {
    const inputType = (element.getAttribute('type') ?? '').toLowerCase()
    if (inputType !== 'checkbox') {
      element.remove()
      return
    }

    element.setAttribute('type', 'checkbox')
  }
}

function sanitizeNodeTree(root: ParentNode, document: Document): void {
  const childNodes = Array.from(root.childNodes)

  for (const childNode of childNodes) {
    if (childNode.nodeType === Node.COMMENT_NODE) {
      childNode.remove()
      continue
    }

    if (childNode.nodeType !== Node.ELEMENT_NODE) continue

    const element = childNode as Element
    const tagName = element.tagName.toLowerCase()

    if (DROP_CONTENT_TAGS.has(tagName)) {
      element.remove()
      continue
    }

    sanitizeNodeTree(element, document)

    if (!ALLOWED_TAGS.has(tagName)) {
      const replacement = document.createDocumentFragment()
      while (element.firstChild) replacement.append(element.firstChild)
      element.replaceWith(replacement)
      continue
    }

    sanitizeAttributes(element)
  }
}

/**
 * Sanitizes raw HTML using a GitHub-safe allowlist.
 * @param html - Unsanitized HTML string.
 * @returns Sanitized HTML with unsafe tags and attributes removed.
 */
export function sanitizeGithubSafeHtml(html: string): string {
  if (!html) return ''

  if (typeof DOMParser === 'undefined') return escapeHtml(html)

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  sanitizeNodeTree(document.body, document)
  return document.body.innerHTML
}
