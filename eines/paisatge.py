# Genera els camins del paisatge de la portada (index.html, <section class="paisatge">).
# Executa: python3 eines/paisatge.py  i enganxa cada tros (separats per SPLIT) al seu lloc de l'SVG.
import random, math
R = random.Random(947)
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
def pts(ps): return "M" + "L".join(f"{f(x)} {f(y)}" for x, y in ps) + "Z"

def jag(a, b, n, amp):
    """Línia trencada de a a b amb n trams i desplaçament perpendicular."""
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    out = []
    for i in range(1, n):
        t = i / n + R.uniform(-.3, .3) / n
        d = R.uniform(-amp, amp) * math.sin(math.pi * t) ** .5
        out.append((x1 + dx * t + nx * d, y1 + dy * t + ny * d))
    return out

out = []
NCLIP = 0
def P(cls, ps): out.append(f'<path class="{cls}" d="{pts(ps)}"/>')

# Raigs del sol
rays = []
for i in range(14):
    a = i * 2 * math.pi / 14 + .11
    a1, a2 = a - .045, a + .045
    rays.append([(800 + 130 * math.cos(a1), 330 + 130 * math.sin(a1)), (800 + 900 * math.cos(a1), 330 + 900 * math.sin(a1)),
                 (800 + 900 * math.cos(a2), 330 + 900 * math.sin(a2)), (800 + 130 * math.cos(a2), 330 + 130 * math.sin(a2))])
RAYS = '<g class="raigs">' + "".join(f'<path d="{pts(r)}"/>' for r in rays) + '</g>'

# Serralada llunyana
def serralada(base, top, n, amp, x0=-40, x1=1640):
    ps = [(x0, 900)]
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    prev = None
    for i, x in enumerate(xs):
        y = base - R.uniform(0, amp) if i % 2 == 0 else base - R.uniform(amp * .1, amp * .4)
        if i % 2 == 0: y = min(y, top + R.uniform(0, 40))  if R.random() < .3 else y
        if prev: ps += jag(prev, (x, y), 4, 7)
        ps.append((x, y)); prev = (x, y)
    ps.append((x1, 900))
    return ps

far = serralada(470, 330, 22, 120)
far = [(x, max(y, 445 + R.uniform(0, 45))) if 600 < x < 1000 and y < 900 else (x, y) for x, y in far]
P("lluny", far)

# Cim gran: àpex, peu esquerre, peu dret, peu de la carena (on acaba la línia de llum/ombra), costat de llum ('e' o 'd')
def cim(apex, L, Rr, M, llum, neu_y, cls):
    ax, ay = apex
    left = jag(L, apex, 9, 16); right = jag(apex, Rr, 9, 16)
    ridge = jag(apex, M, 8, 22)
    sil = [L] + left + [apex] + right + [Rr]
    # cara esquerra: L..apex..ridge..M ; cara dreta: apex..R..M..ridge
    cara_e = [L] + left + [apex] + ridge + [M]
    cara_d = [apex] + right + [Rr, M] + ridge[::-1]
    P(f"{cls} {'llum' if llum == 'e' else 'ombra'}", cara_e)
    P(f"{cls} {'llum' if llum == 'd' else 'ombra'}", cara_d)
    # Neu: una banda en ziga-zaga per sobre de neu_y, retallada amb la forma de cada cara (clipPath)
    global NCLIP
    for cara, lit in ((cara_e, llum == 'e'), (cara_d, llum == 'd')):
        NCLIP += 1
        cid = f"n{NCLIP}"
        zig = [(-200, -50), (1800, -50), (1800, neu_y)]
        n = 60
        for i in range(n + 1):
            x = 1800 - 2000 * i / n
            zig.append((x, neu_y + (R.uniform(18, 60) if i % 2 else R.uniform(-14, 6))))
        out.append(f'<clipPath id="{cid}"><path d="{pts(cara)}"/></clipPath>')
        P(("neu-llum" if lit else "neu-ombra") + f'" clip-path="url(#{cid})', zig)
    # Canals (línies de definició) a les dues cares
    for k in range(5):
        t = R.uniform(.15, .55)
        sx = ax + (L[0] - ax) * t * R.uniform(.4, .9) if k % 2 else ax + (Rr[0] - ax) * t * R.uniform(.4, .9)
        sy = ay + (L[1] - ay) * t
        ex, ey = sx + R.uniform(-30, 30), sy + R.uniform(90, 200)
        line = [(sx, sy)] + jag((sx, sy), (ex, ey), 5, 8) + [(ex, ey)]
        out.append(f'<path class="canal" d="M{"L".join(f"{f(x)} {f(y)}" for x, y in line)}"/>')
    return sil

out.append('<rect class="boira b1" x="0" y="380" width="1600" height="140"/>')
# Dos grans cims a banda i banda del sol, i un de més petit al darrere
cim((260, 250), (-120, 760), (560, 760), (300, 760), 'd', 380, "cg c-fons")
cim((1380, 220), (1060, 760), (1760, 760), (1330, 760), 'e', 360, "cg c-fons")
cim((470, 150), (-60, 820), (930, 820), (560, 820), 'd', 300, "cg")
cim((1170, 110), (700, 820), (1700, 820), (1100, 820), 'e', 270, "cg")
out.append('<rect class="boira b2" x="0" y="560" width="1600" height="160"/>')

# Serralada mitjana amb facetes
mid = serralada(700, 560, 16, 110)
P("mitja", mid)
out.append('<rect class="boira b3" x="0" y="650" width="1600" height="120"/>')

# Turons de davant amb avets
front = [(-20, 900), (-20, 735)] + jag((-20, 735), (420, 770), 8, 8) + [(420, 770)] + jag((420, 770), (1180, 790), 10, 6) + [(1180, 790)] + jag((1180, 790), (1620, 730), 8, 8) + [(1620, 730), (1620, 900)]
P("davant", front)

def avet(x, y, h):
    w = h * .38
    ps = [(x, y - h)]
    for i, k in enumerate([.35, .6, .85]):
        ps += [(x + w * k * .9, y - h * (1 - k) + 2), (x + w * k * .55, y - h * (1 - k) + 2)]
    ps += [(x + w, y), (x + 4, y), (x + 4, y + 10), (x - 4, y + 10), (x - 4, y), (x - w, y)]
    for i, k in enumerate([.85, .6, .35]):
        ps += [(x - w * k * .55, y - h * (1 - k) + 2), (x - w * k * .9, y - h * (1 - k) + 2)]
    return ps

trees = []
for x0, x1, yb in [(-10, 560, 760), (1240, 1610, 752)]:
    x = x0
    while x < x1:
        h = R.uniform(60, 130)
        y = yb + R.uniform(-8, 14)
        trees.append(pts(avet(x, y, h)))
        x += R.uniform(22, 46)
TREES = '<path class="avets" d="' + "".join(trees) + '"/>'

BIRDS = '<g class="ocells">' + "".join(f'<path d="M{x-10} {y}q5-6 10 0q5-6 10 0"/>' for x, y in [(640, 210), (668, 196), (700, 222), (958, 250), (985, 238)]) + '</g>'

print(RAYS)
print("SPLIT")
print(BIRDS)
print("SPLIT")
print("\n".join(out))
print("SPLIT")
print(TREES)
