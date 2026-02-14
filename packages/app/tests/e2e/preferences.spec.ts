import { test, expect } from '@playwright/test'

test.describe('Editor Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for editor to be ready
    await expect(page.locator('.monaco-editor')).toBeVisible()
  })

  test('should persist "Start with Empty Editor" preference', async ({ page }) => {
    // 1. Verify default state (Welcome text present)
    await expect(page.locator('.markdown-body')).toContainText('Poe Markdown Editor')

    // 2. Enable "Start with Empty Editor"
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('menuitem', { name: 'Start with Empty Editor' }).click()

    // 3. Reload page with empty hash to simulate new session/document
    await page.goto('/#')
    await page.reload()
    await expect(page.locator('.monaco-editor')).toBeVisible()

    // 4. Verify editor is empty (no Welcome text)
    await expect(page.locator('.markdown-body')).not.toContainText('Poe Markdown Editor')

    // 5. Disable "Start with Empty Editor" (Toggle back)
    await page.getByRole('button', { name: 'Menu' }).click()
    // Text should have changed to indicate current state or action
    await page.getByRole('menuitem', { name: 'Start with Default Content' }).click()

    // 6. Reload page with empty hash
    await page.goto('/#')
    await page.reload()
    await expect(page.locator('.monaco-editor')).toBeVisible()

    // 7. Verify Welcome text returns
    await expect(page.locator('.markdown-body')).toContainText('Poe Markdown Editor')
  })
})
