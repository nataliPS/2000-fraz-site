#!/usr/bin/env python3
"""Збирає сайт orizolabs.com з шаблонів (_src/templates) і перекладів (_src/i18n/<мова>.json).

Запуск із кореня репозиторію:  python3 _src/build.py
Українська — у корені сайту, інші мови — у папках /en/, /pl/, /lt/, /lv/, /et/, /sk/.
privacy.html і 404.html не генеруються: правте їх вручну.
"""
import json, re, sys, urllib.parse
from pathlib import Path

SRC = Path(__file__).resolve().parent
SITE = SRC.parent
BASE = "https://orizolabs.com/"

# порядок у меню мов
LANGS = ["uk", "en", "pl", "lt", "lv", "et", "sk"]
NATIVE = {"uk": "Українська", "en": "English", "pl": "Polski", "lt": "Lietuvių",
          "lv": "Latviešu", "et": "Eesti", "sk": "Slovenčina"}
OG = {"uk": "uk_UA", "en": "en_GB", "pl": "pl_PL", "lt": "lt_LT", "lv": "lv_LV", "et": "et_EE", "sk": "sk_SK"}

# сторінка: (шаблон, шлях у межах мови, ключ заголовка, опису, og-заголовка, og-опису, примітки в підвалі)
PAGES = {
    "home":    ("home.html",    "",             "meta_title", "meta_desc", "og_title",  "og_desc",  "foot_tagline"),
    "p2000":   ("p2000.html",   "2000/",        "t2_title",   "t2_desc",   "t2_title",  "t2_og",    "t2_foot"),
    "academy": ("academy.html", "academy/",     "ta_title",   "ta_desc",   "ta_title",  "ta_og",    "ta_foot"),
    "support": ("support.html", "support.html", "ts_title",   "ts_desc",   "ts_title",  "ts_desc",  "foot_tagline"),
    "investors": ("investors.html", "investors/", "inv_title", "inv_desc", "inv_title", "inv_desc", "foot_tagline"),
}


def lang_base(lang):
    return "" if lang == "uk" else f"{lang}/"


def out_path(lang, rel):
    p = lang_base(lang) + rel
    return p + "index.html" if p == "" or p.endswith("/") else p


def depth(path):
    return path.count("/")


def load(lang):
    return json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))


def render(tpl, ctx):
    def inc(m):
        return (SRC / "templates" / f"{m.group(1)}.html").read_text(encoding="utf-8")
    while "{{>" in tpl:
        tpl = re.sub(r"\{\{>(\w+)\}\}", inc, tpl)

    def sub(m):
        key, filt = m.group(1), m.group(2)
        if key not in ctx:
            raise KeyError(f"{ctx['lang']}: немає ключа «{key}»")
        val = ctx[key]
        return urllib.parse.quote(val) if filt == "url" else val
    # двічі: значення перекладів можуть містити {{R}} та {{L}}
    for _ in range(2):
        tpl = re.sub(r"\{\{(\w+)(?:\|(\w+))?\}\}", sub, tpl)
    return tpl


def main():
    import hashlib
    ver = hashlib.sha1(((SITE / "assets" / "site.css").read_bytes() + (SITE / "assets" / "site.js").read_bytes())).hexdigest()[:8]
    uk = load("uk")
    keys = set(uk)
    for lang in LANGS:
        t = load(lang)
        missing, extra = keys - set(t), set(t) - keys
        if missing or extra:
            sys.exit(f"{lang}: бракує {sorted(missing)}; зайві {sorted(extra)}")

    written = []
    for lang in LANGS:
        t = load(lang)
        for page, (tplname, rel, kt, kd, kot, kod, kfoot) in PAGES.items():
            path = out_path(lang, rel)
            R = "../" * depth(path)
            L = R + lang_base(lang)
            url = BASE + lang_base(lang) + rel
            alts = [f'<link rel="alternate" hreflang="{l}" href="{BASE}{lang_base(l)}{rel}">' for l in LANGS]
            alts.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}{lang_base("en")}{rel}">')
            menu = "".join(
                f'<li><a href="{R}{lang_base(l)}{rel}" lang="{l}" hreflang="{l}"'
                + (' aria-current="true"' if l == lang else "")
                + f'>{NATIVE[l]}</a></li>' for l in LANGS)
            footlangs = " · ".join(
                f'<a href="{R}{lang_base(l)}{rel}" lang="{l}" hreflang="{l}">{NATIVE[l]}</a>'
                for l in LANGS if l != lang)
            ctx = dict(t, lang=lang, R=R, L=L, URL=url, ALTERNATES="\n".join(alts),
                       LANGMENU=menu, ASSET_V=ver, FOOTLANGS=footlangs, LANGCODE=("UA" if lang == "uk" else lang.upper()),
                       lang_native=NATIVE[lang], og_locale=OG[lang],
                       TITLE=t[kt], DESC=t[kd], OGTITLE=t[kot], OGDESC=t[kod], FOOTNOTE=t[kfoot])
            html = render((SRC / "templates" / tplname).read_text(encoding="utf-8"), ctx)
            dest = SITE / path
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(html, encoding="utf-8")
            written.append((path, url))

    urls = [u for _, u in written] + [BASE + "privacy.html"]
    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    print(f"{len(written)} сторінок, {len(LANGS)} мов")


if __name__ == "__main__":
    main()
