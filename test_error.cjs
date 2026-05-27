const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const errorText = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT START');
  console.log(errorText.substring(0, 1000));
  console.log('BODY TEXT END');

  await browser.close();
})();
