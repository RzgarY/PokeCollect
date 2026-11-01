#!/usr/bin/env python3
"""Önbellek damgası: css/js dosyalarının adresine içerik hash'i ekler (?v=ab12cd34).

Dosya içeriği değişince adresi de değişir; tarayıcı, CDN ve service worker eski kopyayı
yeniden kullanamaz. sw.js içindeki BUILD ve SHELL_FILES de aynı hash'lerle güncellenir,
böylece açık sekmeler "yeni sürüm" bildirimini kendiliğinden alır.

Kullanım (siteyi yüklemeden önce, klasörün içinde ya da dışında fark etmez):
    python3 tools/stamp.py           damgala
    python3 tools/stamp.py --check   güncel mi diye bak (değilse çıkış kodu 1)

Yalnızca standart kütüphane kullanır. localStorage / IndexedDB'ye (kullanıcı verisi) dokunmaz.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = re.compile(r'((?:src|href)=")((?:css|js)/[^"?#]+)(?:\?v=[0-9a-f]+)?(")')
BLOCK = re.compile(r"/\* STAMP:BEGIN.*?STAMP:END \*/", re.S)


def digest(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()[:8]


def main() -> int:
    check = "--check" in sys.argv
    index = ROOT / "index.html"
    sw = ROOT / "sw.js"
    html = index.read_text(encoding="utf-8")

    refs = []

    def stamp(m):
        path = m.group(2)
        f = ROOT / path
        if not f.is_file():
            sys.exit(f"HATA: index.html şu dosyayı istiyor ama yok: {path}")
        refs.append(path)
        return f"{m.group(1)}{path}?v={digest(f.read_bytes())}{m.group(3)}"

    new_html = REF.sub(stamp, html)

    # Çevrimdışı için önbelleğe alınacak sabit varlıklar (yazı tipleri, giriş görselleri, simge)
    extras = sorted(
        [str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "assets/fonts").glob("*.woff2")]
        + [str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "assets/img").glob("pdx-*")]
        + ["assets/icons/icon-192.png", "manifest.json"]
    )
    for e in extras:
        if not (ROOT / e).is_file():
            sys.exit(f"HATA: dosya yok: {e}")

    # BUILD: kabuğu oluşturan her dosyanın içeriğinden (index.html'deki ?v= değerleri hariç)
    parts = [("index.html", REF.sub(lambda m: f"{m.group(1)}{m.group(2)}{m.group(3)}", new_html).encode())]
    for p in refs + extras:
        parts.append((p, (ROOT / p).read_bytes()))
    build = digest("".join(f"{n}:{digest(b)};" for n, b in sorted(parts)).encode())

    shell = ["./", "index.html"]
    for p in refs:
        shell.append(f"{p}?v={digest((ROOT / p).read_bytes())}")
    shell += extras
    shell_js = ",\n".join(f'  "{s}"' for s in shell)
    block = (
        "/* STAMP:BEGIN (tools/stamp.py bu bloğu yeniden yazar, elle düzenleme) */\n"
        f'var BUILD = "{build}";\n'
        f"var SHELL_FILES = [\n{shell_js},\n];\n"
        "/* STAMP:END */"
    )
    sw_src = sw.read_text(encoding="utf-8")
    if not BLOCK.search(sw_src):
        sys.exit("HATA: sw.js içinde STAMP:BEGIN / STAMP:END bloğu bulunamadı")
    new_sw = BLOCK.sub(lambda _: block, sw_src)

    changed = [n for n, a, b in (("index.html", html, new_html), ("sw.js", sw_src, new_sw)) if a != b]
    if check:
        if changed:
            print("Damga eski: " + ", ".join(changed) + "  ->  python3 tools/stamp.py")
            return 1
        print(f"Damga güncel (BUILD {build}).")
        return 0
    index.write_text(new_html, encoding="utf-8")
    sw.write_text(new_sw, encoding="utf-8")
    print(f"BUILD {build}: {len(refs)} css/js dosyası damgalandı" + (f" ({', '.join(changed)} güncellendi)" if changed else " (değişiklik yok)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
