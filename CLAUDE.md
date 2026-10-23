# Space Shorts — çalışma hafızası

Yeni bir YouTube Shorts kanalı: yüzlü gezegen karakterleriyle kısa uzay/fizik animasyonları. Kanal adı henüz seçilmedi.
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
- `tools/shot.js` — tek kare PNG: `node tools/shot.js <sayfa> <çıktı.png> [t] [mod]`.

## Açık işler
- Kızgın/donmuş ifadede dişler görünmüyor (ağız eğrisinin gerçek yüksekliği kontrol noktasının yarısı).
- Video kayıt betiği (kare kare → ffmpeg), müzik/efekt, döngü ve titreme kontrolleri.
- Kanal adı, pilot konular (son 30 günde viral, kalabalık olmayan).
