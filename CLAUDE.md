# Space Shorts — çalışma hafızası

Yeni bir YouTube Shorts kanalı: yüzlü gezegen karakterleriyle kısa uzay/fizik animasyonları. Tarz (2026-10-23): rakibin
çizgi film diyalog formatı (`engine/toon.js`), bkz. `notlar/rakip-analizi.md`. Kanal adı henüz seçilmedi.
Kullanıcıyla Türkçe konuş; videolar İngilizce. Bu depo Hidden Map sahibine ait; `kkarakule12/latitude-lab` arkadaşının
projesi, oradan kod kopyalanmaz (sadece oradan öğrenilen dersler uygulanır).

## Format (ilk karar, 2026-10-23)
- 1080×1920, 30 fps, ~15 sn, döngü (son kare = ilk kare). Seslendirme yok: müzik + efekt + ekran yazısı.
- Üstte sabit iki renkli başlık (Bangers, OFL). Koyu yıldızlı arka plan.
- Örnek alınan kanal: Beyond the Observable Universe (2,08M abone). Karakterlerini, başlıklarını birebir kopyalama;
  YouTube'un tekrarlayan/özgün olmayan içerik kuralı yüzünden her video özgün anlatı ve görsel taşımalı.
- Ekrandaki her rakam iki kaynakla doğrulanır ya da hesaplanır (ör. Güneş–Dünya ışık süresi 1 AU / c = 499 sn = 8 dk 19 sn).
- Shorts arayüzü: sağ sütun (x > 960, y 900–1700) ve alt bölge (y > 1520) boş kalır.

## Yapı
- `engine/engine.js` — çizim çekirdeği: `drawSpace`, `glow`, `title`, `label`, `drawFace` + `EXPR` (happy, surprised,
  scared, frozen, angry, cool; `lerpExpr` ile geçiş), `drawSun`, `drawEarth` (frost 0–1).
- `proto/characters.html` — karakter kontrol sayfası (`renderAt(t, 'sheet' | 'scene')`).
- `engine/real.js` — gerçekçi çizim (2026-10-23, kullanıcı "yapay duruyor" dedi): doku küreye piksel piksel giydirilir;
  ışık-gölge sınırı, Dünya'da gece ışıkları + bulut, atmosfer parıltısı, Satürn halkası. `drawPlanet(ctx, ad, x, y, r, t)`,
  `drawRealSun`. Dokular `engine/tex/` (Solar System Scope, CC BY 4.0; açıklamaya kaynak satırı yazılır, bkz. `SOURCE.md`).
- `proto/realistic.html` — `lineup` (bütün gezegenler), `scene` (Güneş + Dünya), `face` (aynı sahne, yüzlü).
- `tools/shot.js` — tek kare PNG: `node tools/shot.js <sayfa> <çıktı.png> [t] [mod]`. Sayfayı yerel http sunucusundan açar
  (file:// ile doku pikselleri okunamıyor: "canvas has been tainted").

- `tools/serve.js` (sayfayı yerel http'den açar), `tools/render.js` (sessiz video: `node tools/render.js <sayfa> <out.mp4> <sn>`),
  `tools/audio.py` (kodla müzik + efekt: `python3 tools/audio.py <cue.json> <out.wav>`; poof, ticks, boom, rewind).
- Miks: `loudnorm=I=-14:TP=-1.5,volume=2.7dB,alimiter=limit=0.84` → ölçülen −14,2 LUFS (tek geçiş loudnorm kısa klipte −16,7 veriyordu).
- `shorts/<konu>/scene.html` + `cue.json`. Döngü için hikâye zamanı `tau` kullanılır (geri sarmada geriye akar); yıldızlar,
  dönüş ve yüz animasyonu da `tau` ile çizilir, yoksa ilk ve son kare tutmaz.

## Videolar
- `shorts/sun-vanished/` — deneme 1 (2026-10-23): 14,5 sn. Kontroller: ilk–son kare farkı 0,44 (< 1), siyah kare 0,
  −14,2 LUFS / tepe −1,1 dBFS, ses = görüntü = 14,5 sn. "Işık ve kütle çekimi aynı hızda" iddiası için iki kaynak henüz yazılmadı.

- `engine/toon.js` — çizgi film tarzı: `toonPlanet(ctx, ad, x, y, r, t, TEXPR.x)`, `toonEarth`, `toonSun`, `speaker(ctx, ad, renk,
  [[metin, renk|null], ...], y, emoji)`. İfadeler (`TEXPR`): happy, smug, laugh, angry, shocked, scared, sad, crying, worried —
  kaş yok, ifade göz kapağıyla. `proto/toon.html` rakiple yan yana karşılaştırma sahneleri.

## Açık işler
- Kızgın/donmuş ifadede dişler görünmüyor (ağız eğrisinin gerçek yüksekliği kontrol noktasının yarısı).
- Kontrolleri tek betikte topla (ilk–son kare, siyah kare, LUFS, süre, kare sayfası).
- Kanal adı, pilot konular (son 30 günde viral, kalabalık olmayan).
