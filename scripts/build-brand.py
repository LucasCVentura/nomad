#!/usr/bin/env python3
"""Gera os arquivos da marca Manual NF em public/brand/.

    python3 scripts/build-brand.py
    python3 scripts/build-brand.py --pesos    # folha comparando espessuras

Desenho: anel em ouro + monograma NF em serifa de alto contraste, sobre lockup
empilhado de quatro níveis (marca / nome / categoria / assinatura). Rasteriza
via Chrome headless, que renderiza oklch() nativamente — as cores saem
idênticas às de globals.css.

O monograma vira CONTORNO, não texto: webfont dentro de <svg><text> não é
confiável no Safari (a fonte pode nem ser baixada se nada mais na página a
usar), e foi o que quebrou o logo no iPhone. Como efeito colateral, o site
deixa de precisar carregar a Bodoni.

Este script é a fonte única do desenho: além dos PNGs, ele escreve os
contornos em src/components/logo-paths.ts, que o componente do site consome.

Requer fontTools + brotli:  pip3 install fonttools brotli

As fontes são baixadas do Google Fonts na primeira execução e ficam em cache
em scripts/.fonts/ — só o primeiro run precisa de rede.
"""
import base64
import pathlib
import re
import subprocess
import sys

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "brand"
CACHE = ROOT / "scripts" / ".fonts"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Tokens de cor, espelhando src/app/globals.css.
GOLD, ROSE, BG, FG = ("oklch(0.78 0.07 80)", "oklch(0.72 0.13 5)",
                      "oklch(0.16 0.012 30)", "oklch(0.97 0.01 80)")

# Peso do "MANUAL NF". Oswald é condensada: 400 já pesa bem mais que 300 sem
# fechar os contraformas nas letras estreitas.
NAME_WEIGHT = 400

# Tamanho do monograma em relação ao diâmetro da marca. Acima de ~0.44 as
# serifas do N e do F encostam no anel.
MONO_SCALE = 0.40

# Sobreposição entre N e F, em unidades do viewBox de 100.
MONO_KERN = -4.0

# A Bodoni tem eixo óptico: em texto o navegador o ajusta conforme o corpo, mas
# um contorno é fixo e precisa de um valor só. 28 mantém o contraste no tamanho
# grande e ainda segura as hastes finas aos 30px, onde 96 já some.
MONO_OPSZ = 28

FAMILIES = {"BodoniModa": "Bodoni+Moda:opsz,wght@6..96,400;6..96,500",
            "Oswald": "Oswald:wght@200;300;400;500;600",
            "Jost": "Jost:wght@300;400;500"}
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")


def font_b64(name):
    """Baixa e guarda o subconjunto LATINO — o primeiro @font-face que o Google
    devolve é o cirílico, e usá-lo faz os acentos caírem em fallback."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{name}.woff2"
    if not path.exists():
        css = subprocess.run(
            ["curl", "-sS", "-A", UA,
             f"https://fonts.googleapis.com/css2?family={FAMILIES[name]}&display=swap"],
            capture_output=True, text=True).stdout
        url = None
        for blk in re.findall(r"@font-face\s*\{.*?\}", css, re.S):
            if "U+0000-00FF" in blk:
                m = re.search(r"url\((https://[^)]+\.woff2)\)", blk)
                if m:
                    url = m.group(1)
        if not url:
            sys.exit(f"{name}: subconjunto latino não encontrado (sem rede?)")
        subprocess.run(["curl", "-sS", "-o", str(path), url], check=True)
    return base64.b64encode(path.read_bytes()).decode()


# Só as faces usadas como TEXTO nos PNGs. A Bodoni ainda é baixada (o
# monograma sai dela), mas vira contorno, então não precisa ir no CSS.
FACES = "".join(
    f"@font-face{{font-family:'{n}';font-weight:100 900;"
    f"src:url(data:font/woff2;base64,{font_b64(n)}) format('woff2')}}"
    for n in ("Oswald", "Jost"))
font_b64("BodoniModa")  # garante o arquivo em cache para a extração


def monogram_paths():
    """Contornos do N e do F, já posicionados no viewBox de 100.

    O conjunto é centrado pela CAIXA DE TINTA das duas letras, não pela linha
    de base: é mais fiel do que confiar em dominant-baseline, que além de tudo
    é irregular entre navegadores."""
    fs = MONO_SCALE * 100
    font = instancer.instantiateVariableFont(
        TTFont(CACHE / "BodoniModa.woff2"), {"wght": 400, "opsz": MONO_OPSZ})
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    k = fs / font["head"].unitsPerEm
    glyph = lambda c: glyphs[cmap[ord(c)]]
    xs = {"N": 0.0, "F": glyph("N").width * k + MONO_KERN}

    def draw(char, dx, dy, pen):
        # y invertido: a fonte cresce para cima, o SVG para baixo.
        glyph(char).draw(
            TransformPen(pen, Transform().translate(dx, dy).scale(k, -k)))

    bounds = None
    for char in "NF":
        b = BoundsPen(glyphs)
        draw(char, xs[char], 0.0, b)
        x0, y0, x1, y1 = b.bounds
        bounds = ((x0, y0, x1, y1) if bounds is None else
                  (min(bounds[0], x0), min(bounds[1], y0),
                   max(bounds[2], x1), max(bounds[3], y1)))
    ox = 50 - (bounds[0] + bounds[2]) / 2
    oy = 50 - (bounds[1] + bounds[3]) / 2

    out = {}
    for char in "NF":
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}")
        draw(char, xs[char] + ox, oy, pen)
        out[char] = pen.getCommands()
    return out


MONO = monogram_paths()


def mark(size):
    """Anel em ouro com o monograma NF em contorno.

    N e F são ambos angulares e de haste vertical, então sobrepô-los faz o F
    sumir dentro do N — é a cor que separa as duas letras, não a forma."""
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 100 100"'
        f' xmlns="http://www.w3.org/2000/svg">'
        f'<circle cx="50" cy="50" r="34" fill="none" stroke="{GOLD}"'
        f' stroke-width="1.7"/>'
        f'<path d="{MONO["N"]}" fill="{GOLD}"/>'
        f'<path d="{MONO["F"]}" fill="{ROSE}"/></svg>')


def lockup(*, s=1.0, fg=FG, weight=None):
    return (
        f'<div style="display:grid;justify-items:center">'
        f'<div style="margin-bottom:{16 * s}px">{mark(104 * s)}</div>'
        f'<div style="font-family:Oswald,sans-serif;font-weight:{weight or NAME_WEIGHT};'
        f'font-size:{34 * s}px;letter-spacing:.17em;text-indent:.17em;color:{fg};'
        f'line-height:1;white-space:nowrap">MANUAL NF</div>'
        f'<div style="font-family:Jost,sans-serif;font-size:{12 * s}px;letter-spacing:.32em;'
        f'text-indent:.32em;color:{fg};opacity:.8;margin-top:{9 * s}px;line-height:1;'
        f'white-space:nowrap">ESTÉTICA AVANÇADA</div>'
        f'<div style="width:{64 * s}px;height:1px;background:{GOLD};opacity:.6;'
        f'margin:{11 * s}px 0"></div>'
        f'<div style="font-family:Jost,sans-serif;font-size:{10.5 * s}px;letter-spacing:.2em;'
        f'text-indent:.2em;color:{GOLD};line-height:1;white-space:nowrap">'
        f'DRA. NATHALIA FIALHO</div></div>')


def horiz(s=1.0, fg=FG):
    """Variante horizontal, para o cabeçalho do site."""
    return (
        f'<div style="display:flex;align-items:center;gap:{16 * s}px">{mark(60 * s)}'
        f'<div style="display:grid;gap:{5 * s}px">'
        f'<div style="font-family:Oswald,sans-serif;font-weight:{NAME_WEIGHT};'
        f'font-size:{25 * s}px;letter-spacing:.17em;color:{fg};line-height:1;'
        f'white-space:nowrap">MANUAL NF</div>'
        f'<div style="font-family:Jost,sans-serif;font-size:{8.5 * s}px;letter-spacing:.28em;'
        f'color:{GOLD};line-height:1;white-space:nowrap">DRA. NATHALIA FIALHO</div>'
        f'</div></div>')


def render(name, body, w, h, transparent=True):
    html = OUT / f".{name}.html"
    html.write_text(f"<style>{FACES}*{{margin:0;padding:0;box-sizing:border-box}}</style>"
                    f"<body>{body}</body>")
    png = OUT / f"{name}.png"
    cmd = [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
           f"--screenshot={png}", f"--window-size={w},{h}",
           "--force-device-scale-factor=2"]
    if transparent:
        cmd.append("--default-background-color=00000000")
    subprocess.run(cmd + [f"file://{html}"], capture_output=True, check=True)
    html.unlink()
    print(f"  {png.name:<28} {w*2}x{h*2}  {png.stat().st_size // 1024} KB")


def box(inner, w, h):
    # min-height, não height:100% — num <body> sem altura este colapsa e a
    # captura sai em branco.
    return (f'<div style="display:grid;place-items:center;width:{w}px;'
            f'min-height:{h}px">{inner}</div>')


def folha_de_pesos():
    cells = "".join(
        f'<div style="display:grid;gap:20px;justify-items:center">'
        f'<div style="font-family:Oswald,sans-serif;font-weight:{wt};font-size:34px;'
        f'letter-spacing:.17em;text-indent:.17em;color:{FG};line-height:1">MANUAL NF</div>'
        f'<div style="font-family:Jost,sans-serif;font-size:11px;letter-spacing:.14em;'
        f'color:{FG};opacity:.5">OSWALD {wt}</div></div>'
        for wt in (300, 400, 500, 600))
    render("_pesos",
           f'<div style="background:{BG};padding:44px;display:grid;gap:30px;'
           f'justify-items:center">{cells}</div>', 420, 400, transparent=False)


def escreve_contornos():
    """Publica os contornos para o componente do site, para que app e PNG
    saiam do mesmo desenho em vez de duas cópias que podem divergir."""
    dest = ROOT / "src" / "components" / "logo-paths.ts"
    dest.write_text(
        "// GERADO por scripts/build-brand.py — não editar à mão.\n"
        "// Contornos do monograma NF (Bodoni Moda 400, "
        f"opsz {MONO_OPSZ}), num viewBox de 100x100.\n"
        f'export const MONOGRAM_N =\n  "{MONO["N"]}";\n\n'
        f'export const MONOGRAM_F =\n  "{MONO["F"]}";\n')
    print(f"  {dest.relative_to(ROOT)}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if "--pesos" in sys.argv:
        return folha_de_pesos()

    print("contornos do monograma")
    escreve_contornos()


    print("logo completo — vertical")
    render("logo-vertical-claro", box(lockup(), 420, 330), 420, 330)
    render("logo-vertical-escuro", box(lockup(fg=BG), 420, 330), 420, 330)

    print("\nlogo horizontal — cabeçalho")
    render("logo-horizontal-claro", box(horiz(), 360, 110), 360, 110)
    render("logo-horizontal-escuro", box(horiz(fg=BG), 360, 110), 360, 110)

    print("\nmarca isolada")
    render("marca", box(mark(200), 260, 230), 260, 230)

    print("\nícone e favicon")
    for sz in (512, 192, 180):
        render(f"icone-{sz}",
               f'<div style="width:{sz//2}px;height:{sz//2}px;background:{BG};'
               f'border-radius:{round(sz * 0.11)}px;display:grid;place-items:center">'
               f'{mark(sz * 0.33)}</div>', sz // 2, sz // 2)

    print("\nfolha de conferência")
    render("_revisao",
           f'<div style="background:{BG};padding:40px;display:grid;gap:34px;'
           f'justify-items:center">{lockup()}'
           f'<div style="width:100%;height:1px;background:{FG};opacity:.1"></div>'
           f'<div style="display:flex;gap:40px;align-items:center">{horiz(.9)}'
           f'<div style="width:56px;height:56px;background:{BG};border-radius:13px;'
           f'box-shadow:0 0 0 1px rgba(255,255,255,.12);'
           f'display:grid;place-items:center">{mark(34)}</div>'
           f'<div style="width:32px;height:32px;background:{BG};border-radius:8px;'
           f'box-shadow:0 0 0 1px rgba(255,255,255,.12);'
           f'display:grid;place-items:center">{mark(20)}</div>'
           f'</div></div>', 520, 500, transparent=False)


if __name__ == "__main__":
    main()
