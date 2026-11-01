# Pokémon Card Checklist

Statik site: derleme (build) gerekmez. Klasörü bir web sunucusuna yüklemen yeterli.

## Klasör yapısı

    index.html            Sayfa iskeleti
    sw.js, manifest.json  Çevrimdışı çalışma (PWA)
    tools/stamp.py        Yayın öncesi önbellek damgası
    _headers              Önbellek başlıkları (Netlify / Cloudflare Pages)
    css/                  Stiller (fonts, base, intro, my-cards, binder-stats)
    js/
      data/               Nesil listeleri, Pokémon veritabanı
      i18n/               Dil seçimi ve çeviri metinleri (tr / en)
      core/               Yardımcılar, kayıt (localStorage), arayüz, sayfa geçişi, erişilebilirlik
      features/           Koleksiyon, ekle/düzenle pencereleri, Pokédex, Kartlarım, Binder ve İstatistik
    assets/               sprites/ (1025 WebP), fonts/, img/

Not: JS dosyaları index.html içindeki sırayla yüklenir ve aynı global alanı paylaşır.
Sırayı değiştirme.

Dil değişince ek çizim gereken modüller `onLangChange(fn)` ile (i18n.js), kayıttan sonra ek iş gereken modüller `onSave(fn)` ile (storage.js) kendini kaydeder.
Ayarlar (dil, tema, istatistik) js/core/settings.js içindedir. Tema tercihi `pokemon-theme` anahtarında tutulur (auto/light/dark).
Tüm çeviriler js/i18n/strings.js içindeki tek `I` sözlüğündedir.

## Yayınlamadan önce (önemli)

Her değişiklikten sonra, siteyi yüklemeden önce bir kez çalıştır:

    python3 tools/stamp.py

Bu komut css/js dosyalarının adresine içerik hash'i ekler (`utils.js?v=a9563bb4`) ve `sw.js` içindeki
`BUILD` ile `SHELL_FILES` listesini günceller. Dosya değişince adresi de değişir; tarayıcı, CDN ve
service worker eski kopyayı yeniden kullanamaz. Elle sürüm numarası artırmak ya da yeni dosyayı listeye
eklemek gerekmez (liste `index.html`'deki `<script>` / `<link>` etiketlerinden çıkarılır).
Unutup unutmadığını görmek için: `python3 tools/stamp.py --check` (eskiyse çıkış kodu 1 verir).

## Önbellek ve güncellemeler

Eski kodun gelmesini dört katman engeller:

1. `tools/stamp.py`: css/js adresleri içeriğe göre değişir (ana çözüm).
2. `sw.js`: kabuk dosyaları her istekte sunucuya sorulur (`cache: "no-cache"`), hosting'in `max-age` ayarı
   eski dosya sızdıramaz. Ağ yoksa ya da 4 sn içinde yanıt gelmezse önbellekteki kopya kullanılır.
3. `pwa.js`: açık kalan sekme ya da ana ekran uygulaması öne gelince (en sık 5 dk'da bir) ve saatte bir
   yeni sürümü denetler; bulursa "Yeni sürüm hazır" bildirimi çıkar, sayfa kullanıcı onayı olmadan yenilenmez.
4. Sunucu başlıkları: `_headers` dosyası (Netlify / Cloudflare Pages) `index.html`, `sw.js`, `manifest.json`,
   css ve js için `Cache-Control: no-cache` verir. Başka hosting kullanıyorsan aynı kuralı ekle.
   Apache için `.htaccess`:

       <FilesMatch "\.(html|js|css|json)$">
         Header set Cache-Control "no-cache"
       </FilesMatch>

Kullanıcı verisi güvende: service worker yalnızca tarayıcının `caches` (Cache Storage) alanına dokunur.
localStorage ve IndexedDB'ye yazmaz, silmez. Siteye `Clear-Site-Data: "storage"` ya da `"*"` başlığı
ekleme; bu, koleksiyonu siler. Sprite önbelleği (`pk-sprites-v1`) sprite dosyaları değişirse elle
yeni isme (`-v2`) alınmalı.

## Çevrimdışı (PWA)

`manifest.json` + `sw.js`: kabuk dosyaları ve sprite'lar önbelleğe alınır, site çevrimdışı açılır.
`index.html` içindeki `og:image` göreli yoldur; siteyi yayınlayınca tam adresle (https://…/assets/img/og.png) değiştir.
Service worker yalnızca https (veya localhost) üzerinde çalışır.

## Saklanan veriler (localStorage / IndexedDB)

Bu anahtarların adı ve biçimi değişirse mevcut kullanıcıların koleksiyonu kaybolur, dokunma:
`pokemon-check-v5` (+ `-bak`, eski `pokemon-check-v4` göçü), `pokemon-lang`, `pokemon-theme`,
`pokemon-px-<id>` (PokéAPI önbelleği), `pokecollect-cards-v2`, `pokecollect-tcg-inventory-v1` (+ `-wanted`, `-meta`, `-auto`),
`pokecollect-binders-v1`, `pokecollect-log`; IndexedDB: `pokecollect-photos` (store `p`).

## Yerelde denemek

    python3 -m http.server 8000     # sonra tarayıcıda http://localhost:8000
