# Fonts

`bricolage-grotesque-800-latin.woff2` is Bricolage Grotesque (SIL OFL 1.1, see
`OFL.txt`; no Reserved Font Name), instanced to wght 800 / opsz 96 / wdth 100 and
subset to Latin. This keeps the display font around 17 KB instead of 41 KB, which
protects the LCP budget. To regenerate it:

```bash
python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools brotli
curl -sL -o /tmp/src.ttf "https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
/tmp/ft/bin/fonttools varLib.instancer /tmp/src.ttf wght=800 opsz=96 wdth=100 -o /tmp/b800.ttf
/tmp/ft/bin/pyftsubset /tmp/b800.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20B9" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=bricolage-grotesque-800-latin.woff2
```
