const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.message);
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
        }
    });

    await page.goto('http://localhost:5001/calendario-attivita', { waitUntil: 'networkidle2' });
    
    console.log("Page loaded. Looking for the first Copy button.");
    const btn = await page.$('button[title="Duplica Corso"]');
    if (btn) {
        console.log("Found button. Clicking...");
        await btn.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log("Done waiting.");
    } else {
        console.log("Button not found.");
    }
    
    await browser.close();
})();
