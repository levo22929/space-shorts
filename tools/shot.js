// Tek kare PNG: node tools/shot.js <sayfa.html> <çıktı.png> [t] [mod]
// Kare canvas.toDataURL ile alınır (ekran görüntüsü değil, birebir piksel).
const fs = require('fs'), { openPage } = require('./serve');
(async () => {
  const [pageFile, out, t = '0', mode] = process.argv.slice(2);
  const p = await openPage(pageFile);
  try { fs.writeFileSync(out, await p.frame(t, mode)); console.log('wrote', out); } finally { await p.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
