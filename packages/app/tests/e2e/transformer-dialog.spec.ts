import { test, expect } from '@playwright/test'

test.describe('Transformer Dialog', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the editor to be ready
    await expect(page.locator('.monaco-editor')).toBeVisible()
  })

  test.describe('Dialog Opening and Basic Interactions', () => {
    test('should open transformer dialog via toolbar button', async ({ page }) => {
      // Click the Transform Selection button
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Verify dialog is visible with correct title
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Transform Selection' })).toBeVisible()
    })

    test('should close dialog with Escape key', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Pipeline Creation Workflow', () => {
    test('should create a simple pipeline with one operation', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Enter pipeline name
      const nameInput = page.getByPlaceholder('Pipeline Name (e.g. Clean & Sort)')
      await nameInput.fill('Test Pipeline')

      // Add an operation from toolbox - use the first Change Case button we find
      await page.getByRole('button', { name: 'Change Case Convert text' }).click()

      // Verify "Build your pipeline" message disappears (matches functionality)
      // Note: Assuming "Build your pipeline" is a placeholder text when empty.
      // If the text changed in the new component implementation, this might fail,
      // but sticking to previous logic for now unless known otherwise.
      // Checking TransformerWorkbench.tsx might be useful if this fails.
      await expect(page.getByText('Build your pipeline')).not.toBeVisible()

      // Save pipeline
      await page.getByRole('button', { name: 'Save' }).click()

      // Verify toast notification (use first() to avoid strict mode violation)
      await expect(
        page.locator('ol > li').filter({ hasText: 'Pipeline saved!' }).first()
      ).toBeVisible()

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should show error when saving without name', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Add an operation without entering name
      await page.getByRole('button', { name: 'Change Case Convert text' }).click()

      // Try to save
      await page.getByRole('button', { name: 'Save' }).click()

      // Should show error toast
      await expect(
        page
          .locator('ol > li')
          .filter({ hasText: 'Please enter a name for your pipeline.' })
          .first()
      ).toBeVisible()

      // Dialog should remain open
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should show error when saving without steps', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Enter name but don't add steps
      await page.getByPlaceholder('Pipeline Name (e.g. Clean & Sort)').fill('Empty Pipeline')

      // Try to save
      await page.getByRole('button', { name: 'Save' }).click()

      // Should show error toast
      await expect(
        page
          .locator('ol > li')
          .filter({ hasText: 'Add at least one step to the pipeline before saving.' })
          .first()
      ).toBeVisible()

      // Dialog should remain open
      await expect(page.getByRole('dialog')).toBeVisible()
    })
  })

  test.describe('Search Functionality in Toolbox', () => {
    test('should filter operations by search term', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Find search input
      const searchInput = page.getByPlaceholder('Search operations...')
      await searchInput.fill('case')

      // Should show Change Case operation
      await expect(page.getByRole('button', { name: 'Change Case Convert text' })).toBeVisible()

      // Should not show unrelated operations
      await expect(page.getByRole('button', { name: 'Trim Whitespace Remove' })).not.toBeVisible()
    })
  })

  test.describe('Icon Picker Interactions', () => {
    test('should allow typing custom text/emoji in icon picker', async ({ page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Transform Selection' }).click()

      // Open Icon Picker
      // The button text defaults to '🪄' if no icon is selected
      await page.getByRole('button', { name: '🪄' }).click()

      // Expect popover to be visible
      await expect(page.getByRole('dialog', { name: '' }).last()).toBeVisible()

      // Type into the input
      const input = page.getByPlaceholder('Type emoji or text...')
      await input.click()
      await input.fill('🚀')

      // Verify input value
      await expect(input).toHaveValue('🚀')

      // Clicking outside to close
      await page.keyboard.press('Escape')

      // Verify trigger now shows the rocket
      await expect(page.getByRole('button', { name: '🚀' })).toBeVisible()
    })
  })
})
