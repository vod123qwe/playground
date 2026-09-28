# Reads the furnished plan (assets/plan.webp) and writes apartment.json in centimetres.
# The walls are taken straight from the drawing: dark pixels, thin lines (furniture, doors, text) removed.
# The openings are measured along the wall lines, their sizes checked against the architect's plan (O17 270, O22 90, O25 180...).
#   python tools/extract_plan.py            (--debug also writes tools/debug_walls.png: thick walls black, partitions grey)
import json, os
import cv2, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'assets', 'plan.webp')
OUT = os.path.join(HERE, '..', 'apartment.json')
S = 1.209                      # px per cm: bedroom 375 x 372 cm, bathroom 166 cm all give 1.208-1.210
H = 255                        # clear height Hn/Hb = 2.55 m (architect's plan)
DOOR = 205                     # the head of an inner door opening
OX, OY = 132, 1639             # the origin: the outer bottom-left corner of the flat

im = cv2.imread(IMG, 0)
dark = (im < 110).astype(np.uint8)
walls = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
n, lab, st, _ = cv2.connectedComponentsWithStats(walls, 8)
for i in range(1, n):
    if st[i, 4] < 150: walls[lab == i] = 0          # specks of text
# the shafts are drawn as outlines: small closed holes become solid
inv = 1 - walls
n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
for i in range(1, n):
    if st[i, 4] < 20000 and st[i, 0] > 0 and st[i, 1] > 0: walls[lab == i] = 1

U = np.array([0.6128, 0.7902])   # the long facade, going down to the right (the kitchen wall is at right angles)
NRM = np.array([-U[1], U[0]])
P2 = np.array([932.2, 490.7])    # the centre of the pier between the two living-room openings
V = np.array([0.7902, -0.6128])
P10 = np.array([1678.0, 1437.1])

def pt(p0, u, t, o):
    nrm = np.array([-u[1], u[0]])
    return (np.array(p0) + np.array(u) * t + nrm * o).tolist()

def gap_quad(p0, u, t0, t1, o0, o1):
    return [pt(p0, u, t0, o0), pt(p0, u, t1, o0), pt(p0, u, t1, o1), pt(p0, u, t0, o1)]

def gaps(p0, u, half, lo, hi):
    """the openings along a wall line: stretches between lo and hi with no wall pixels in the band"""
    u = np.array(u) / np.hypot(*u); nrm = np.array([-u[1], u[0]])
    ys, xs = np.nonzero(walls)
    d = np.column_stack([xs - p0[0], ys - p0[1]]).astype(float)
    t, o = d @ u, d @ nrm
    sel = (np.abs(o) < half) & (t >= lo) & (t <= hi)
    occ = np.zeros(int(hi - lo) + 1, bool); occ[(t[sel] - lo).astype(int)] = True
    out, s = [], None
    for i, v in enumerate(occ):
        if not v and s is None: s = i
        if v and s is not None:
            if i - s > 40: out.append((lo + s, lo + i))
            s = None
    return out

openings = []
def add(kind, p0, u, t0, t1, half, sill, head, name):
    openings.append({'kind': kind, 'name': name, 'quad': gap_quad(p0, u, t0, t1, -half, half), 'sill': sill, 'head': head, 'glazed': kind == 'window' or 'balcony' in name,
                     'width': round((t1 - t0) / S)})

# the long facade: five openings between the piers (widths as in the architect's plan)
fac = gaps(P2, U, 20, -470, 1200)
print('facade gaps px', fac)
spec = [('window', 0, 242, 'O17 balcony door + window 270'), ('door', 0, 242, 'O22 balcony door 90'),
        ('window', 30, 235, 'O25 window 180, sill 30'), ('door', 0, 242, 'O21 balcony door 90'), ('window', 0, 242, 'balcony door 113')]
for (t0, t1), (k, sl, hd, nm) in zip(fac, spec): add(k, P2, U, t0, t1, 27, sl, hd, nm)
# the short wall at the bottom right, towards the big balcony
for t0, t1 in gaps(P10, V, 18, -300, -10): add('window', P10, V, t0, t1, 20, 0, 242, 'balcony door 180')
# the bottom wall, bedroom 1
for t0, t1 in gaps((0, 1613), (1, 0), 25, 150, 600): add('window', (0, 1613), (1, 0), t0, t1, 26, 0, 242, 'balcony door 270')
# the front door, on the left
for t0, t1 in gaps((18, 0), (0, 1), 13, 480, 690): add('door', (18, 0), (0, 1), t0, t1, 14, 0, 210, 'front door 90')
# inner doors
inner = [((0, 911), (1, 0), 13, 160, 600, 'closet'), ((614, 0), (0, 1), 6, 930, 1330, 'wc / bedroom 1'),
         ((0, 1338), (1, 0), 6, 625, 950, 'bathroom'), ((781, 0), (0, 1), 6, 930, 1180, 'bedroom 3'),
         ((858, 0), (0, 1), 5, 1202, 1330, 'bedroom 2')]
for p0, u, half, lo, hi, nm in inner:
    g = gaps(p0, u, half, lo, hi); print(nm, g)
    for t0, t1 in g: add('door', p0, u, t0, t1, half + 2, 0, DOOR, 'door ' + nm)

# thick walls (outer and structural) vs partitions, by the local thickness
dt = cv2.distanceTransform(walls, cv2.DIST_L2, 5)
core = (dt >= 9).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(core, 8)
for i in range(1, n):
    if st[i, 4] < 40: core[lab == i] = 0          # a junction of two thin walls is not a thick wall
thick = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))) & walls
thin = walls & (1 - thick)

def polys(mask, eps=1.2, min_area=60):
    cs, hier = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None: return out
    for i, c in enumerate(cs):
        if hier[0][i][3] != -1 or cv2.contourArea(c) < min_area: continue
        outer = cv2.approxPolyDP(c, eps, True)[:, 0, :].tolist()
        holes, j = [], hier[0][i][2]
        while j != -1:
            if cv2.contourArea(cs[j]) >= min_area: holes.append(cv2.approxPolyDP(cs[j], eps, True)[:, 0, :].tolist())
            j = hier[0][j][0]
        out.append({'outer': outer, 'holes': holes})
    return out

# the footprint: walls + the openings closed, everything inside filled
closed = walls.copy()
for op in openings: cv2.fillPoly(closed, [np.array(op['quad'], np.int32)], 1)
ff = closed.copy(); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
cv2.floodFill(ff, msk, (5, 5), 2)
foot = (ff != 2).astype(np.uint8)
foot_poly = max(polys(foot, 1.5), key=lambda p: cv2.contourArea(np.array(p['outer'], np.int32)))

# rooms: flood from a seed with all doors closed; the hall and the living room split along the passage
rooms_mask = closed.copy()
cv2.line(rooms_mask, (621, 911), (778, 911), 1, 2)
ROOMS = [('Living + kitchen', (520, 560)), ('Bedroom', (380, 1380)), ('Bedroom', (1200, 1420)), ('Bedroom', (1000, 1050)),
         ('Bathroom', (800, 1450)), ('WC', (530, 960)), ('Walk-in closet', (300, 1010)), ('Hall', (700, 1100))]
rooms = []
for name, (x, y) in ROOMS:
    ff = rooms_mask.copy(); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, msk, (x, y), 3)
    a = int((ff == 3).sum()) / S / S / 1e4
    cs, _ = cv2.findContours((ff == 3).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = cv2.approxPolyDP(max(cs, key=cv2.contourArea), 2.0, True)[:, 0, :].tolist()
    rooms.append({'name': name, 'at': [x, y], 'area': round(a, 1), 'outline': out})
    print(name, round(a, 2), 'm2')

BALC = [
    {'name': 'Balcony', 'outer': [pt(P2, U, -435, -27), pt(P2, U, -435, -208), pt(P2, U, 230, -208), pt(P2, U, 230, -27)]},
    {'name': 'Balcony', 'outer': [pt(P2, U, 655, -27), pt(P2, U, 655, -208), [1968, 1452], [1505, 1820], [930, 1820], [930, 1639], [1440, 1639], [1690, 1445]]},
    {'name': 'Balcony', 'outer': [[207, 1639], [207, 1820], [651, 1820], [651, 1639]]},
]
# the railing: the free edges of each balcony (not the ones against the building)
RAIL = [[BALC[0]['outer'][0], BALC[0]['outer'][1], BALC[0]['outer'][2], BALC[0]['outer'][3]],
        [BALC[1]['outer'][0], BALC[1]['outer'][1], BALC[1]['outer'][2], BALC[1]['outer'][3], BALC[1]['outer'][4], BALC[1]['outer'][5]],
        [BALC[2]['outer'][0], BALC[2]['outer'][1], BALC[2]['outer'][2], BALC[2]['outer'][3]]]

def cm(p): return [round((p[0] - OX) / S, 1), round((p[1] - OY) / S, 1)]
def cmpoly(p): return {'outer': [cm(q) for q in p['outer']], 'holes': [[cm(q) for q in h] for h in p['holes']]}

data = {
    'source': 'plan.webp, 1 cm = %.3f px, origin at the outer bottom-left corner; x to the right, z down the drawing' % S,
    'height': H, 'px': S, 'origin': [OX, OY],
    'thick': [cmpoly(p) for p in polys(thick)], 'thin': [cmpoly(p) for p in polys(thin)],
    'openings': [{**o, 'quad': [cm(q) for q in o['quad']]} for o in openings],
    'floor': cmpoly(foot_poly),
    'balconies': [{'name': b['name'], 'outer': [cm(q) for q in b['outer']]} for b in BALC],
    'rails': [[cm(q) for q in r] for r in RAIL],
    'rooms': [{**r, 'at': cm(r['at']), 'outline': [cm(q) for q in r['outline']]} for r in rooms],
    'start': cm([80, 600]),
}
json.dump(data, open(OUT, 'w'), separators=(',', ':'))
print('openings', [(o['name'], o['width']) for o in openings])
print('thick', len(data['thick']), 'thin', len(data['thin']), 'bytes', os.path.getsize(OUT))
import sys
if '--debug' in sys.argv: cv2.imwrite(os.path.join(HERE, 'debug_walls.png'), 255 - (thick * 255 + thin * 120).astype(np.uint8))
