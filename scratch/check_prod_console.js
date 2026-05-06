import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navigating to https://stargem.studio-gem.it/ ...");
  await page.goto('https://stargem.studio-gem.it/', { waitUntil: 'networkidle' });
  
  console.log("Done.");
  await browser.close();
})();
