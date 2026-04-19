const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("http://localhost:5001/login");
  await page.type("input[name=username], input[type=text]", "admin");
  await page.type("input[name=password], input[type=password]", "admin");
  await page.click("button[type=submit]");
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  await page.goto("http://localhost:5001/gemteam");
  
  const res = await page.evaluate(async () => {
    let postazioniResult = null;
    let turniResult = null;

    try {
      const pRes = await fetch("/api/gemteam/postazioni", { credentials: "include" });
      postazioniResult = await pRes.json();
    } catch(e) {
      postazioniResult = e.toString();
    }

    try {
      const tRes = await fetch("/api/gemteam/turni/scheduled?data=2026-04-17", { credentials: "include" });
      turniResult = await tRes.json();
    } catch(e) {
      turniResult = e.toString();
    }

    return { POSTAZIONI: postazioniResult, TURNI: turniResult };
  });

  console.log(JSON.stringify(res, null, 2));
  await browser.close();
})();
