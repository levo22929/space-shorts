// Tek kare PNG: node tools/shot.js <sayfa.html> <çıktı.png> [t] [mod]
// Sayfa, depo kökünden sunulan yerel bir http sunucusundan açılır (file:// dokuların piksellerini okumayı engeller).
// Kare canvas.toDataURL ile alınır (ekran görüntüsü değil, birebir piksel).
const path = require('path'), fs = require('fs'), http = require('http');
const { chromium } = require(process.env.PW || '/opt/node-tools/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

function serve() {
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

(async () => {
  const [page_, out, t = '0', mode] = process.argv.slice(2);
  const srv = await serve();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
    await page.goto(`http://127.0.0.1:${srv.address().port}/${path.relative(ROOT, path.resolve(page_))}`);
    await page.evaluate(() => document.fonts.load('40px Bangers'));
    await page.evaluate(() => window.ready);
    const url = await page.evaluate(([t, m]) => { window.renderAt(+t, m); return document.getElementById('c').toDataURL('image/png'); }, [t, mode]);
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', out);
  } finally { await browser.close(); srv.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
