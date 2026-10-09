# Fonts

All three fonts are local subsets of SIL OFL 1.1 fonts with no Reserved Font Name,
so subsets may keep their names. Each licence ships alongside:
`OFL-BricolageGrotesque.txt`, plus `OFL-Geist.txt` (which covers Geist and Geist Mono).

The subsets keep only the weights the site uses and Latin glyphs. That keeps
first-load font bytes around 41 KB instead of about 70 KB from the full Google
variable fonts, which protects the mobile LCP budget (measured in phase 3: the
full Geist fonts cost about two simulated round trips).

| File                                  | Source                                                          | Instance                    |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------- |
| `bricolage-grotesque-800-latin.woff2` | `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` | wght 800, opsz 96, wdth 100 |
| `geist-400-500-latin.woff2`           | `ofl/geist/Geist[wght].ttf`                                     | wght 400–500 (variable)     |
| `geist-mono-400-latin.woff2`          | `ofl/geistmono/GeistMono[wght].ttf`                             | wght 400                    |

To regenerate them (sources from https://github.com/google/fonts):

```bash
python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools brotli
G=https://github.com/google/fonts/raw/main/ofl
U="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2197,U+20B9"
curl -sL -o /tmp/brico.ttf "$G/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
curl -sL -o /tmp/geist.ttf "$G/geist/Geist%5Bwght%5D.ttf"
curl -sL -o /tmp/gmono.ttf "$G/geistmono/GeistMono%5Bwght%5D.ttf"
/tmp/ft/bin/fonttools varLib.instancer /tmp/brico.ttf wght=800 opsz=96 wdth=100 -o /tmp/b.ttf
/tmp/ft/bin/fonttools varLib.instancer /tmp/geist.ttf wght=400:500 -o /tmp/g.ttf
/tmp/ft/bin/fonttools varLib.instancer /tmp/gmono.ttf wght=400 -o /tmp/m.ttf
/tmp/ft/bin/pyftsubset /tmp/b.ttf --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=bricolage-grotesque-800-latin.woff2
/tmp/ft/bin/pyftsubset /tmp/g.ttf --unicodes="$U" --layout-features='kern,liga,calt,tnum' --flavor=woff2 --output-file=geist-400-500-latin.woff2
/tmp/ft/bin/pyftsubset /tmp/m.ttf --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=geist-mono-400-latin.woff2
```

If a new weight or character is needed (for example `font-semibold` body text),
add it to the instance range or `U`, then regenerate. Never swap in the full
Google font.
