import { test, expect } from '@playwright/test'

test.describe('New Document Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.monaco-editor')).toBeVisible()
  })

  test('should show confirmation dialog when creating new document', async ({ page }) => {
    // Open the file menu (the button with filename)
    await page.getByRole('button', { name: /untitled.md/i }).click()

    // Click "New" option
    await page.getByRole('menuitem', { name: 'New' }).click()

    // Verify dialog appears
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create new document?' })).toBeVisible()

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify dialog disappears
    await expect(page.getByRole('alertdialog')).not.toBeVisible()

    // Verify content is preserved (default content starts with "# Welcome to Poe")
    const preview = page.locator('.markdown-body')
    await expect(preview).toContainText('Welcome to Poe')

    // Try again and confirm
    await page.getByRole('button', { name: /untitled.md/i }).click()
    await page.getByRole('menuitem', { name: 'New' }).click()

    // Click Continue
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify dialog disappears
    await expect(page.getByRole('alertdialog')).not.toBeVisible()

    // Verify content is cleared
    // We check that the preview does NOT contain the welcome text anymore
    await expect(preview).not.toContainText('Welcome to Poe')

    // Check if editor is empty or cleared.
    // Since we can't easily read monaco value, we rely on preview or URL state if we tracked it,
    // but the preview check is robust enough for "cleared".
  })
})
