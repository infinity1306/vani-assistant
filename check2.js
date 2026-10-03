const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR: ' + err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR: ' + msg.text());
  });
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(1000);
  try {
    await page.click('text=AWAKEN');
    await page.waitForTimeout(2000);
  } catch(e) {
    console.log('Click failed');
  }
  await browser.close();
})();
