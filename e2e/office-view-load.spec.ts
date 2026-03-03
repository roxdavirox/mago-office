import { test, expect } from '@playwright/test'
import { setupMocks, MOCK_AGENTS } from './fixtures'

test.describe('office view load', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await page.goto('/')
  })

  test('canvas is rendered', async ({ page }) => {
    // The canvas is the root container — OfficeCanvas renders a div with the
    // office grid. At least one OfficeRoom should be visible.
    await expect(page.getByText('Dev Zone')).toBeVisible()
  })

  test('all office zones are visible', async ({ page }) => {
    const zoneLabels = [
      'Dev Zone',
      'Review Room',
      'Planning Board',
      'Analysis Area',
      'Coffee Corner',
      'Lobby',
    ]
    for (const label of zoneLabels) {
      await expect(page.getByText(label)).toBeVisible()
    }
  })

  test('all three agents are visible', async ({ page }) => {
    for (const agent of MOCK_AGENTS) {
      await expect(page.getByLabel(new RegExp(`agent ${agent.name}`, 'i'))).toBeVisible()
    }
  })

  test('HUD connection indicator is visible', async ({ page }) => {
    // The HUD always renders a status indicator — look for the role="status" element
    await expect(page.getByRole('status').first()).toBeVisible()
  })
})
