const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message, err.stack));

  console.log('Navigating...');
  await page.goto('http://localhost:5001/iscritti_per_attivita', { waitUntil: 'networkidle' });
  
  await browser.close();
})();
