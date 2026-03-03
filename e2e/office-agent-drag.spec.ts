import { test, expect } from '@playwright/test'
import { setupMocks } from './fixtures'

/**
 * Performs a Framer Motion-compatible drag gesture.
 * Moves the pointer from `from` to `to` in small steps so Framer Motion's
 * pan detection triggers.
 */
async function drag(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 20
) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps
    const y = from.y + ((to.y - from.y) * i) / steps
    await page.mouse.move(x, y, { steps: 1 })
  }
  await page.mouse.up()
}

test.describe('agent drag to zone', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await page.goto('/')
    await expect(page.getByLabel(/agent rx-architect/i)).toBeVisible()
  })

  test('drag agent to another zone shows anchor badge', async ({ page }) => {
    const agent = page.getByLabel(/agent rx-architect/i)
    const canvas = page.locator('[style*="height: 100vh"]').first()

    const agentBox = await agent.boundingBox()
    const canvasBox = await canvas.boundingBox()

    if (!agentBox || !canvasBox) throw new Error('Could not get bounding boxes')

    const fromX = agentBox.x + agentBox.width / 2
    const fromY = agentBox.y + agentBox.height / 2

    // Target: Coffee Corner zone — x:50-96%, y:42-72% of canvas
    const toX = canvasBox.x + canvasBox.width * 0.73
    const toY = canvasBox.y + canvasBox.height * 0.57

    await drag(page, { x: fromX, y: fromY }, { x: toX, y: toY })

    // Anchor badge should be visible after successful zone drop
    await expect(page.getByLabel('manual override')).toBeVisible()
  })

  test('reset button appears after drag and clears override on click', async ({ page }) => {
    const agent = page.getByLabel(/agent rx-architect/i)
    const canvas = page.locator('[style*="height: 100vh"]').first()

    const agentBox = await agent.boundingBox()
    const canvasBox = await canvas.boundingBox()

    if (!agentBox || !canvasBox) throw new Error('Could not get bounding boxes')

    const fromX = agentBox.x + agentBox.width / 2
    const fromY = agentBox.y + agentBox.height / 2

    // Target: Coffee Corner zone — x:50-96%, y:42-72%
    const toX = canvasBox.x + canvasBox.width * 0.73
    const toY = canvasBox.y + canvasBox.height * 0.57

    await drag(page, { x: fromX, y: fromY }, { x: toX, y: toY })

    // If the drag triggered a click on mouse-up → AgentDetailPanel opened.
    // Close it so the overlay (aria-hidden div, zIndex:90) doesn't block the reset button.
    const closeBtn = page.getByRole('button', { name: 'Close panel' })
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
    }

    // Reset button should appear
    const resetBtn = page.getByRole('button', { name: /reset position for rx-architect/i })
    await expect(resetBtn).toBeVisible()

    // Clicking reset removes the anchor badge
    await resetBtn.click()
    await expect(page.getByLabel('manual override')).not.toBeVisible()
  })
})
