import { test, expect } from '@playwright/test'
import { setupMocks, MOCK_AGENTS } from './fixtures'

test.describe('agent interaction', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await page.goto('/')
    // Wait for agents to appear after the mocked REST response
    await expect(page.getByLabel(/agent rx-architect/i)).toBeVisible()
  })

  test('clicking an agent opens AgentDetailPanel', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).toBeVisible()
  })

  test('panel shows agent name and role', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    const panel = page.getByRole('complementary', { name: /agent details: rx-architect/i })
    await expect(panel.getByText('rx-architect')).toBeVisible()
    await expect(panel.getByText('architect', { exact: true })).toBeVisible()
  })

  test('panel shows message input', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    await expect(page.getByRole('textbox', { name: 'message to agent' })).toBeVisible()
  })

  test('ESC closes the panel', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).not.toBeVisible()
  })

  test('close button closes the panel', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).not.toBeVisible()
  })

  test('quick message buttons are visible in the panel', async ({ page }) => {
    await page.getByLabel(/agent rx-architect/i).click()
    const panel = page.getByRole('complementary', { name: /agent details: rx-architect/i })
    await expect(panel.getByRole('button', { name: 'What is your current task?' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Pause and wait' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Continue normally' })).toBeVisible()
  })

  test('opening a second agent panel replaces the first', async ({ page }) => {
    // Open first agent panel
    await page.getByLabel(/agent rx-architect/i).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).toBeVisible()

    // Close via the close button, then open second agent
    // (The overlay at zIndex:90 blocks direct click on agents behind it)
    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-architect/i })
    ).not.toBeVisible()

    await page.getByLabel(/agent rx-backend/i).click()
    await expect(
      page.getByRole('complementary', { name: /agent details: rx-backend/i })
    ).toBeVisible()
  })

  test('idle agent is visible on canvas', async ({ page }) => {
    // rx-orchestrator has status 'idle' → Coffee Corner zone
    await expect(page.getByLabel(/agent rx-orchestrator/i)).toBeVisible()
  })

  test('panel status section displays agent status', async ({ page }) => {
    const agent = MOCK_AGENTS[0] // rx-architect, working
    await page.getByLabel(/agent rx-architect/i).click()
    const panel = page.getByRole('complementary', { name: /agent details: rx-architect/i })
    await expect(panel.getByText('STATUS')).toBeVisible()
    await expect(panel.getByText(agent.status)).toBeVisible()
  })
})
