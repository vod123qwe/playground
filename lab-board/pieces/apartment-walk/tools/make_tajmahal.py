# The worktop: Taj Mahal quartzite, drawn procedurally (not a scan of a slab): a warm cream ground, soft sandy clouds, wide translucent
# golden drifts and a few fine taupe veins, all running along the slab's diagonal. One map covers 250 x 250 cm (4096 px, 16 px per cm,
# for Blender; a 2048 px copy for the web); the run's top and the island's top take different parts of it, so neither repeats.
#   Run: python tools/make_tajmahal.py
import numpy as np, os
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'tex')
N = 4096
P = np.random.default_rng(48).permutation(1024)

def vnoise(u, v):                                               # value noise at any coordinates (hashed lattice, smoothstep)
    i, j = np.floor(u).astype(np.int64), np.floor(v).astype(np.int64); fu, fv = u - i, v - j
    h = lambda a, b: P[(P[a & 1023] + b) & 1023] / 1023.
    fu, fv = fu * fu * (3 - 2 * fu), fv * fv * (3 - 2 * fv)
    return (h(i, j) * (1 - fu) + h(i + 1, j) * fu) * (1 - fv) + (h(i, j + 1) * (1 - fu) + h(i + 1, j + 1) * fu) * fv

def fbm(u, v, oct=6, gain=.52):
    s, a, t = 0., 1., 0.
    for o in range(oct): s = s + a * vnoise(u * 2 ** o + o * 17.3, v * 2 ** o - o * 9.1); t += a; a *= gain
    return s / t

sm = lambda e0, e1, x: np.clip((x - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((x - e0) / (e1 - e0), 0, 1))
y, x = np.mgrid[0:N, 0:N].astype(np.float32) / N * 2.5          # metres
a, b = (x + y) * .7071, (y - x) * .7071                          # along the flow, across it
w1 = fbm(a * .9, b * .9, 5) - .5; w2 = fbm(a * 3, b * 3, 4) - .5
A, B = a + .35 * w1, b + .22 * w1 + .05 * w2                     # the flow, bent a little
clouds = fbm(A * 1.2, B * 1.6, 6)
drift = fbm(A * .55, B * 3.2, 6)                                 # stretched along the flow: long soft drifts
bands = sm(.52, .64, drift) * (1 - sm(.66, .8, drift))
ridge = 1 - np.abs(2 * fbm(A * .8, B * 5.5, 6) - 1)              # ridged, stretched: veins along the flow
vein = ridge ** 34 * sm(.35, .6, fbm(A * 1.4, B * 1.4, 3))      # fading in and out along their length
hair = (1 - np.abs(2 * fbm(A * 1.6 + 3, B * 11, 5) - 1)) ** 90 * .7
grain = fbm(x * 90, y * 90, 3)
ground, sand, gold, taupe = map(np.array, ([.93, .905, .86], [.87, .82, .74], [.80, .69, .52], [.60, .50, .40]))
L = lambda img, col, k: img * (1 - k[..., None]) + col * k[..., None]
img = np.ones((N, N, 3), np.float32) * ground
img = L(img, sand, .5 * sm(.45, .75, clouds))
img = L(img, gold, .42 * bands)
img = L(img, (gold + taupe) / 2, .8 * vein)
img = L(img, taupe, .55 * hair)
img *= (.975 + .05 * grain)[..., None]
img = (img.clip(0, 1) * 255 + .5).astype(np.uint8)
im = Image.fromarray(img, 'RGB'); os.makedirs(OUT, exist_ok=True)
im.save(os.path.join(OUT, 'tajmahal_4k.jpg'), quality=92, optimize=True)
im.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'tajmahal.jpg'), quality=90, optimize=True)
r = (.14 + .1 * vein + .05 * hair + .04 * (grain - .5)).clip(0, 1)   # polished, the veins a touch rougher
Image.fromarray((r * 255).astype(np.uint8), 'L').resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'tajmahal_rough.jpg'), quality=90)
print('ok')
