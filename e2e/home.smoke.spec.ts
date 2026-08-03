import { test, expect } from '@playwright/test'

test('a Home carrega e tem um heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading').first()).toBeVisible()
})
