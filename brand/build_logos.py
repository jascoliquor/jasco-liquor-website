"""Draws the Jasco logo takes as SVG. No fonts needed: every letter is a path.

Run:  python3 brand/build_logos.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT.parent / "public" / "brand"
UNUSED = ROOT / "unused"  # takes B and C, not published
INK, YELLOW, MAROON = "#16120f", "#f8d33a", "#5a2a2c"

# Letters sit on a 100-unit cap height. (width, path)
GLYPHS = {
    "J": (84, "M71 0V58A29 29 0 0 1 13 58V50"),
    "A": (124, "M8 114L62 4L116 114M34 72H90"),
    "S": (96, "M90 13H31.5A18.5 18.5 0 0 0 31.5 50H64.5A18.5 18.5 0 0 1 64.5 87H6"),
    "C": (94, "M94 13H50A37 37 0 0 0 50 87H94"),
    "O": (116, "M50 13H66A37 37 0 0 1 66 87H50A37 37 0 0 1 50 13Z"),
    "L": (76, "M13 0V87H76"),
    "I": (26, "M13 0V100"),
    "Q": (116, "M50 13H66A37 37 0 0 1 66 87H50A37 37 0 0 1 50 13ZM68 60L108 110"),
    "U": (94, "M13 0V53A34 34 0 0 0 81 53V0"),
    "R": (92, "M13 100V13H58A21 21 0 0 1 58 57H13M50 57L84 112"),
    "W": (148, "M6 -12L42 94L74 14L106 94L142 -12"),
    "N": (98, "M13 100V0M85 100V0M13 4L85 96"),
    "E": (78, "M78 13H13V87H78M13 50H70"),
    "&": (96, "M92 104L34 38C20 22 30 12 44 12C60 12 66 28 54 37L32 50C10 62 16 88 42 88C64 88 76 72 82 50"),
    " ": (44, ""),
}
# "A" whose counter is a bottle instead of a crossbar.
OPEN_A = "M8 114L62 4L116 114"
BOTTLE = "M57 58H67V68C67 73 74 75 74 81V100H50V81C50 75 57 73 57 68Z"


def word(text, spacing, stroke, bottle=False):
    """Return (svg, width) for text at cap height 100."""
    x, parts = 0, []
    for ch in text:
        w, d = GLYPHS[ch]
        if d:
            if bottle and ch == "A":
                parts.append(f'<g transform="translate({x} 0)"><path d="{OPEN_A}"/>'
                             f'<path d="{BOTTLE}" fill="currentColor" stroke="none"/></g>')
            else:
                parts.append(f'<path transform="translate({x} 0)" d="{d}"/>')
        x += w + spacing
    return (f'<g fill="none" stroke="currentColor" stroke-width="{stroke}" '
            f'stroke-miterlimit="10" clip-path="url(#cap)">{"".join(parts)}</g>'), x - spacing


def place(text, x, y, width, spacing, stroke=26, bottle=False):
    """Scale a word to an exact width. Returns (svg, height)."""
    svg, w = word(text, spacing, stroke, bottle)
    k = width / w
    return f'<g transform="translate({x} {y}) scale({k:.5f})">{svg}</g>', 100 * k


CLIP = '<defs><clipPath id="cap"><rect x="-20" y="0" width="3000" height="100"/></clipPath></defs>'


def doc(w, h, body, color):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:.1f}" role="img" '
            f'aria-label="Jasco Liquor &amp; Wine" color="{color}">{CLIP}{body}</svg>\n')


def lockup(width, bottle=False):
    top, h1 = place("JASCO", 0, 0, width, 16, bottle=bottle)
    sub, h2 = place("LIQUOR & WINE", 0, h1 + width * 0.05, width, 22, stroke=23)
    return top + sub, h1 + width * 0.05 + h2


def wordmark(color, bottle=False):
    body, h = lockup(600, bottle)
    return doc(600, h, body, color)


def sign(bottle=False):
    body, h = lockup(600, bottle)
    W, H = 720, h + 110
    return doc(W, H, f'<rect width="{W}" height="{H:.1f}" fill="{YELLOW}"/>'
                     f'<rect x="12" y="12" width="{W-24}" height="{H-24:.1f}" fill="none" stroke="{INK}" stroke-width="5"/>'
                     f'<g transform="translate(60 55)">{body}</g>', INK)


def tag():
    body, h = lockup(500)
    W, H = 760, h + 100
    m = H / 2
    return doc(W, H, f'<path fill="{YELLOW}" fill-rule="evenodd" d="M0 {m:.1f}L90 0H{W}V{H:.1f}H90Z'
                     f'M66 {m:.1f}a22 22 0 1 0 44 0a22 22 0 1 0 -44 0Z"/>'
                     f'<g transform="translate(180 50)">{body}</g>', INK)


def icon():
    d = GLYPHS["J"][1]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Jasco">'
            f'<rect width="128" height="128" fill="{YELLOW}"/>'
            f'<path transform="translate(24 19) scale(.9)" d="{d}" fill="none" stroke="{INK}" stroke-width="26"/></svg>\n')


FILES = {
    "a-sign.svg": sign(),
    "wordmark-black.svg": wordmark(INK),
    "wordmark-yellow.svg": wordmark(YELLOW),
    "icon.svg": icon(),
}
UNUSED_FILES = {"b-bottle.svg": sign(bottle=True), "c-tag.svg": tag()}

if __name__ == "__main__":
    for folder, files in ((PUBLIC, FILES), (UNUSED, UNUSED_FILES)):
        folder.mkdir(parents=True, exist_ok=True)
        for name, svg in files.items():
            (folder / name).write_text(svg)
            print("wrote", folder / name)
