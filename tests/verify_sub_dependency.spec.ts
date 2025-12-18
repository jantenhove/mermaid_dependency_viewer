import { test, expect } from '@playwright/test';

test('verify direct vs sub dependency and dependent highlighting', async ({ page }) => {
  await page.goto('/');

  // Wait for nodes
  const tmissionNode = page.locator('.node').filter({ has: page.locator('span', { hasText: 'tmissionmanagement-service' }) }).first();
  await tmissionNode.waitFor({ state: 'visible', timeout: 10000 });

  // Select tmissionmanagement-service
  await tmissionNode.click({ force: true });

  // --- Dependencies ---
  // Direct: Layout
  const layoutNode = page.locator('.node').filter({ has: page.locator('span', { hasText: /^Tmhls\.Layout$/ }) }).first();
  await expect(layoutNode).toHaveClass(/node-dependency/);
  await expect(layoutNode).not.toHaveClass(/node-dependency-sub/);

  // Sub: mongo (via Layout)
  const mongoNode = page.locator('.node').filter({ has: page.locator('span', { hasText: 'mongo' }) }).first();
  await expect(mongoNode).toHaveClass(/node-dependency-sub/);
  // Ensure it doesn't have direct class (exact match)
  const mongoClasses = await mongoNode.getAttribute('class');
  expect(mongoClasses?.split(' ')).not.toContain('node-dependency');

  // Check Edges
  // Edge: tmissionmanagement-service -> Layout (Direct)
  const directEdge = page.locator('.LS-tmissionmanagement-service.LE-Layout').first();
  await expect(directEdge).toHaveClass(/edge-dependency/);
  await expect(directEdge).not.toHaveClass(/edge-dependency-sub/);

  // Edge: Layout -> mongo (Sub)
  const subEdge = page.locator('.LS-Layout.LE-mongo').first();
  await expect(subEdge).toHaveClass(/edge-dependency-sub/);

  // --- Dependents ---
  // Reset and select mongo
  const bg = page.locator('svg[id^="mermaid-graph"]');
  await bg.click({ position: { x: 5, y: 5 }, force: true }); // Deselect

  // Select mongo
  // mongo is at bottom left.
  const mongoTarget = page.locator('.node').filter({ has: page.locator('span', { hasText: 'mongo' }) }).first();
  await mongoTarget.click({ force: true });

  // Direct Dependent: StorageReservation
  const storageResNode = page.locator('.node').filter({ has: page.locator('span', { hasText: 'StorageReservation' }) }).first();
  await expect(storageResNode).toHaveClass(/node-dependent/);
  const storageClasses = await storageResNode.getAttribute('class');
  expect(storageClasses?.split(' ')).not.toContain('node-dependent-sub');

  // Sub Dependent: reset-service (reset-service -> StorageReservation)
  const resetServiceNode = page.locator('.node').filter({ has: page.locator('span', { hasText: 'reset-service' }) }).first();
  await expect(resetServiceNode).toHaveClass(/node-dependent-sub/);
  const resetClasses = await resetServiceNode.getAttribute('class');
  expect(resetClasses?.split(' ')).not.toContain('node-dependent');
});
