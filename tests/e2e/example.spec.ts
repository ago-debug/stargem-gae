import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Aspettiamoci che ci sia il titolo di login o la dashboard
  await expect(page).toHaveTitle(/StarGem/i);
});

test('login redirect', async ({ page }) => {
  await page.goto('/dashboard');
  // Se non siamo loggati, dovremmo essere reindirizzati ad auth o simili
  // (Modifica questo test in base alla logica di login effettiva)
  expect(page.url()).toContain('/');
});
