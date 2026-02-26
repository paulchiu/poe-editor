import { getMermaidInitScript, type MermaidColorMode } from '@/utils/mermaidTheme'

interface BuildHtmlExportDocumentParams {
  documentName: string
  htmlContent: string
  colorMode: MermaidColorMode
}

function getExportCopyScript(): string {
  return `(() => {
  const COPY_HOST_CLASS = 'preview-code-copy-host'
  const COPY_BUTTON_CLASS = 'preview-code-copy-button'
  const COPY_LABEL_CLASS = 'preview-code-copy-label'
  const MERMAID_CONTROLS_CLASS = 'preview-mermaid-copy-controls'
  const MERMAID_IMAGE_BUTTON_CLASS = 'preview-mermaid-copy-image-button'
  const MERMAID_MENU_TOGGLE_CLASS = 'preview-mermaid-copy-menu-toggle'
  const MERMAID_MENU_CLASS = 'preview-mermaid-copy-menu'
  const MERMAID_CODE_BUTTON_CLASS = 'preview-mermaid-copy-code-button'
  const MERMAID_HOST_SELECTOR = '.code-block-with-language[data-language="mermaid"]'

  const toCodeText = (value) => value.replace(/\\n$/, '')

  const setButtonLabel = (button, value) => {
    const label = button.querySelector('.' + COPY_LABEL_CLASS)
    if (label) label.textContent = value
  }

  const createButton = () => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = COPY_BUTTON_CLASS
    button.setAttribute('aria-label', 'Copy code block')

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('viewBox', '0 0 24 24')
    icon.setAttribute('aria-hidden', 'true')
    icon.classList.add('preview-code-copy-icon')

    const frontSheet = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    frontSheet.setAttribute('x', '9')
    frontSheet.setAttribute('y', '9')
    frontSheet.setAttribute('width', '11')
    frontSheet.setAttribute('height', '11')
    frontSheet.setAttribute('rx', '2')
    frontSheet.setAttribute('ry', '2')

    const backSheet = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    backSheet.setAttribute('d', 'M6 15c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2')
    icon.append(frontSheet, backSheet)

    const label = document.createElement('span')
    label.className = COPY_LABEL_CLASS
    label.textContent = 'Copy'

    button.append(icon, label)
    return button
  }

  const createMermaidControls = () => {
    const controls = document.createElement('div')
    controls.className = MERMAID_CONTROLS_CLASS

    const imageButton = document.createElement('button')
    imageButton.type = 'button'
    imageButton.className = MERMAID_IMAGE_BUTTON_CLASS
    imageButton.setAttribute('aria-label', 'Copy Mermaid image')
    imageButton.setAttribute('data-default-label', 'Copy image')

    const imageIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    imageIcon.setAttribute('viewBox', '0 0 24 24')
    imageIcon.setAttribute('aria-hidden', 'true')
    imageIcon.classList.add('preview-code-copy-icon')

    const imageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    imageRect.setAttribute('x', '3')
    imageRect.setAttribute('y', '5')
    imageRect.setAttribute('width', '18')
    imageRect.setAttribute('height', '14')
    imageRect.setAttribute('rx', '2')
    imageRect.setAttribute('ry', '2')

    const imagePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    imagePath.setAttribute('d', 'M3 15l5-5 4 4 4-4 5 5')
    imageIcon.append(imageRect, imagePath)

    const imageLabel = document.createElement('span')
    imageLabel.className = COPY_LABEL_CLASS
    imageLabel.textContent = 'Copy image'

    imageButton.append(imageIcon, imageLabel)

    const menuToggle = document.createElement('button')
    menuToggle.type = 'button'
    menuToggle.className = MERMAID_MENU_TOGGLE_CLASS
    menuToggle.setAttribute('aria-label', 'Mermaid copy options')
    menuToggle.setAttribute('aria-haspopup', 'menu')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.textContent = '▾'

    const menu = document.createElement('div')
    menu.className = MERMAID_MENU_CLASS
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', 'Mermaid copy options')

    const copyCodeButton = document.createElement('button')
    copyCodeButton.type = 'button'
    copyCodeButton.className = MERMAID_CODE_BUTTON_CLASS
    copyCodeButton.setAttribute('role', 'menuitem')
    copyCodeButton.setAttribute('data-default-label', 'Copy code')

    const codeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    codeIcon.setAttribute('viewBox', '0 0 24 24')
    codeIcon.setAttribute('aria-hidden', 'true')
    codeIcon.classList.add('preview-code-copy-icon')

    const codeFrontSheet = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    codeFrontSheet.setAttribute('x', '9')
    codeFrontSheet.setAttribute('y', '9')
    codeFrontSheet.setAttribute('width', '11')
    codeFrontSheet.setAttribute('height', '11')
    codeFrontSheet.setAttribute('rx', '2')
    codeFrontSheet.setAttribute('ry', '2')

    const codeBackSheet = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    codeBackSheet.setAttribute('d', 'M6 15c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2')
    codeIcon.append(codeFrontSheet, codeBackSheet)

    const codeLabel = document.createElement('span')
    codeLabel.className = COPY_LABEL_CLASS
    codeLabel.textContent = 'Copy code'

    copyCodeButton.append(codeIcon, codeLabel)
    menu.append(copyCodeButton)
    controls.append(imageButton, menuToggle, menu)

    return controls
  }

  const closeMermaidMenus = (exceptControls) => {
    const controlsList = Array.from(document.querySelectorAll('.' + MERMAID_CONTROLS_CLASS))
    for (const controls of controlsList) {
      if (exceptControls && controls === exceptControls) continue
      controls.classList.remove('is-open')
      const toggle = controls.querySelector('.' + MERMAID_MENU_TOGGLE_CLASS)
      if (toggle) toggle.setAttribute('aria-expanded', 'false')
    }
  }

  const ensureButtons = () => {
    const codeElements = Array.from(document.querySelectorAll('pre > code'))
    const processedHosts = new Set()
    const mermaidHosts = new Set()

    for (const codeElement of codeElements) {
      const preElement = codeElement.closest('pre')
      if (!preElement) continue

      const wrappedBlock = preElement.closest('.code-block-with-language')
      const host = wrappedBlock ?? preElement
      if (processedHosts.has(host)) continue
      processedHosts.add(host)

      const codeText = toCodeText(codeElement.textContent || '')
      const isMermaidHost =
        codeElement.classList.contains('language-mermaid') ||
        (host.matches && host.matches(MERMAID_HOST_SELECTOR))

      if (isMermaidHost) {
        if (codeText) host.setAttribute('data-raw-code', codeText)
        mermaidHosts.add(host)
        continue
      }

      host.classList.add(COPY_HOST_CLASS)

      const hasButton = Array.from(host.children).some(
        (child) => child.classList && child.classList.contains(COPY_BUTTON_CLASS)
      )
      if (hasButton) continue

      host.append(createButton())
    }

    const explicitMermaidHosts = Array.from(document.querySelectorAll(MERMAID_HOST_SELECTOR))
    for (const host of explicitMermaidHosts) {
      mermaidHosts.add(host)
    }

    for (const host of mermaidHosts) {
      host.classList.add(COPY_HOST_CLASS)

      if (!host.getAttribute('data-raw-code')) {
        const mermaidCodeElement = host.querySelector('pre > code')
        const mermaidCode = toCodeText((mermaidCodeElement && mermaidCodeElement.textContent) || '')
        if (mermaidCode) {
          host.setAttribute('data-raw-code', mermaidCode)
        }
      }

      const hasControls = Array.from(host.children).some(
        (child) => child.classList && child.classList.contains(MERMAID_CONTROLS_CLASS)
      )
      if (hasControls || !host.getAttribute('data-raw-code')) continue

      host.append(createMermaidControls())
    }
  }

  const copyWithFallback = async (text) => {
    if (!text) return false
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {}

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      document.body.append(textarea)
      textarea.focus()
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      return copied
    } catch {
      return false
    }
  }

  const activeTimeouts = new Map()

  const setCopiedState = (button, copiedLabel) => {
    setButtonLabel(button, copiedLabel)
    button.setAttribute('data-copied', 'true')

    const previousTimeout = activeTimeouts.get(button)
    if (previousTimeout !== undefined) window.clearTimeout(previousTimeout)

    const timeoutId = window.setTimeout(() => {
      if (!button.isConnected) return
      const defaultLabel = button.getAttribute('data-default-label') || 'Copy'
      setButtonLabel(button, defaultLabel)
      button.removeAttribute('data-copied')
      activeTimeouts.delete(button)
    }, 2000)
    activeTimeouts.set(button, timeoutId)
  }

  const copySvgAsImage = async (svgMarkup) => {
    if (!svgMarkup || !navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
      return false
    }

    try {
      const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' })
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/svg+xml': svgBlob,
        }),
      ])
      return true
    } catch {
      return false
    }
  }

  const onClick = async (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const menuToggle = target.closest('.' + MERMAID_MENU_TOGGLE_CLASS)
    if (menuToggle) {
      event.preventDefault()
      event.stopPropagation()

      const controls = menuToggle.closest('.' + MERMAID_CONTROLS_CLASS)
      if (!controls) return

      const isOpen = controls.classList.toggle('is-open')
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      if (isOpen) {
        closeMermaidMenus(controls)
      }
      return
    }

    const imageButton = target.closest('.' + MERMAID_IMAGE_BUTTON_CLASS)
    if (imageButton) {
      event.preventDefault()
      event.stopPropagation()

      const host = imageButton.closest('.' + COPY_HOST_CLASS)
      if (!(host instanceof HTMLElement)) return

      const svgElement = host.querySelector('svg')
      if (!svgElement) return
      const svgMarkup = new XMLSerializer().serializeToString(svgElement)
      const copied = await copySvgAsImage(svgMarkup)
      if (!copied) return

      setCopiedState(imageButton, 'Image copied')
      closeMermaidMenus()
      return
    }

    const mermaidCopyCodeButton = target.closest('.' + MERMAID_CODE_BUTTON_CLASS)
    if (mermaidCopyCodeButton) {
      event.preventDefault()
      event.stopPropagation()

      const host = mermaidCopyCodeButton.closest('.' + COPY_HOST_CLASS)
      if (!(host instanceof HTMLElement)) return

      const codeElement = host.querySelector('pre > code')
      const fallbackCode = toCodeText((codeElement && codeElement.textContent) || '')
      const code = host.getAttribute('data-raw-code') || fallbackCode
      const copied = await copyWithFallback(code)
      if (!copied) return

      setCopiedState(mermaidCopyCodeButton, 'Code copied')
      closeMermaidMenus()
      return
    }

    const button = target.closest('.' + COPY_BUTTON_CLASS)
    if (!button) return

    event.preventDefault()
    event.stopPropagation()

    const host = button.parentElement
    if (!(host instanceof HTMLElement)) return

    const codeElement = host.matches('pre') ? host.querySelector('code') : host.querySelector('pre > code')
    const fallbackCode = toCodeText((codeElement && codeElement.textContent) || '')
    const code = host.getAttribute('data-raw-code') || fallbackCode
    const copied = await copyWithFallback(code)
    if (!copied) return

    setCopiedState(button, 'Copied')
    closeMermaidMenus()
  }

  const init = () => {
    ensureButtons()
    const observer = new MutationObserver(() => ensureButtons())
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', onClick)
    document.addEventListener('click', (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.' + MERMAID_CONTROLS_CLASS)) return
      closeMermaidMenus()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()`
}

function getCodeBlockVariables(colorMode: MermaidColorMode): string {
  if (colorMode === 'dark') {
    return `
      --code-block-border: #3d444db3;
      --code-block-background: #151b23;
      --code-block-header-border: #3d444db3;
      --code-block-header-background: #0d1117;
      --code-block-header-color: #9198a1;
      --code-block-foreground: #f0f6fc;`
  }

  return `
      --code-block-border: #c8b28f;
      --code-block-background: #f0efeb;
      --code-block-header-border: #dbcdb6;
      --code-block-header-background: #faf9f7;
      --code-block-header-color: #6f5738;
      --code-block-foreground: #2a2a2a;`
}

function getCodeSyntaxVariables(colorMode: MermaidColorMode): string {
  if (colorMode === 'dark') {
    return `
      --code-syntax-keyword: var(--color-prettylights-syntax-keyword);
      --code-syntax-string: var(--color-prettylights-syntax-string);
      --code-syntax-variable: var(--color-prettylights-syntax-variable);
      --code-syntax-number: var(--color-prettylights-syntax-variable);
      --code-syntax-entity: var(--color-prettylights-syntax-entity);
      --code-syntax-comment: var(--color-prettylights-syntax-comment);`
  }

  return `
      --code-syntax-keyword: #a626a4;
      --code-syntax-string: #50a14f;
      --code-syntax-variable: #986801;
      --code-syntax-number: #986801;
      --code-syntax-entity: #005cc5;
      --code-syntax-comment: #6a737d;`
}

/**
 * Builds a complete HTML export document for rendered markdown content.
 * @param params - HTML export options
 * @returns A full HTML document string ready for file download
 */
export function buildHtmlExportDocument({
  documentName,
  htmlContent,
  colorMode,
}: BuildHtmlExportDocumentParams): string {
  const hasMermaid = htmlContent.includes('language-mermaid')
  const markdownStylesheet = `https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-${colorMode}.min.css`
  const bodyColors =
    colorMode === 'dark'
      ? 'background-color: #0d1117; color: #f0f6fc;'
      : 'background-color: #ffffff; color: #24292f;'
  const codeBlockVariables = getCodeBlockVariables(colorMode)
  const codeSyntaxVariables = getCodeSyntaxVariables(colorMode)
  const exportCopyScript = getExportCopyScript()
  const fontLinks = `\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">`

  const mermaidScripts = hasMermaid
    ? `\n  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.min.js"></script>\n  <script>${getMermaidInitScript(colorMode)}</script>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="${colorMode}">
  <title>${documentName}</title>
  <link rel="stylesheet" href="${markdownStylesheet}">${fontLinks}
  <script>${exportCopyScript}</script>${mermaidScripts}
  <style>
    body {
      margin: 0;
      ${bodyColors}
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      color-scheme: ${colorMode};
      font-family: 'Crimson Text', serif;
      font-size: 1rem;
      line-height: 1.3;
${codeBlockVariables}
${codeSyntaxVariables}
    }
    .markdown-body code,
    .markdown-body pre,
    .markdown-body tt {
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
    .markdown-body pre {
      margin: 1rem 0;
      overflow: hidden;
      border: 1px solid var(--code-block-border);
      border-radius: 12px;
      background: var(--code-block-background);
    }
    .markdown-body .code-block-with-language {
      margin: 1rem 0;
      overflow: hidden;
      border: 1px solid var(--code-block-border);
      border-radius: 12px;
      background: var(--code-block-background);
    }
    .markdown-body .code-block-language-hint {
      display: flex;
      align-items: center;
      min-height: 2rem;
      padding: 0.35rem 0.8rem;
      border-bottom: 1px solid var(--code-block-header-border);
      color: var(--code-block-header-color);
      background: var(--code-block-header-background);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .markdown-body .preview-code-copy-host {
      position: relative;
    }
    .markdown-body .preview-code-copy-button {
      position: absolute;
      top: 0.6rem;
      right: 0.5rem;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      height: 1.5rem;
      padding: 0 0.55rem;
      border: 1px solid var(--code-block-header-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--code-block-header-background) 85%, var(--code-block-background));
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    }
    .markdown-body .preview-mermaid-copy-controls {
      position: absolute;
      top: 0.3rem;
      right: 0.5rem;
      z-index: 3;
      display: flex;
      align-items: stretch;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .markdown-body .preview-mermaid-copy-image-button,
    .markdown-body .preview-mermaid-copy-menu-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      height: 1.5rem;
      border: 1px solid var(--code-block-header-border);
      background: color-mix(in srgb, var(--code-block-header-background) 85%, var(--code-block-background));
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    }
    .markdown-body .preview-mermaid-copy-image-button {
      padding: 0 0.55rem;
      border-top-left-radius: 999px;
      border-bottom-left-radius: 999px;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .markdown-body .preview-mermaid-copy-menu-toggle {
      width: 1.8rem;
      border-left: 0;
      border-top-right-radius: 999px;
      border-bottom-right-radius: 999px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding: 0;
      line-height: 1;
    }
    .markdown-body .preview-mermaid-copy-menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      min-width: 8.25rem;
      padding: 0.25rem;
      border: 1px solid var(--code-block-header-border);
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--code-block-header-background) 92%, var(--code-block-background));
      box-shadow: 0 10px 30px color-mix(in srgb, var(--code-block-foreground) 18%, transparent);
      display: none;
    }
    .markdown-body .preview-mermaid-copy-controls.is-open .preview-mermaid-copy-menu {
      display: block;
    }
    .markdown-body .preview-mermaid-copy-code-button {
      display: inline-flex;
      width: 100%;
      align-items: center;
      gap: 0.35rem;
      height: 1.7rem;
      border: 0;
      border-radius: 0.35rem;
      background: transparent;
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.69rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0.45rem;
    }
    .markdown-body .preview-mermaid-copy-code-button:hover {
      color: var(--code-block-foreground);
      background: color-mix(in srgb, var(--code-block-background) 74%, transparent);
    }
    .markdown-body pre.preview-code-copy-host > .preview-code-copy-button {
      top: 0.55rem;
    }
    .markdown-body .preview-code-copy-host:hover > .preview-code-copy-button,
    .markdown-body .preview-code-copy-button:focus-visible,
    .markdown-body .preview-code-copy-button[data-copied='true'],
    .markdown-body .preview-code-copy-host:hover > .preview-mermaid-copy-controls,
    .markdown-body .preview-mermaid-copy-controls:focus-within,
    .markdown-body .preview-mermaid-copy-controls.is-open {
      opacity: 1;
    }
    .markdown-body .preview-code-copy-button:hover {
      color: var(--code-block-foreground);
      border-color: var(--code-block-border);
      background: color-mix(in srgb, var(--code-block-header-background) 95%, var(--code-block-background));
    }
    .markdown-body .preview-mermaid-copy-image-button:hover,
    .markdown-body .preview-mermaid-copy-menu-toggle:hover {
      color: var(--code-block-foreground);
      border-color: var(--code-block-border);
      background: color-mix(in srgb, var(--code-block-header-background) 95%, var(--code-block-background));
    }
    .markdown-body .preview-code-copy-button:focus-visible {
      outline: 2px solid #1f6feb;
      outline-offset: 1px;
    }
    .markdown-body .preview-mermaid-copy-image-button:focus-visible,
    .markdown-body .preview-mermaid-copy-menu-toggle:focus-visible,
    .markdown-body .preview-mermaid-copy-code-button:focus-visible {
      outline: 2px solid #1f6feb;
      outline-offset: 1px;
    }
    .markdown-body .preview-code-copy-button .preview-code-copy-icon {
      width: 0.9rem;
      height: 0.9rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
      display: block;
    }
    .markdown-body .preview-code-copy-button .preview-code-copy-icon rect {
      fill: none;
    }
    .markdown-body .preview-mermaid-copy-image-button .preview-code-copy-icon,
    .markdown-body .preview-mermaid-copy-code-button .preview-code-copy-icon {
      width: 0.9rem;
      height: 0.9rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
      display: block;
    }
    .markdown-body .code-block-with-language pre {
      margin: 0;
      border: 0;
      border-radius: 0;
      background: transparent !important;
    }
    .markdown-body .code-block-with-language[data-language="mermaid"] {
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    .markdown-body .code-block-with-language[data-language="mermaid"] .code-block-language-hint {
      display: none;
    }
    .markdown-body .code-block-with-language pre code.hljs {
      display: block;
      padding: 0;
      background: transparent;
    }
    .markdown-body .hljs {
      color: var(--code-block-foreground);
    }
    .markdown-body .hljs-keyword,
    .markdown-body .hljs-selector-tag,
    .markdown-body .hljs-literal,
    .markdown-body .hljs-doctag,
    .markdown-body .hljs-operator {
      color: var(--code-syntax-keyword);
    }
    .markdown-body .hljs-string,
    .markdown-body .hljs-meta .hljs-string,
    .markdown-body .hljs-attribute,
    .markdown-body .hljs-regexp {
      color: var(--code-syntax-string);
    }
    .markdown-body .hljs-number,
    .markdown-body .hljs-symbol,
    .markdown-body .hljs-variable,
    .markdown-body .hljs-template-variable {
      color: var(--code-syntax-number);
    }
    .markdown-body .hljs-title,
    .markdown-body .hljs-title.class_,
    .markdown-body .hljs-title.function_ {
      color: var(--code-syntax-entity);
    }
    .markdown-body .hljs-comment,
    .markdown-body .hljs-quote {
      color: var(--code-syntax-comment);
    }
  </style>
</head>
<body class="markdown-body">
${htmlContent}
</body>
</html>`
}
