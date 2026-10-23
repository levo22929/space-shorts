// Çizgi film (el çizimi hissi) karakterler: düz renk + gölge/parlama hilali, kalınlığı değişen dış çizgi,
// dalgalı fırça bantları, ifadeyi kaş yerine göz kapağıyla veren yüzler. engine.js'ten sonra yüklenir.

// Kalınlığı değişen dış çizgi: koyu daire biraz sağ alta kaydırılıp büyütülür; üstüne gövde çizilir.
// Sonuç: sol üstte ince, sağ altta kalın kontur (fırça hissi).
function toonBody(ctx, x, y, r, base, shade, light, line, paint) {
  ctx.save();
  ctx.fillStyle = line;
  ctx.beginPath(); ctx.arc(x + r * 0.025, y + r * 0.03, r * 1.045, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.clip();
  ctx.fillStyle = base; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (paint) paint(ctx, x, y, r);
  // gölge hilali (sağ alt): büyük dairenin dışında kalan bölge koyulaşır
  ctx.save();
  ctx.beginPath(); ctx.rect(x - r, y - r, r * 2, r * 2);
  ctx.arc(x - r * 0.16, y - r * 0.2, r * 1.02, 0, 6.2832, true);
  ctx.fillStyle = shade; ctx.globalAlpha = 0.55; ctx.fill('evenodd'); ctx.restore();
  // yumuşak geçiş
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  // parlama hilali (sol üst)
  ctx.globalAlpha = 0.5; ctx.strokeStyle = light; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r * 0.86, Math.PI * 1.08, Math.PI * 1.38); ctx.stroke();
  ctx.globalAlpha = 0.7; ctx.fillStyle = light;
  ctx.beginPath(); ctx.ellipse(x - r * 0.5, y - r * 0.62, r * 0.07, r * 0.045, -0.6, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// Dalgalı bant (fırça): y0 merkez çizgisi, kalınlık h, dalga genliği a
function brushBand(ctx, x, y, r, y0, h, a, color, seed) {
  const R = rng(seed), ph = R() * 6.28, f = 2 + R() * 2, ph2 = R() * 6.28;
  ctx.fillStyle = color; ctx.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) { const px = x - r + 2 * r * i / n; ctx.lineTo(px, y + y0 * r - h * r / 2 + Math.sin(i / n * f * 6.28 + ph) * a * r); }
  for (let i = n; i >= 0; i--) { const px = x - r + 2 * r * i / n; ctx.lineTo(px, y + y0 * r + h * r / 2 + Math.sin(i / n * f * 6.28 + ph2) * a * r * 0.8); }
  ctx.closePath(); ctx.fill();
}

// ---------- yüz ----------
// Kaş yok; ifade göz kapaklarıyla. lid: üst kapağın kapattığı oran, tilt: + kızgın (iç uç aşağı), - üzgün.
// low: alt kapak (gülen/ukala kısık göz). mouth: 0 kapalı çizgi ... 1 kocaman açık.
const TEXPR = {
  happy:   { eye: 1.0, lid: 0.0, tilt: 0, low: 0.25, pupil: 1, px: 0, py: 0, smile: 0.8, open: 0.55, mw: 0.3, teeth: 0.5, tongue: 1, tears: 0, sweat: 0, round: 0 },
  smug:    { eye: 0.9, lid: 0.48, tilt: -0.1, low: 0.15, pupil: 1, px: 0.35, py: 0.1, smile: 0.6, open: 0, mw: 0.2, teeth: 0, tongue: 0, tears: 0, sweat: 0, round: 0 },
  laugh:   { eye: 0.9, lid: 0.35, tilt: -0.15, low: 0.4, pupil: 1, px: 0, py: 0, smile: 1.0, open: 1.0, mw: 0.36, teeth: 0.55, tongue: 1, tears: 0, sweat: 0, round: 0 },
  angry:   { eye: 1.0, lid: 0.42, tilt: 0.75, low: 0, pupil: 0.9, px: 0, py: 0.1, smile: -0.5, open: 0.7, mw: 0.3, teeth: 0.6, tongue: 0, tears: 0, sweat: 0, round: 0 },
  shocked: { eye: 1.25, lid: 0, tilt: 0, low: 0, pupil: 0.55, px: 0, py: 0, smile: 0, open: 0.9, mw: 0.16, teeth: 0.35, tongue: 1, tears: 0, sweat: 0, round: 1 },
  scared:  { eye: 1.2, lid: 0.12, tilt: -0.6, low: 0, pupil: 0.5, px: 0, py: 0.1, smile: -0.6, open: 0.55, mw: 0.28, teeth: 0.5, tongue: 0, tears: 0, sweat: 1, round: 0 },
  sad:     { eye: 1.0, lid: 0.35, tilt: -0.7, low: 0, pupil: 0.8, px: 0, py: 0.3, smile: -0.7, open: 0, mw: 0.22, teeth: 0, tongue: 0, tears: 0, sweat: 0, round: 0 },
  crying:  { eye: 0.7, lid: 0.3, tilt: -0.6, low: 0.35, pupil: 0, px: 0, py: 0, smile: -0.9, open: 0.85, mw: 0.32, teeth: 0.4, tongue: 1, tears: 1, sweat: 0, round: 0 },
  worried: { eye: 1.05, lid: 0.2, tilt: -0.55, low: 0, pupil: 0.7, px: -0.3, py: 0, smile: -0.4, open: 0, mw: 0.18, teeth: 0, tongue: 0, tears: 0, sweat: 0.6, round: 0 },
};
const lerpT = (a, b, k) => { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; };

function toonFace(ctx, x, y, r, e, t, skin, line = '#241018') {
  ctx.save(); ctx.translate(x + e.sweat * Math.sin(t * 50) * r * 0.01, y);
  const lw = r * 0.035;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = line;
  for (const s of [-1, 1]) {
    const ex = s * r * 0.31, ey = -r * 0.1, ew = r * 0.205, eh = r * 0.23 * e.eye;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, 6.2832); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.clip();
    if (e.pupil > 0.05) {
      const pr = r * 0.06 * e.pupil + r * 0.022, px = ex + e.px * ew * 0.5 * s * (e.px < 0 ? -1 : 1), py = ey + e.py * eh * 0.5;
      ctx.fillStyle = '#120a10'; ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.35, pr * 0.3, 0, 6.2832); ctx.fill();
    }
    // üst kapak: eğik çizginin üstü ten rengi
    const tilt = e.tilt * eh * 0.9 * -s; // iç uç (merkeze yakın) tilt>0 ise aşağı
    const ly = ey - eh + 2 * eh * e.lid;
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.moveTo(ex - ew - 2, ly - tilt); ctx.lineTo(ex + ew + 2, ly + tilt); ctx.lineTo(ex + ew + 2, ey - eh - 4); ctx.lineTo(ex - ew - 2, ey - eh - 4); ctx.fill();
    if (e.lid > 0.02 || Math.abs(e.tilt) > 0.05) { ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(ex - ew, ly - tilt); ctx.lineTo(ex + ew, ly + tilt); ctx.stroke(); }
    // alt kapak (gülümseyen kısık göz)
    if (e.low > 0.02) {
      const by = ey + eh - 2 * eh * e.low;
      ctx.beginPath(); ctx.moveTo(ex - ew - 2, ey + eh + 4); ctx.quadraticCurveTo(ex, by - eh * 0.25, ex + ew + 2, ey + eh + 4); ctx.fill();
      ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(ex - ew, ey + eh - eh * e.low * 0.6); ctx.quadraticCurveTo(ex, by - eh * 0.25, ex + ew, ey + eh - eh * e.low * 0.6); ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, 6.2832); ctx.stroke();
    // gözyaşı: gözden aşağı akan mavi şerit
    if (e.tears > 0.05) {
      ctx.save(); ctx.globalAlpha = e.tears; ctx.strokeStyle = '#4fc3ff'; ctx.lineWidth = r * 0.07;
      const k = (t * 1.5) % 1;
      ctx.beginPath(); ctx.moveTo(ex + s * ew * 0.4, ey + eh * 0.6);
      ctx.bezierCurveTo(ex + s * r * 0.35, ey + r * 0.2, ex + s * r * 0.55, ey + r * 0.1 + k * r * 0.1, ex + s * r * (0.7 + 0.1 * k), ey + r * 0.45);
      ctx.stroke(); ctx.restore();
    }
  }
  // ağız
  const my = r * 0.33, mw = r * e.mw * 1.35, sm = e.smile * r * 0.14, op = e.open * r * 0.32;
  ctx.lineWidth = lw;
  if (op < 0.01 * r) {
    ctx.beginPath(); ctx.moveTo(-mw, my - sm * 0.3); ctx.quadraticCurveTo(0, my + sm, mw, my - sm * 0.3); ctx.stroke();
  } else {
    ctx.save();
    ctx.beginPath();
    if (e.round > 0.5) ctx.ellipse(0, my + op * 0.2, mw, op * 0.8, 0, 0, 6.2832);
    else {
      // köşeler: gülerken yukarı, kızgın/üzgünken aşağı; üst kenar ortada yukarı kalkar
      const cy = my - sm * 0.5, top = my + sm * 0.5 - op * 0.5, bot = my + sm * 0.5 + op;
      ctx.moveTo(-mw, cy);
      ctx.bezierCurveTo(-mw * 0.55, top, mw * 0.55, top, mw, cy);
      ctx.bezierCurveTo(mw * 0.85, bot, -mw * 0.85, bot, -mw, cy);
    }
    ctx.closePath(); ctx.fillStyle = '#7a1424'; ctx.fill(); ctx.save(); ctx.clip();
    const mtop = my + sm * 0.5 - op * 0.5, mbot = my + sm * 0.5 + op;
    if (e.tongue > 0.05) { ctx.fillStyle = '#ff6f7d'; ctx.beginPath(); ctx.ellipse(0, mbot - op * 0.05, mw * 0.55, op * 0.4, 0, 0, 6.2832); ctx.fill(); }
    if (e.teeth > 0.05) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-mw * 1.1, Math.min(mtop, my - sm * 0.5) - op, mw * 2.2, op * (1 + 0.4 * e.teeth)); }
    ctx.restore();
    ctx.beginPath();
    if (e.round > 0.5) ctx.ellipse(0, my + op * 0.2, mw, op * 0.8, 0, 0, 6.2832);
    else { const cy = my - sm * 0.5, top = my + sm * 0.5 - op * 0.5, bot = my + sm * 0.5 + op;
      ctx.moveTo(-mw, cy); ctx.bezierCurveTo(-mw * 0.55, top, mw * 0.55, top, mw, cy); ctx.bezierCurveTo(mw * 0.85, bot, -mw * 0.85, bot, -mw, cy); ctx.closePath(); }
    ctx.stroke(); ctx.restore();
  }
  // ter
  if (e.sweat > 0.05) {
    ctx.save(); ctx.globalAlpha = e.sweat; const sx = r * 0.62, sy = -r * 0.32 + ((t * 0.7) % 1) * r * 0.2;
    ctx.fillStyle = '#9be3ff'; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.moveTo(sx, sy - r * 0.11); ctx.quadraticCurveTo(sx + r * 0.08, sy, sx, sy + r * 0.05); ctx.quadraticCurveTo(sx - r * 0.08, sy, sx, sy - r * 0.11);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

// ---------- karakterler ----------
const TOON = {
  saturn:  { base: '#e9c49a', shade: '#8a5a3a', light: '#fff1d8', line: '#3b2016', bands: [[-0.55, 0.18, '#c99467'], [-0.2, 0.14, '#b77b52'], [0.18, 0.2, '#d8a97c'], [0.55, 0.16, '#a96d48']], ring: '#e8cfa8' },
  jupiter: { base: '#f1d1c4', shade: '#9a6a5a', light: '#fff6f1', line: '#3e2220', bands: [[-0.62, 0.14, '#d3a08e'], [-0.3, 0.2, '#c78672'], [0.05, 0.12, '#e6b8a6'], [0.35, 0.22, '#c4806c'], [0.7, 0.12, '#d7a494']] },
  uranus:  { base: '#5cc8e0', shade: '#1f6f8a', light: '#d9f7ff', line: '#0f2d3a', bands: [[0.0, 0.5, '#4fb9d3']] },
  neptune: { base: '#3d7be0', shade: '#173b85', light: '#cfe0ff', line: '#0c1d45', bands: [[-0.3, 0.12, '#346cc9'], [0.3, 0.16, '#2f63bd']] },
  mars:    { base: '#e2603a', shade: '#7a2412', light: '#ffd0bd', line: '#3a120a', bands: [[0.2, 0.1, '#c94e2c']] },
  mercury: { base: '#a7a1a0', shade: '#4e4847', light: '#f0ecea', line: '#2a2524', craters: 1 },
  moon:    { base: '#e9eef2', shade: '#7c8a96', light: '#ffffff', line: '#2c3540', craters: 1 },
  venus:   { base: '#f0bc6a', shade: '#8f5f22', light: '#fff0cf', line: '#3d260c', bands: [[-0.3, 0.2, '#e3a957'], [0.3, 0.18, '#e6ad5c']] },
};

function toonPlanet(ctx, name, x, y, r, t, e) {
  const P = TOON[name];
  if (P.ring) toonRing(ctx, x, y, r, P, 'back');
  toonBody(ctx, x, y, r, P.base, P.shade, P.light, P.line, (c) => {
    (P.bands || []).forEach((b, i) => brushBand(c, x, y, r, b[0], b[1], 0.025, b[2], i * 7 + name.length));
    if (P.craters) {
      const R = rng(name.length * 13);
      for (let i = 0; i < 7; i++) {
        const cx = x + (R() - 0.5) * 1.5 * r, cy = y + (R() - 0.5) * 1.5 * r, cr = r * (0.07 + R() * 0.1);
        c.fillStyle = P.shade; c.globalAlpha = 0.25; c.beginPath(); c.arc(cx, cy, cr, 0, 6.2832); c.fill(); c.globalAlpha = 1;
      }
    }
  });
  if (P.ring) toonRing(ctx, x, y, r, P, 'front');
  toonFace(ctx, x, y + r * 0.06, r, e, t, P.base, P.line);
}

function toonRing(ctx, x, y, r, P, half) {
  ctx.save();
  ctx.beginPath();
  if (half === 'back') ctx.rect(x - r * 3, y - r * 3, r * 6, r * 3); else ctx.rect(x - r * 3, y, r * 6, r * 3);
  ctx.clip();
  ctx.translate(x, y); ctx.rotate(-0.18);
  for (const [w, c, a] of [[0.2, P.line, 1], [0.14, P.ring, 1], [0.04, '#c7a57e', 0.8]]) {
    ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = r * w;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.75, r * 0.42, 0, 0, 6.2832); ctx.stroke();
  }
  ctx.restore();
}

function toonEarth(ctx, x, y, r, t, e) {
  toonBody(ctx, x, y, r, '#3aa0e6', '#14508c', '#d6f0ff', '#0b2240', (c) => {
    const lon0 = t * 15 - 30, tilt = 0.3;
    const proj = (lo, la) => {
      const L = (lo - lon0) * Math.PI / 180, P = la * Math.PI / 180;
      let px = Math.cos(P) * Math.sin(L), py = Math.sin(P), pz = Math.cos(P) * Math.cos(L);
      const qy = py * Math.cos(tilt) - pz * Math.sin(tilt), qz = py * Math.sin(tilt) + pz * Math.cos(tilt);
      if (qz < 0) { const k = 1 / Math.hypot(px, qy); px *= k; py = qy * k; } else py = qy;
      return [x + px * r, y - py * r, qz];
    };
    for (const poly of LAND) {
      const pts = poly.map(p => proj(p[0], p[1])); if (pts.every(p => p[2] < 0)) continue;
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.fillStyle = '#5cc95a'; c.fill(); c.lineWidth = r * 0.03; c.strokeStyle = '#1f5e2a'; c.stroke();
    }
  });
  toonFace(ctx, x, y + r * 0.06, r, e, t, '#3aa0e6', '#0b2240');
}

function toonSun(ctx, x, y, r, t, e) {
  glow(ctx, x, y, r * 0.9, r * 2.0, 'rgba(255,160,40,1)', 0.5);
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3);
  const n = 22;
  for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
    const a = (i + k * 0.5) * 6.2832 / n, L = r * (k ? 1.24 : 1.38) * (1 + 0.04 * Math.sin(t * 4 + i * 1.7));
    ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.11) * r * 0.95, Math.sin(a - 0.11) * r * 0.95);
    ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.lineTo(Math.cos(a + 0.11) * r * 0.95, Math.sin(a + 0.11) * r * 0.95);
    ctx.fillStyle = k ? '#ffd23f' : '#ff9f1c'; ctx.fill();
  }
  ctx.restore();
  toonBody(ctx, x, y, r, '#ffb02e', '#e0570f', '#fff3b0', '#8a2e00', (c) => {
    const g = c.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffe36e'); g.addColorStop(1, 'rgba(255,140,20,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  toonFace(ctx, x, y + r * 0.06, r, e, t, '#ffb02e', '#6b2400');
}

// Konuşan karakterin adı (renkli, parlayan) + cümle (kalın eğik beyaz, vurgulu kelimeler renkli)
function speaker(ctx, name, color, parts, y = 150, emoji = '') {
  ctx.save();
  ctx.font = '104px Bangers'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 30; ctx.lineJoin = 'round';
  ctx.lineWidth = 16; ctx.strokeStyle = '#120a20'; ctx.strokeText(name, W / 2, y);
  const g = ctx.createLinearGradient(0, y - 50, 0, y + 50); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, color); g.addColorStop(1, color);
  ctx.fillStyle = g; ctx.fillText(name, W / 2, y);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 900 62px "DejaVu Sans", sans-serif';
  const lines = []; let cur = [];
  // parts: [[metin, renk|null], ...]; '\n' satır böler
  for (const [txt, c] of parts) { if (txt === '\n') { lines.push(cur); cur = []; } else cur.push([txt, c]); }
  lines.push(cur);
  lines.forEach((ln, li) => {
    const ws = ln.map(([s]) => ctx.measureText(s).width), tot = ws.reduce((a, b) => a + b, 0);
    let px = W / 2 - tot / 2, py = y + 105 + li * 74;
    ctx.textAlign = 'left';
    ln.forEach(([s, c], i) => { ctx.lineWidth = 12; ctx.strokeStyle = '#120a20'; ctx.strokeText(s, px, py); ctx.fillStyle = c || '#ffffff'; ctx.fillText(s, px, py); px += ws[i]; });
  });
  if (emoji) { ctx.textAlign = 'center'; ctx.font = '64px "Noto Color Emoji"'; ctx.fillText(emoji, W / 2, y + 105 + lines.length * 74 + 10); }
  ctx.restore();
}
