const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
  // Create an admin user or use the API to bypass auth for test
  await page.goto('http://localhost:5001/maschera-input?memberId=16645&action=rinnova-tessera', { waitUntil: 'networkidle' });
  await browser.close();
})();
