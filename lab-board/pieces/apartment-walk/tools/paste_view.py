"""Paste photos (for instance made from the render crops by an image model) back into the 360 panorama, where they look.

    python tools/paste_view.py

Reads assets/private/view-real-render.jpg (the rendered panorama) and the photos in PHOTOS below; writes assets/private/view-real.jpg.
Each photo is a pinhole view: its bearing (degrees from north, clockwise), its horizontal field of view, the row its horizon sits on
(the camera's tilt comes from that), and whether it is mirrored. Where two photos overlap, each keeps the part nearer its own axis,
with a soft seam; their edges fade into the render, and the render is tinted towards the photos so the rest does not jar.
Panorama frame as in tools/view.js: x east, y up, z south; u = atan2(z, x) / 2pi + .5, v = asin(y) / pi + .5 (three.js).
"""
import math, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(__file__); P = os.path.join(HERE, '..', 'assets', 'private')
PHOTOS = [   # file, bearing, horizontal fov, horizon row (in the photo), mirrored, the row just over the highest hilltop
    # four views from the flat round the facade, left to right: along the street towards the block (2), the yard with the
    # warehouse (3), the field and the tracks (4), the street away to the bend (1); an image model's, from the render and a photo
    ('ai-output/gpt-2.webp', 40, 75, 322, False, 296),
    ('ai-output/gpt-3.webp', 88, 75, 356, False, 360),
    ('ai-output/gpt-4.webp', 135, 75, 356, False, 360),
    ('ai-output/gpt-1.webp', 185, 75, 334, False, 322),
]
TONE = (.8, .9)   # the photos' colour kept (the rest to grey) and their contrast: image models over-cook both
base8 = np.asarray(Image.open(os.path.join(P, 'view-real-render.jpg')).convert('RGB'))
H, W, _ = base8.shape
bear_u = lambda az: (math.atan2(-math.cos(math.radians(az)), math.sin(math.radians(az))) / (2 * math.pi) + .5) % 1
lo = min(az - fov / 2 - 20 for _, az, fov, _, _, _ in PHOTOS); hi = max(az + fov / 2 + 20 for _, az, fov, _, _, _ in PHOTOS)
c0, c1 = int(bear_u(lo) * W), int(bear_u(hi) * W); r0, r1 = int(H * (.5 - 55 / 180)), int(H * (.5 + 70 / 180))   # +55 .. -70 degrees
assert c0 < c1, 'the photos straddle the panorama seam: widen the code for that'
u = (np.arange(c0, c1) + .5) / W; v = (np.arange(r0, r1) + .5) / H
PHI, TH = np.meshgrid((u - .5) * 2 * math.pi, (.5 - v) * math.pi)
D = np.stack([np.cos(TH) * np.cos(PHI), np.sin(TH), np.cos(TH) * np.sin(PHI)], -1).astype(np.float32)
base = base8[r0:r1, c0:c1].astype(np.float32) / 255

layers = []
for f, az, fov, hrow, mirror, top in PHOTOS:
    im = Image.open(os.path.join(P, f)).convert('RGB')
    if mirror: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    ph = np.asarray(im).astype(np.float32) / 255; h, w, _ = ph.shape
    g = ph @ np.array([.2126, .7152, .0722], np.float32); ph = g[..., None] + (ph - g[..., None]) * TONE[0]; ph = np.clip(.5 + (ph - .5) * TONE[1], 0, 1)
    # only what is under the hilltops: the photo's sky fades out over 36 rows above them, the render's sky (matched in colour) stays
    # above, so there is no seam across the sky
    ground = np.clip((np.arange(h)[:, None] - (top - 36)) / 36, 0, 1).astype(np.float32) * np.ones((1, w), np.float32)
    fpx = (w / 2) / math.tan(math.radians(fov) / 2); pitch = -math.atan((h / 2 - hrow) / fpx); a = math.radians(az)
    fwd = np.array([math.sin(a) * math.cos(pitch), math.sin(pitch), -math.cos(a) * math.cos(pitch)], np.float32)
    right = np.array([math.cos(a), 0, math.sin(a)], np.float32); up = np.cross(right, fwd)
    z = D @ fwd; x = D @ right; y = D @ up; ok = z > .05
    px = np.where(ok, w / 2 + x / np.maximum(z, 1e-6) * fpx, -1); py = np.where(ok, h / 2 - y / np.maximum(z, 1e-6) * fpx, -1)
    inside = ok & (px >= 0) & (px < w - 1) & (py >= 0) & (py < h - 1)
    x0 = np.clip(np.floor(px).astype(int), 0, w - 2); y0 = np.clip(np.floor(py).astype(int), 0, h - 2); tx = (px - x0)[..., None]; ty = (py - y0)[..., None]
    s = (ph[y0, x0] * (1 - tx) + ph[y0, x0 + 1] * tx) * (1 - ty) + (ph[y0 + 1, x0] * (1 - tx) + ph[y0 + 1, x0 + 1] * tx) * ty
    edge = np.minimum.reduce([px, w - 1 - px, py, h - 1 - py]) / (.07 * w)     # fade over 7 % of the width at the photo's edges
    wt = np.where(inside, np.clip(edge, 0, 1), 0) ** 1.5 * ground[y0, x0]
    horiz = np.array([math.sin(a), 0, -math.cos(a)], np.float32)
    off = np.arccos(np.clip((D @ horiz) / np.maximum(np.cos(TH), 1e-6), -1, 1)).astype(np.float32)   # how far round from its axis
    layers.append((s, wt, off))
offs = np.stack([o for _, _, o in layers]); close = np.exp(-(offs - offs.min(0)) / math.radians(2.5))
acc = np.zeros_like(base); wsum = np.zeros(base.shape[:2], np.float32)
for (s, wt, _), c in zip(layers, close): k = wt * c; acc += s * k[..., None]; wsum += k
photo = acc / np.maximum(wsum, 1e-6)[..., None]; mask = np.clip(np.stack([w for _, w, _ in layers]).max(0), 0, 1)[..., None]
# tint the render towards the photos (mean and spread per channel, the sky and the ground apart), measured where the photos are whole
sky = D[..., 1] > .02; tint = {}
for name, part in (('sky', sky), ('ground', ~sky)):
    m = (mask[..., 0] > .9) & part
    if m.sum() > 1000: tint[name] = (base[m].mean(0), base[m].std(0) + 1e-4, photo[m].mean(0), photo[m].std(0) + 1e-4)
out = base8.astype(np.float32) / 255; ys = np.arange(H)
skyall = np.sin((.5 - (ys + .5) / H) * math.pi) > .02
for name, rows in (('sky', skyall), ('ground', ~skyall)):
    if name not in tint: continue
    bm, bs, pm, ps = tint[name]
    if name == 'sky': out[rows] = np.clip((out[rows] - bm) / bs * ps + pm, 0, 1) * .75 + out[rows] * .25   # the sky: matched
    else: out[rows] = np.clip(out[rows] + (pm - bm) * .5, 0, 1)                                            # the ground: nudged
roi = out[r0:r1, c0:c1]; out[r0:r1, c0:c1] = roi * (1 - mask) + photo * mask
Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)).save(os.path.join(P, 'view-real.jpg'), quality=92)
print('view-real.jpg', W, H, 'photos in columns', c0, c1)
