// Space Shorts çizim çekirdeği. Her şey deterministik: aynı t ve aynı parametre her zaman aynı kareyi verir.
// Tuval 1080×1920 (Shorts). Ölçüler piksel; karakter ölçüleri yarıçapa (r) göre.

const W = 1080, H = 1920;

// ---------- yardımcılar ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = {
  linear: k => k,
  inOut: k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  back: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
// t, [a,b] aralığında 0→1 ilerleme (aralık dışında 0 ya da 1)
const prog = (t, a, b, e = ease.inOut) => e(clamp((t - a) / (b - a)));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function mixColor(c1, c2, k) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], k)).toString(16).padStart(2, '0')).join('');
}

// ---------- arka plan ----------
const STARS = (() => { const r = rng(7); return Array.from({ length: 260 }, () => ({ x: r() * W, y: r() * H, s: 0.6 + r() * 2.2, p: r() * 6.28, f: 0.5 + r() * 2 })); })();
function drawSpace(ctx, t) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04021a'); g.addColorStop(0.55, '#0a0f35'); g.addColorStop(1, '#050318');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of STARS) {
    ctx.globalAlpha = 0.45 + 0.4 * Math.sin(s.p + t * s.f);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

// Yumuşak ışıma (radyal gradyan)
function glow(ctx, x, y, r0, r1, color, alpha) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha; ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r1, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// ---------- yazı ----------
// parts: [{text, color}], aynı satırda yan yana; ortalanır.
function title(ctx, parts, y, size = 92) {
  ctx.save();
  ctx.font = `${size}px Bangers`;
  ctx.textBaseline = 'middle';
  const widths = parts.map(p => ctx.measureText(p.text).width);
  const gap = size * 0.25;
  let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1)) / 2;
  parts.forEach((p, i) => {
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#0b0620';
    ctx.strokeText(p.text, x, y);
    ctx.fillStyle = p.color; ctx.fillText(p.text, x, y);
    x += widths[i] + gap;
  });
  ctx.restore();
}
function label(ctx, text, x, y, size = 56, color = '#ffffff') {
  ctx.save();
  ctx.font = `${size}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.18; ctx.strokeStyle = '#0b0620';
  ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
  ctx.restore();
}

// ---------- yüz ----------
// Her ifade sayılardan oluşur; iki ifade arasında lerpExpr ile yumuşak geçiş yapılır.
const EXPR = {
  neutral:   { eye: 1.0, lid: 0.15, pupil: 1.0, px: 0, py: 0, brow: 0.0, browY: 0, curve: 0.25, open: 0, mw: 0.22, round: 0, teeth: 0, cheek: 0.25, sweat: 0, shades: 0, smirk: 0 },
  happy:     { eye: 1.0, lid: 0.0, pupil: 1.0, px: 0, py: 0, brow: -0.1, browY: -0.04, curve: 0.9, open: 0.45, mw: 0.30, round: 0, teeth: 0, cheek: 0.6, sweat: 0, shades: 0, smirk: 0 },
  surprised: { eye: 1.3, lid: 0.0, pupil: 0.7, px: 0, py: 0, brow: -0.15, browY: -0.1, curve: 0.0, open: 1.0, mw: 0.12, round: 1, teeth: 0, cheek: 0.1, sweat: 0, shades: 0, smirk: 0 },
  scared:    { eye: 1.25, lid: 0.0, pupil: 0.55, px: 0, py: 0, brow: -0.55, browY: -0.06, curve: -0.6, open: 0.5, mw: 0.26, round: 0, teeth: 0.6, cheek: 0, sweat: 1, shades: 0, smirk: 0 },
  frozen:    { eye: 0.85, lid: 0.25, pupil: 0.6, px: 0, py: 0.2, brow: -0.45, browY: 0, curve: -0.35, open: 0.32, mw: 0.28, round: 0, teeth: 1, cheek: 0, sweat: 0, shades: 0, smirk: 0 },
  angry:     { eye: 0.9, lid: 0.35, pupil: 0.9, px: 0, py: 0, brow: 0.6, browY: 0.04, curve: -0.7, open: 0.35, mw: 0.27, round: 0, teeth: 1, cheek: 0, sweat: 0, shades: 0, smirk: 0 },
  cool:      { eye: 1.0, lid: 0.3, pupil: 1.0, px: 0, py: 0, brow: 0.1, browY: 0, curve: 0.6, open: 0, mw: 0.22, round: 0, teeth: 0, cheek: 0, sweat: 0, shades: 1, smirk: 0.6 },
};
function lerpExpr(a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; }

// skin: göz kapağının rengi (gövdenin rengi), line: çizgi rengi
function drawFace(ctx, x, y, r, e, t, skin, line = '#2b1406') {
  ctx.save();
  ctx.translate(x, y);
  const lw = r * 0.045;
  ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const shake = e.sweat * Math.sin(t * 55) * r * 0.012;
  ctx.translate(shake, 0);

  // gözler (gözlük takılıysa gözler çizilmez, kaşlar kalır)
  for (const s of [-1, 1]) {
    const ex = s * r * 0.33, ey = -r * 0.1, ew = r * 0.2, eh = r * 0.25 * e.eye;
    if (e.shades < 0.5) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, 6.2832);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.clip();
    // göz bebeği
    const pr = r * 0.1 * e.pupil;
    const ppx = ex + e.px * ew * 0.45 + Math.sin(t * 40) * e.sweat * r * 0.008;
    const ppy = ey + e.py * eh * 0.45 + eh * 0.12;
    ctx.fillStyle = '#16102b';
    ctx.beginPath(); ctx.arc(ppx, ppy, pr, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ppx - pr * 0.35, ppy - pr * 0.4, pr * 0.32, 0, 6.2832); ctx.fill();
    // göz kapağı (üstten)
    if (e.lid > 0.01) { ctx.fillStyle = skin; ctx.fillRect(ex - ew - 2, ey - eh - 2, ew * 2 + 4, eh * 2 * e.lid + 2); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, 6.2832); ctx.stroke();
    if (e.lid > 0.01) { // kapak çizgisi
      const ly = ey - eh + eh * 2 * e.lid;
      const half = ew * Math.sqrt(Math.max(0, 1 - Math.pow((ly - ey) / eh, 2)));
      ctx.beginPath(); ctx.moveTo(ex - half, ly); ctx.lineTo(ex + half, ly); ctx.stroke();
    }
    }
    // kaş: brow > 0 kızgın (iç uç aşağı), < 0 endişeli (iç uç yukarı)
    const by = ey - eh - r * 0.08 + e.browY * r;
    const inner = -s, tilt = e.brow * r * 0.12;
    ctx.save(); ctx.lineWidth = lw * 1.5;
    ctx.beginPath();
    ctx.moveTo(ex + inner * ew * 0.9, by + tilt);
    ctx.lineTo(ex - inner * ew * 0.9, by - tilt);
    ctx.stroke(); ctx.restore();
  }

  // yanak
  if (e.cheek > 0.01) {
    ctx.save(); ctx.globalAlpha = 0.45 * e.cheek; ctx.fillStyle = '#ff5d8f';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.55, r * 0.17, r * 0.11, r * 0.065, 0, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }

  // ağız
  const my = r * 0.33, mw = r * e.mw, h = r * (e.open > 0.05 && e.round < 0.5 ? 0.34 : 0.22);
  const sk = e.smirk * r * 0.06;
  if (e.round > 0.5) {
    ctx.beginPath(); ctx.ellipse(0, my, mw, h * 0.75 * e.open, 0, 0, 6.2832);
    ctx.fillStyle = '#5a0f1e'; ctx.fill(); ctx.stroke();
  } else if (e.open > 0.05) {
    const top = e.curve * h - e.open * h, bot = e.curve * h + e.open * h * 1.1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-mw, my - sk); ctx.quadraticCurveTo(0, my + top, mw, my + sk);
    ctx.quadraticCurveTo(0, my + bot, -mw, my - sk);
    ctx.closePath(); ctx.fillStyle = '#5a0f1e'; ctx.fill();
    ctx.clip();
    if (e.teeth > 0.05) { // diş sırası
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-mw, my + Math.min(top, bot) - 2, mw * 2, (Math.abs(bot - top) * 0.45) * e.teeth + 2);
    } else { // dil
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath(); ctx.ellipse(0, my + bot * 0.75, mw * 0.5, Math.abs(bot - top) * 0.3, 0, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-mw, my - sk); ctx.quadraticCurveTo(0, my + top, mw, my + sk);
    ctx.quadraticCurveTo(0, my + bot, -mw, my - sk);
    ctx.closePath(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-mw, my - sk); ctx.quadraticCurveTo(0, my + e.curve * h, mw, my + sk); ctx.stroke();
  }

  // ter damlası
  if (e.sweat > 0.05) {
    ctx.save(); ctx.globalAlpha = e.sweat;
    const sx = r * 0.66, sy = -r * 0.3 + ((t * 0.6) % 1) * r * 0.25;
    ctx.fillStyle = '#7fdbff'; ctx.strokeStyle = '#1b4b72'; ctx.lineWidth = lw * 0.7;
    ctx.beginPath(); ctx.moveTo(sx, sy - r * 0.12);
    ctx.quadraticCurveTo(sx + r * 0.08, sy, sx, sy + r * 0.05);
    ctx.quadraticCurveTo(sx - r * 0.08, sy, sx, sy - r * 0.12);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // güneş gözlüğü
  if (e.shades > 0.05) {
    ctx.save(); ctx.globalAlpha = e.shades;
    ctx.fillStyle = '#0d0d12'; ctx.strokeStyle = '#0d0d12'; ctx.lineWidth = lw * 1.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.08, -r * 0.2);
      ctx.lineTo(s * r * 0.58, -r * 0.24);
      ctx.quadraticCurveTo(s * r * 0.56, r * 0.06, s * r * 0.33, r * 0.06);
      ctx.quadraticCurveTo(s * r * 0.1, r * 0.04, s * r * 0.08, -r * 0.2);
      ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.19); ctx.lineTo(r * 0.1, -r * 0.19); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.4 - r * 0.07, -r * 0.13, r * 0.06, r * 0.025, -0.4, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

// ---------- karakterler ----------
function drawSun(ctx, x, y, r, t, e) {
  glow(ctx, x, y, r * 0.8, r * 2.4, 'rgba(255,170,30,1)', 0.55);
  ctx.save(); ctx.translate(x, y);
  // ışınlar
  const n = 16, rot = t * 0.25;
  for (let i = 0; i < n; i++) {
    const a = rot + i * 6.2832 / n, len = r * (i % 2 ? 1.22 : 1.36) + Math.sin(t * 3 + i) * r * 0.03, w = 0.13;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - w) * r * 0.92, Math.sin(a - w) * r * 0.92);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + w) * r * 0.92, Math.sin(a + w) * r * 0.92);
    ctx.fillStyle = i % 2 ? '#ffb703' : '#ff9505'; ctx.fill();
  }
  // gövde
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#fff3a3'); g.addColorStop(0.45, '#ffc93c'); g.addColorStop(1, '#f77f00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
  ctx.lineWidth = r * 0.035; ctx.strokeStyle = '#d35400'; ctx.stroke();
  ctx.restore();
  drawFace(ctx, x, y + r * 0.05, r, e, t, '#ffb627', '#7a2e00');
}

// Dünya: kıtalar (boylam, enlem) çokgenleri; ortografik izdüşüm, t ile döner. Karikatür, harita değil.
const LAND = [
  [[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-80, 30], [-97, 18], [-105, 22], [-118, 33], [-125, 48], [-150, 60]], // K. Amerika
  [[-80, 10], [-60, 8], [-35, -7], [-40, -22], [-58, -38], [-70, -52], [-75, -40], [-72, -18], [-81, -5]],                         // G. Amerika
  [[-17, 21], [-5, 35], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -18], [9, 4], [-8, 5]],       // Afrika
  [[-10, 36], [-9, 44], [0, 50], [8, 55], [25, 60], [30, 70], [60, 70], [100, 77], [140, 72], [175, 66], [160, 58], [140, 45], [122, 30], [108, 18], [100, 5], [78, 8], [70, 22], [57, 25], [48, 30], [35, 36], [27, 40], [12, 44], [3, 42]], // Avrasya
  [[114, -22], [122, -18], [135, -12], [145, -15], [153, -27], [150, -37], [140, -38], [130, -32], [115, -34]],                      // Avustralya
];
function drawEarth(ctx, x, y, r, t, e, frost = 0) {
  glow(ctx, x, y, r * 0.9, r * 1.5, 'rgba(76,201,240,1)', 0.35 * (1 - frost));
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.save(); ctx.clip();
  const sea = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  sea.addColorStop(0, '#6fd6ff'); sea.addColorStop(0.6, '#2a8fd6'); sea.addColorStop(1, '#14569e');
  ctx.fillStyle = sea; ctx.fillRect(-r, -r, r * 2, r * 2);
  const lon0 = t * 18 - 20, tilt = 0.35;
  const proj = (lo, la) => {
    const L = (lo - lon0) * Math.PI / 180, P = la * Math.PI / 180;
    let px = Math.cos(P) * Math.sin(L), py = Math.sin(P), pz = Math.cos(P) * Math.cos(L);
    const qy = py * Math.cos(tilt) - pz * Math.sin(tilt), qz = py * Math.sin(tilt) + pz * Math.cos(tilt);
    if (qz < 0) { const k = 1 / Math.hypot(px, qy); px *= k; py = qy * k; } else py = qy;
    return [px * r, -py * r, qz];
  };
  for (const poly of LAND) {
    const pts = poly.map(p => proj(p[0], p[1]));
    if (pts.every(p => p[2] < 0)) continue;
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = '#5bd17a'; ctx.fill();
    ctx.lineWidth = r * 0.025; ctx.strokeStyle = '#2f9e55'; ctx.stroke();
  }
  // kutuplar
  ctx.fillStyle = '#f2fbff';
  ctx.beginPath(); ctx.ellipse(0, -r * 0.98, r * 0.55, r * 0.18, 0, 0, 6.2832); ctx.fill();
  // gölge (ışık sol üstten)
  const sh = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.3, 0, 0, r * 1.05);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,10,40,0.45)');
  ctx.fillStyle = sh; ctx.fillRect(-r, -r, r * 2, r * 2);
  // buz
  if (frost > 0.01) {
    ctx.globalAlpha = frost * 0.7; ctx.fillStyle = '#dff4ff'; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.globalAlpha = frost; ctx.strokeStyle = '#9ecfee'; ctx.lineWidth = r * 0.02;
    const rr = rng(3);
    for (let i = 0; i < 9; i++) {
      let a = rr() * 6.28, px = Math.cos(a) * r, py = Math.sin(a) * r;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let j = 0; j < 4; j++) { px *= 0.72; py *= 0.72; px += (rr() - 0.5) * r * 0.25; py += (rr() - 0.5) * r * 0.25; ctx.lineTo(px, py); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832);
  ctx.lineWidth = r * 0.035; ctx.strokeStyle = mixColor('#0d3b73', '#7fb3d5', frost); ctx.stroke();
  ctx.restore();
  drawFace(ctx, x, y + r * 0.05, r, e, t, mixColor('#3a9ad9', '#d9f0ff', frost), '#0b2545');
}

if (typeof module !== 'undefined') module.exports = { W, H };
