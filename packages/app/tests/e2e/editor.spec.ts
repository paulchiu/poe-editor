import { test, expect } from '@playwright/test'

interface MonacoEditor {
  getScrollHeight: () => number
  getLayoutInfo: () => { height: number }
  setScrollTop: (scrollTop: number) => void
  setValue: (value: string) => void
}

interface MonacoEditorGlobal {
  monaco?: {
    editor?: {
      getEditors?: () => MonacoEditor[]
    }
  }
}

test.describe('Editor Integration', () => {
  const isMac = process.platform === 'darwin'
  const modifier = isMac ? 'Meta' : 'Control'

  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the editor to be ready
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 })
  })

  test('should render editor and preview panes', async ({ page }) => {
    // Check for "Poe Markdown Editor" default text in preview (rendered from markdown)
    const preview = page.locator('.markdown-body')
    await expect(preview).toContainText('Poe Markdown Editor')
  })

  test('should apply bold formatting via toolbar', async ({ page }) => {
    // Clear editor content first (using robust keyboard strategy)
    // Click explicitly in the center area to ensure valid focus target (avoid gutter)
    await page
      .locator('.monaco-editor')
      .first()
      .click({ position: { x: 300, y: 100 } })
    await page.waitForTimeout(200)

    // Try both Meta+A and Control+A to catch all platforms/contexts
    await page.keyboard.press('Meta+A')
    await page.keyboard.press('Control+A')
    await page.waitForTimeout(200)
    await page.keyboard.press('Backspace')

    // Verify editor is cleared by checking preview (should be empty or minimal)
    const clearPreview = page.locator('.markdown-body')
    await expect(clearPreview).not.toContainText('Poe Markdown Editor')

    // Create new content
    // Editor should still be focused, but click again to be safe
    // Click explicitly in the center area to ensure valid focus target
    await page
      .locator('.monaco-editor')
      .first()
      .click({ position: { x: 300, y: 100 } })

    // Type "Hello formatting"
    await page.keyboard.type('Hello formatting')

    // Select "formatting" (select backwards manually to be robust against modifier key issues)
    // "Hello formatting" is 16 chars. Press Shift+Left 20 times to be safe.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }

    // Click Bold button
    await page.getByRole('button', { name: 'Bold' }).click()

    // Verifying text
    const boldPreview = page.locator('.markdown-body strong')
    await expect(boldPreview).toHaveText('Hello formatting')
  })

  test('should render front matter as preview properties', async ({ page }) => {
    const content = [
      '---',
      'title: Preview Fixture',
      'tags:',
      '  - markdown',
      '  - properties',
      'draft: false',
      '---',
      '# Body Title',
      '',
      'Body text',
    ].join('\n')

    await page.evaluate((text) => {
      const editorInstances = (
        window as unknown as MonacoEditorGlobal
      ).monaco?.editor?.getEditors?.()
      editorInstances?.[0]?.setValue(text)
    }, content)

    const preview = page.locator('.markdown-body')
    const properties = preview.locator('.front-matter-properties')
    await expect(properties).toContainText('Preview Fixture')
    await expect(properties).toContainText('markdown')
    await expect(properties).toContainText('false')
    await expect(preview.locator('h1')).toHaveText('Body Title')
    await expect(preview).not.toContainText('---')

    await expect(async () => {
      const isBeforeHeading = await preview.evaluate((root) => {
        const panel = root.querySelector('.front-matter-properties')
        const heading = root.querySelector('h1')
        if (!panel || !heading) return false
        return panel.getBoundingClientRect().bottom <= heading.getBoundingClientRect().top
      })
      expect(isBeforeHeading).toBe(true)
    }).toPass()
  })

  test('should sync scroll from editor to preview', async ({ page }) => {
    // 1. Create long content to force scroll
    const longContent = Array(100)
      .fill('Line')
      .map((_, i) => `Line ${i}`)
      .join('\n')

    // Clear editor using Select All + Backspace
    await page.locator('.monaco-editor').first().click()
    await page.keyboard.press(`${modifier}+A`)
    await page.keyboard.press('Backspace')

    // Paste long content via clipboard
    await page.locator('.monaco-editor').click()
    await page.evaluate((text) => navigator.clipboard.writeText(text), longContent)
    await page.keyboard.press(`${modifier}+V`)

    // Wait for preview to render all content
    await expect(page.locator('.markdown-body')).toContainText('Line 99')
    await page.waitForTimeout(500)

    // 2. Scroll the editor programmatically via Monaco's API.
    // Monaco uses virtual scrolling (DOM scrollTop stays at 0), so keyboard/mouse
    // scrolling may not trigger onDidScrollChange reliably in headless tests.
    await page.evaluate(() => {
      const editorInstances = (
        window as unknown as MonacoEditorGlobal
      ).monaco?.editor?.getEditors?.()
      if (editorInstances && editorInstances.length > 0) {
        const editor = editorInstances[0]
        const maxScroll = editor.getScrollHeight() - editor.getLayoutInfo().height
        editor.setScrollTop(maxScroll)
      }
    })

    // 3. Verify Preview Scrolled
    // Walk up from .markdown-body to find the nearest scrollable ancestor
    const previewLocator = page.locator('.markdown-body')

    // Use toPass to retry until the scroll sync happens (it's debounced)
    await expect(async () => {
      const previewScrollTop = await previewLocator.evaluate((el: Element) => {
        let node = el.parentElement
        while (node) {
          if (node.scrollTop > 0) return node.scrollTop
          node = node.parentElement
        }
        return 0
      })
      expect(previewScrollTop).toBeGreaterThan(0)
    }).toPass()
  })
})
