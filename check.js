const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('Page error: ', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error: ', msg.text());
  });
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(2000);
  try {
    await page.click('text=AWAKEN');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Failed to click AWAKEN');
  }
  await browser.close();
})();
