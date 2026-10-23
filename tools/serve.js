// Depo kökünü yerel http'den sunar ve sayfayı Playwright ile açar (file:// doku piksellerini okumayı engeller).
const path = require('path'), fs = require('fs'), http = require('http');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

async function openPage(pageFile) {
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${srv.address().port}/${path.relative(ROOT, path.resolve(pageFile))}`);
  await page.evaluate(() => document.fonts.load('40px Bangers'));
  await page.evaluate(() => window.ready);
  const frame = async (t, mode) => {
    const url = await page.evaluate(([t, m]) => { window.renderAt(+t, m); return document.getElementById('c').toDataURL('image/png'); }, [t, mode]);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  const close = async () => { await browser.close(); srv.close(); };
  return { page, frame, close };
}
module.exports = { openPage };
