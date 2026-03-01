const EXPORT_COPY_SCRIPT = `(() => {
  const COPY_HOST_CLASS = 'preview-code-copy-host'
  const COPY_BUTTON_CLASS = 'preview-code-copy-button'
  const COPY_LABEL_CLASS = 'preview-code-copy-label'
  const MERMAID_CONTROLS_CLASS = 'preview-mermaid-copy-controls'
  const MERMAID_DOWNLOAD_SVG_BUTTON_CLASS = 'preview-mermaid-download-svg-button'
  const MERMAID_MENU_TOGGLE_CLASS = 'preview-mermaid-copy-menu-toggle'
  const MERMAID_MENU_CLASS = 'preview-mermaid-copy-menu'
  const MERMAID_COPY_CODE_BUTTON_CLASS = 'preview-mermaid-copy-code-button'
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

    const downloadSvgButton = document.createElement('button')
    downloadSvgButton.type = 'button'
    downloadSvgButton.className = MERMAID_DOWNLOAD_SVG_BUTTON_CLASS
    downloadSvgButton.setAttribute('aria-label', 'Download Mermaid diagram as SVG')
    downloadSvgButton.setAttribute('data-default-label', 'Download SVG')

    const downloadSvgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    downloadSvgIcon.setAttribute('viewBox', '0 0 24 24')
    downloadSvgIcon.setAttribute('aria-hidden', 'true')
    downloadSvgIcon.classList.add('preview-code-copy-icon')

    const svgArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svgArrow.setAttribute('d', 'M12 3v11m0 0l4-4m-4 4l-4-4')
    const svgBase = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svgBase.setAttribute('d', 'M5 21h14')
    downloadSvgIcon.append(svgArrow, svgBase)

    const downloadSvgLabel = document.createElement('span')
    downloadSvgLabel.className = COPY_LABEL_CLASS
    downloadSvgLabel.textContent = 'Download SVG'

    downloadSvgButton.append(downloadSvgIcon, downloadSvgLabel)

    const menuToggle = document.createElement('button')
    menuToggle.type = 'button'
    menuToggle.className = MERMAID_MENU_TOGGLE_CLASS
    menuToggle.setAttribute('aria-label', 'Mermaid actions')
    menuToggle.setAttribute('aria-haspopup', 'menu')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.textContent = '▾'

    const menu = document.createElement('div')
    menu.className = MERMAID_MENU_CLASS
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', 'Mermaid actions')

    const copyCodeButton = document.createElement('button')
    copyCodeButton.type = 'button'
    copyCodeButton.className = MERMAID_COPY_CODE_BUTTON_CLASS
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
    controls.append(downloadSvgButton, menuToggle, menu)

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

  let mermaidExportCounter = 0

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
        if (codeText && !host.getAttribute('data-raw-code')) {
          host.setAttribute('data-raw-code', codeText)
        }
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

      if (!host.getAttribute('data-mermaid-export-index')) {
        mermaidExportCounter += 1
        host.setAttribute('data-mermaid-export-index', String(mermaidExportCounter))
      }

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
      if (typeof document.execCommand !== 'function') return false
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      textarea.style.left = '-9999px'
      textarea.style.opacity = '0'
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

  const withSvgNamespace = (svgMarkup) => {
    if (svgMarkup.includes('xmlns=')) return svgMarkup
    return svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  const getRenderedMermaidSvg = (host) => {
    const svgElements = Array.from(host.querySelectorAll('svg'))
    for (const svgElement of svgElements) {
      if (svgElement.closest('.' + MERMAID_CONTROLS_CLASS)) continue
      return svgElement
    }
    return null
  }

  const toFileSafePart = (value) =>
    value
      .toLowerCase()
      .replace(/\\.html?$/i, '')
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'document'

  const getMermaidDownloadName = (host, extension) => {
    const documentBase = toFileSafePart(document.title || 'document')
    const mermaidIndex = host.getAttribute('data-mermaid-export-index') || '1'
    return documentBase + '-mermaid-' + mermaidIndex + '.' + extension
  }

  const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  const serializeRenderedMermaidSvg = (svgElement) =>
    withSvgNamespace(new XMLSerializer().serializeToString(svgElement))

  const downloadMermaidSvg = (host, svgMarkup) => {
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    triggerBlobDownload(svgBlob, getMermaidDownloadName(host, 'svg'))
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

    const downloadSvgButton = target.closest('.' + MERMAID_DOWNLOAD_SVG_BUTTON_CLASS)
    if (downloadSvgButton) {
      event.preventDefault()
      event.stopPropagation()

      const host = downloadSvgButton.closest('.' + COPY_HOST_CLASS)
      if (!(host instanceof HTMLElement)) return

      const svgElement = getRenderedMermaidSvg(host)
      if (!svgElement) return
      const svgMarkup = serializeRenderedMermaidSvg(svgElement)

      try {
        downloadMermaidSvg(host, svgMarkup)
      } catch {
        return
      }

      setCopiedState(downloadSvgButton, 'SVG downloaded')
      closeMermaidMenus()
      return
    }

    const mermaidCopyCodeButton = target.closest('.' + MERMAID_COPY_CODE_BUTTON_CLASS)
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

/**
 * Returns the client-side script used by exported HTML documents for copy/download controls.
 * @returns Inline JavaScript for export interactions.
 */
export function getExportCopyScript(): string {
  return EXPORT_COPY_SCRIPT
}
