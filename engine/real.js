// Gerçekçi gezegen çizimi: doku (equirectangular) küreye piksel piksel giydirilir, ışık-gölge sınırı,
// gece ışıkları, bulut katmanı, atmosfer parıltısı ve halkalar. engine.js'ten sonra yüklenir.
// Dokular: Solar System Scope, CC BY 4.0 (engine/tex/SOURCE.md).

const TEX = {};          // ad -> {w, h, d: Uint8ClampedArray}
const TEX_CACHE = {};    // ad@genişlik -> küçültülmüş doku (örnekleme gürültüsünü azaltır)

async function loadTextures(base, names) {
  await Promise.all(names.map(n => new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        TEX[n] = { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data, img };
        ok();
      } catch (e) { fail(e); }
    };
    img.onerror = () => fail(new Error('doku yüklenemedi: ' + n));
    img.src = base + n + (n.endsWith('alpha') ? '.png' : '.jpg');
  })));
}
// Küre çevresi ~2πr piksel; dokuyu buna yakın genişliğe küçültüp en yakın komşu ile örnekleriz.
function texAt(name, w) {
  const t = TEX[name]; w = Math.min(t.w, Math.max(64, Math.ceil(w / 64) * 64));
  const key = name + '@' + w;
  if (!TEX_CACHE[key]) {
    const h = Math.round(t.h * w / t.w), c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(t.img, 0, 0, w, h);
    TEX_CACHE[key] = { w, h, d: x.getImageData(0, 0, w, h).data };
  }
  return TEX_CACHE[key];
}
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// o: { tex, lon (derece, dönüş), tilt (radyan, eksen eğikliği ekranda), pitch (radyan, kutba bakış),
//      light: [x,y,z] (ekran uzayında, z izleyiciye doğru), ambient, night, clouds, cloudLon,
//      atmo: [r,g,b], atmoStrength, sun (true: kendinden ışıklı, kenar kararması) }
function drawSphere(ctx, x, y, r, o) {
  const pad = Math.ceil(r * 0.15), S = Math.ceil(r * 2 + pad * 2);
  const can = drawSphere.can || (drawSphere.can = document.createElement('canvas'));
  if (can.width < S || can.height < S) { can.width = S; can.height = S; }
  const cx = can.getContext('2d');
  const img = cx.createImageData(S, S), out = img.data;
  const tw = Math.ceil(2 * Math.PI * r * 1.5);
  const T = texAt(o.tex, tw), N = o.night && texAt(o.night, tw), C = o.clouds && texAt(o.clouds, tw);
  let [lx, ly, lz] = o.light || [-0.6, -0.35, 0.72]; const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
  const amb = o.ambient ?? 0.04, tilt = o.tilt || 0, pitch = o.pitch || 0, pw = o.power ?? 1; // power: 0 = Güneş yok
  const ct = Math.cos(tilt), st = Math.sin(tilt), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const lon0 = (o.lon || 0) * Math.PI / 180, clon0 = ((o.cloudLon ?? o.lon) || 0) * Math.PI / 180;
  const atmo = o.atmo, as = o.atmoStrength ?? 0.6;
  const c = S / 2;
  for (let j = 0; j < S; j++) {
    const ny0 = (j + 0.5 - c) / r;
    for (let i = 0; i < S; i++) {
      const nx0 = (i + 0.5 - c) / r, d2 = nx0 * nx0 + ny0 * ny0;
      if (d2 > 1.0 + 2 / r) continue;
      const d = Math.sqrt(d2), edge = clamp((1 - d) * r + 0.5);
      if (edge <= 0) continue;
      const nz0 = Math.sqrt(Math.max(0, 1 - d2));
      // ekran eğikliği (z ekseni etrafında), sonra kutba bakış (x ekseni etrafında)
      const nx = nx0 * ct + ny0 * st, ny1 = -nx0 * st + ny0 * ct;
      const ny = ny1 * cp - nz0 * sp, nz = ny1 * sp + nz0 * cp;
      const lat = Math.asin(clamp(-ny, -1, 1)), lon = Math.atan2(nx, nz);
      const u = ((lon + lon0) / (2 * Math.PI) % 1 + 1) % 1, v = 0.5 - lat / Math.PI;
      const ti = ((Math.min(T.h - 1, (v * T.h) | 0) * T.w + ((u * T.w) | 0)) << 2);
      let R = T.d[ti], G = T.d[ti + 1], B = T.d[ti + 2];
      const ndl = nx0 * lx + ny0 * ly + nz0 * lz;
      if (o.sun) {
        const mu = nz0, ld = 1 - 0.55 * (1 - Math.pow(mu, 0.6));
        R = R * ld * 1.15 + 30; G = G * ld * 1.05; B = B * ld * 0.8;
      } else {
        const lit = amb + (1 - amb) * pw * smooth(-0.08, 0.35, ndl) * (0.35 + 0.65 * clamp(ndl));
        if (C) {
          const cu = ((lon + clon0) / (2 * Math.PI) % 1 + 1) % 1;
          const ci = ((Math.min(C.h - 1, (v * C.h) | 0) * C.w + ((cu * C.w) | 0)) << 2);
          const ca = C.d[ci] / 255 * 0.9;
          R = R * (1 - ca) + 255 * ca; G = G * (1 - ca) + 255 * ca; B = B * (1 - ca) + 255 * ca;
        }
        R *= lit; G *= lit; B *= lit;
        if (N) {
          const dark = 1 - pw * smooth(-0.2, 0.05, ndl);
          if (dark > 0) { R += N.d[ti] * dark * 1.1; G += N.d[ti + 1] * dark * 0.95; B += N.d[ti + 2] * dark * 0.6; }
        }
        if (atmo) { // kenarda atmosfer (Fresnel), aydınlık tarafta güçlü
          const rim = Math.pow(1 - nz0, 2.5) * as * clamp(ndl + 0.35) * pw;
          R += atmo[0] * rim; G += atmo[1] * rim; B += atmo[2] * rim;
        }
      }
      const p = (j * S + i) << 2;
      out[p] = R; out[p + 1] = G; out[p + 2] = B; out[p + 3] = 255 * edge;
    }
  }
  cx.clearRect(0, 0, S, S); cx.putImageData(img, 0, 0);
  if (atmo && !o.sun && pw > 0.01) { // dış hale
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.98, x, y, r * 1.12);
    g.addColorStop(0, `rgba(${atmo.join(',')},${0.45 * as * pw})`); g.addColorStop(1, `rgba(${atmo.join(',')},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.12, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  ctx.drawImage(can, 0, 0, S, S, x - c, y - c, S, S);
}

// Güneş: kendinden ışıklı küre + iç içe parıltı katmanları
function drawRealSun(ctx, x, y, r, t) {
  glow(ctx, x, y, r * 0.9, r * 3.2, 'rgba(255,150,40,1)', 0.35);
  glow(ctx, x, y, r * 0.95, r * 1.7, 'rgba(255,200,90,1)', 0.6);
  drawSphere(ctx, x, y, r, { tex: '2k_sun', lon: t * 6, sun: true });
  glow(ctx, x, y, r * 0.2, r * 1.05, 'rgba(255,240,200,1)', 0.12);
}

// Halka (Satürn): doku, yarıçap boyunca profil + alfa. Arka yarı gezegenden önce, ön yarı sonra çizilir.
function drawRing(ctx, x, y, r, o, half) {
  const T = TEX['2k_saturn_ring_alpha'], inner = (o.inner ?? 1.24) * r, outer = (o.outer ?? 2.27) * r;
  const si = Math.max(0.05, Math.sin(o.incl ?? 0.35)), tilt = o.tilt || 0, ct = Math.cos(tilt), st = Math.sin(tilt);
  const Wd = Math.ceil(outer * 2 + 4), Hd = Wd;
  const can = drawRing.can || (drawRing.can = document.createElement('canvas'));
  can.width = Wd; can.height = Hd;
  const cx = can.getContext('2d'), img = cx.createImageData(Wd, Hd), out = img.data, c = Wd / 2;
  for (let j = 0; j < Hd; j++) for (let i = 0; i < Wd; i++) {
    const sx0 = i + 0.5 - c, sy0 = j + 0.5 - c;
    const sx = sx0 * ct + sy0 * st, sy = -sx0 * st + sy0 * ct;
    const rz = sy / si, rad = Math.hypot(sx, rz);
    if (rad < inner || rad > outer) continue;
    const front = sy > 0; if ((half === 'front') !== front) continue;
    // gezegenin arkasında kalan halka parçası gizlenir
    if (!front && sx0 * sx0 + sy0 * sy0 < r * r) continue;
    const sh = 1;
    const ti = Math.min(T.w - 1, ((rad - inner) / (outer - inner) * T.w) | 0) * 4 + T.w * 4 * 60;
    const p = (j * Wd + i) << 2, k = 0.95 * sh;
    out[p] = T.d[ti] * k; out[p + 1] = T.d[ti + 1] * k; out[p + 2] = T.d[ti + 2] * k; out[p + 3] = T.d[ti + 3];
  }
  cx.putImageData(img, 0, 0);
  ctx.drawImage(can, x - c, y - c);
}

// Hazır gezegen ayarları
const PLANET = {
  mercury: { tex: '2k_mercury', ambient: 0.03 },
  venus:   { tex: '2k_venus_atmosphere', atmo: [255, 220, 150], atmoStrength: 0.5 },
  earth:   { tex: '2k_earth_daymap', night: '2k_earth_nightmap', clouds: '2k_earth_clouds', atmo: [90, 160, 255], atmoStrength: 0.9, tilt: -0.41 },
  moon:    { tex: '2k_moon', ambient: 0.03 },
  mars:    { tex: '2k_mars', atmo: [255, 150, 110], atmoStrength: 0.35 },
  jupiter: { tex: '2k_jupiter', atmo: [255, 230, 200], atmoStrength: 0.3 },
  saturn:  { tex: '2k_saturn', atmo: [255, 230, 180], atmoStrength: 0.25, ring: true },
  uranus:  { tex: '2k_uranus', atmo: [170, 240, 255], atmoStrength: 0.5 },
  neptune: { tex: '2k_neptune', atmo: [110, 160, 255], atmoStrength: 0.5 },
};
function drawPlanet(ctx, name, x, y, r, t, extra = {}) {
  const o = Object.assign({ lon: t * 12, cloudLon: t * 14 }, PLANET[name], extra);
  if (o.ring) drawRing(ctx, x, y, r, o, 'back');
  drawSphere(ctx, x, y, r, o);
  if (o.ring) drawRing(ctx, x, y, r, o, 'front');
}
