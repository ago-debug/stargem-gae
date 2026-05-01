import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message, err.stack));

  console.log('Navigating...');
  await page.goto('http://localhost:5001/iscritti_per_attivita', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
