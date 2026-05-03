import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5001/gempass', { waitUntil: 'networkidle' });
  
  const rinnovaBtn = await page.locator('button:has-text("Rinnova")').first();
  if (await rinnovaBtn.isVisible()) {
    console.log("Clicking Rinnova button...");
    await rinnovaBtn.click();
    await page.waitForTimeout(2000);
    const modal = page.locator('[role="dialog"]').first();
    console.log("Modal visible after 2s:", await modal.isVisible());
    
    await page.waitForTimeout(4000); // Wait another 4s to simulate "qualche secondo"
    console.log("Modal visible after 6s:", await modal.isVisible());
  } else {
    console.log("Rinnova button not found.");
  }
  
  await browser.close();
})();
