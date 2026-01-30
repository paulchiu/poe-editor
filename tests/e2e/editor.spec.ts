import { test, expect } from '@playwright/test';

test.describe('Editor Integration', () => {
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';


  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the editor to be ready
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should render editor and preview panes', async ({ page }) => {
    // Check for "Welcome to Poe" default text in preview (rendered from markdown)
    const preview = page.locator('.markdown-body');
    await expect(preview).toContainText('Welcome to Poe');
  });

  test('should apply bold formatting via toolbar', async ({ page }) => {
    // Clear editor content first (using robust keyboard strategy)
    // Click explicitly in the center area to ensure valid focus target (avoid gutter)
    await page.locator('.monaco-editor').first().click({ position: { x: 300, y: 100 } });
    await page.waitForTimeout(200);
    
    // Try both Meta+A and Control+A to catch all platforms/contexts
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(200);
    await page.keyboard.press('Backspace');
    
    // Verify editor is cleared by checking preview (should be empty or minimal)
    const clearPreview = page.locator('.markdown-body');
    await expect(clearPreview).not.toContainText('Welcome to Poe');
    
    // Create new content
    // Editor should still be focused, but click again to be safe
    // Click explicitly in the center area to ensure valid focus target
    await page.locator('.monaco-editor').first().click({ position: { x: 300, y: 100 } });
    
    // Type "Hello formatting"
    await page.keyboard.type('Hello formatting');
    
    // Select "formatting" (select backwards manually to be robust against modifier key issues)
    // "Hello formatting" is 16 chars. Press Shift+Left 20 times to be safe.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Shift+ArrowLeft');
    }

    // Click Bold button
    await page.getByRole('button', { name: 'Bold' }).click();
    
    // Verifying text
    const boldPreview = page.locator('.markdown-body strong');
    await expect(boldPreview).toHaveText('Hello formatting');
  });

  test('should sync scroll from editor to preview', async ({ page }) => {
     // 1. Create long content to force scroll
    const longContent = Array(100).fill('Line').map((_, i) => `Line ${i}`).join('\n');
    
    // Use clipboard to paste for speed (typing 100 lines is slow)
    // Actually, let's just use the clipboard API since we have the permission in some contexts, 
    // or just evaluating JS to set the model value if we exposed it, but typing is safer for blackbox.
    // Let's type a smaller amount that still overflows or just newline spam.
    
    // Clear editor using Select All + Backspace
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Backspace');

    // Faster way to set content: Focus editor and paste
    await page.locator('.monaco-editor').click();
    await page.evaluate((text) => navigator.clipboard.writeText(text), longContent);
    await page.keyboard.press(`${modifier}+V`);

    // Wait for preview to update and sync hook to attach (polling interval is 100ms)
    await expect(page.locator('.markdown-body')).toContainText('Line 99');
    await page.waitForTimeout(1000);

    // 2. Scroll Editor
    // Select the scrollable DOM node of Monaco. 
    // Usually .monaco-scrollable-element or .lines-content
    // We can just use mouse wheel on the editor
    await page.locator('.monaco-scrollable-element').first().hover();
    await page.mouse.wheel(0, 500);
    
    // 3. Verify Preview Scrolled
    // The markdown-body is usually inside the scrollable container.
    // We check if the preview container has scrolled.
    // Based on the layout, the parent of .markdown-body is the scrollable area.
    const previewLocator = page.locator('.markdown-body');
    
    // Use toPass to retry until the scroll sync happens (it's debounced)
    await expect(async () => {
      const previewScrollTop = await previewLocator.evaluate((el: Element) => {
        return el.parentElement?.scrollTop || 0;
      });
      expect(previewScrollTop).toBeGreaterThan(0);
    }).toPass();
  });
});
