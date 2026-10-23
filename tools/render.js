// Sessiz video: node tools/render.js <sayfa.html> <çıktı.mp4> <süre_sn> [fps=30]
// Her kare canvas'tan PNG olarak alınıp ffmpeg'e borudan verilir. Sayfa, window.DURATION ile süreyi de bildirebilir.
const { spawn } = require('child_process'), { openPage } = require('./serve');
(async () => {
  const [pageFile, out, durArg, fpsArg = '30'] = process.argv.slice(2);
  const fps = +fpsArg, p = await openPage(pageFile);
  const dur = +durArg || await p.page.evaluate(() => window.DURATION);
  const n = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => ff.on('close', c => c ? fail(new Error('ffmpeg ' + c)) : ok()));
  try {
    for (let i = 0; i < n; i++) {
      const png = await p.frame(i / fps);
      if (!ff.stdin.write(png)) await new Promise(ok => ff.stdin.once('drain', ok));
      if (i % 60 === 0) console.log(`frame ${i}/${n}`);
    }
  } finally { ff.stdin.end(); await p.close(); }
  await done;
  console.log(`done ${out} (${n} frames)`);
})().catch(e => { console.error(e.message); process.exit(1); });
