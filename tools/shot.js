// Tek kare PNG: node tools/shot.js <sayfa.html> <çıktı.png> [t] [mod]
// Kareyi canvas.toDataURL ile alır (ekran görüntüsü değil, birebir piksel).
const path = require('path'), fs = require('fs');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');

(async () => {
  const [page_, out, t = '0', mode] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.resolve(page_));
  await page.evaluate(() => document.fonts.load('40px Bangers'));
  const url = await page.evaluate(([t, m]) => { window.renderAt(+t, m); return document.getElementById('c').toDataURL('image/png'); }, [t, mode]);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log('wrote', out);
})();
