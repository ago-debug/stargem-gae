import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('REACT CRASH:', error.message);
  });

  try {
    await page.goto('http://localhost:5001', { waitUntil: 'networkidle2' });

    // Login
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin');
    await page.click('button');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Go to Maschera Input
    await page.goto('http://localhost:5001/maschera-input', { waitUntil: 'networkidle2' });

    console.log('Typing search...');
    await page.type('input[placeholder="Cerca partecipante..."]', 'admin');

    // Wait for dropdown
    console.log('Waiting for dropdown...');
    await page.waitForSelector('.absolute.top-full .p-2.hover\\:bg-gray-100');

    // Click first result
    console.log('Clicking result...');
    await page.click('.absolute.top-full .p-2.hover\\:bg-gray-100');

    console.log('Waiting to see if it crashes...');
    await new Promise(r => setTimeout(r, 3000));
    console.log('No crash observed in 3 seconds.');
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
