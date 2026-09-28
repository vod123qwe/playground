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
DOOR = 208                     # the head of an inner door opening: leaf 203.7 cm + the frame (Porta Vector, bezprzylgowe 80)
OX, OY = 132, 1639             # the origin: the outer bottom-left corner of the flat

im = cv2.imread(IMG, 0)
dark = (im < 110).astype(np.uint8)
walls = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))   # (the rounded corners it leaves are squared again in regularize)
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

# the building has four directions: the drawing's axes and the two of the long facade (52.2 deg) and the kitchen wall (-37.8 deg)
DIRS = [0.0, 90.0, float(np.degrees(np.arctan2(0.7902, 0.6128))), float(np.degrees(np.arctan2(-0.6128, 0.7902))) % 180]
def regularize(c):
    """a contour as straight edges along the building's directions, with sharp corners (no pixel steps, no rounded corners)"""
    c = c[:, 0, :].astype(float)
    ap = cv2.approxPolyDP(c.astype(np.int32), 1.5, True)[:, 0, :].astype(float)
    if len(ap) < 3: return ap.tolist()
    idx, j = [], 0
    for q in ap:                                   # where each vertex sits on the contour
        k = np.where((c[:, 0] == q[0]) & (c[:, 1] == q[1]))[0]
        idx.append(int(k[0]) if len(k) else j); j = idx[-1]
    lines = []
    n = len(ap)
    for k in range(n):
        a, b = ap[k], ap[(k + 1) % n]; d = b - a; L = float(np.hypot(*d))
        i0, i1 = idx[k], idx[(k + 1) % n]
        seg = c[i0:i1 + 1] if i1 >= i0 else np.vstack([c[i0:], c[:i1 + 1]])
        ang = float(np.degrees(np.arctan2(d[1], d[0]))) % 180
        best = min(DIRS, key=lambda D: min(abs(ang - D), 180 - abs(ang - D)))
        snapped = min(abs(ang - best), 180 - abs(ang - best)) < 10 and L >= 3
        if snapped:
            u = np.array([np.cos(np.radians(best)), np.sin(np.radians(best))])
            if u @ d < 0: u = -u
        else: u = d / max(L, 1e-6)
        nr = np.array([-u[1], u[0]])
        off = float(np.mean(seg @ nr)) if snapped else float(a @ nr)
        lines.append([u, off, L, snapped, a])
    changed = True
    while changed and len(lines) > 3:              # join neighbours that are the same line; drop tiny corner cuts
        changed = False
        for k in range(len(lines)):
            A_, B_ = lines[k], lines[(k + 1) % len(lines)]
            # one straight face drawn with a small step (a drawing artefact under 3 px = 2.5 cm, or a 1-3 degree kink): make it one line
            # (the longer piece is the wall: the short ones are where a radiator, a label or a line of the drawing stuck to it)
            if A_[0] @ B_[0] > .9985 and abs(A_[1] - B_[1]) < 4.5:
                if B_[2] > A_[2]: A_[1] = B_[1]
                A_[2] = A_[2] + B_[2]; lines.pop((k + 1) % len(lines)); changed = True; break
        if changed: continue
        for k in range(len(lines)):
            P_, C_, N_ = lines[k - 1], lines[k], lines[(k + 1) % len(lines)]
            if C_[2] < (12 if not C_[3] else 6) and abs(P_[0][0] * N_[0][1] - P_[0][1] * N_[0][0]) > .2:   # a short cut between two walls meeting at an angle: a rounded or ragged corner
                lines.pop(k); changed = True; break
            if C_[2] < 10 and P_[0] @ N_[0] > .9985 and abs(P_[1] - N_[1]) < 4.5:   # a nick between two pieces of the same face: drop it, the two then join
                lines.pop(k); changed = True; break
    out = []
    for k in range(len(lines)):
        P_, C_ = lines[k - 1], lines[k]
        n1, n2 = np.array([-P_[0][1], P_[0][0]]), np.array([-C_[0][1], C_[0][0]])
        det = n1[0] * n2[1] - n1[1] * n2[0]
        if abs(det) < 1e-3:                        # a step between two parallel lines: a square connector
            q = C_[4]; out.append((q - n1 * (q @ n1 - P_[1])).tolist()); out.append((q - n2 * (q @ n2 - C_[1])).tolist())
        else:
            x = (P_[1] * n2[1] - C_[1] * n1[1]) / det; y = (n1[0] * C_[1] - n2[0] * P_[1]) / det
            out.append([float(x), float(y)])
    clean = []                                     # no zero-length edges left behind by the corners
    for q in out:
        if not clean or np.hypot(q[0] - clean[-1][0], q[1] - clean[-1][1]) > 1.0: clean.append(q)
    if len(clean) > 3 and np.hypot(clean[0][0] - clean[-1][0], clean[0][1] - clean[-1][1]) <= 1.0: clean.pop()
    return clean

def reg_polys(mask, min_area=60):
    cs, hier = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for i, c in enumerate(cs):
        if hier[0][i][3] != -1 or cv2.contourArea(c) < min_area: continue
        holes, j = [], hier[0][i][2]
        while j != -1:
            if cv2.contourArea(cs[j]) >= min_area: holes.append(regularize(cs[j]))
            j = hier[0][j][0]
        out.append({'outer': regularize(c), 'holes': holes})
    return out
WALLS = reg_polys(walls)
EDGES = []                                         # every straight wall face, for flush lintels and sills
for p in WALLS:
    for ring in [p['outer']] + p['holes']:
        for k in range(len(ring)):
            EDGES.append((np.array(ring[k]), np.array(ring[(k + 1) % len(ring)])))

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

def wall_band(p0, u, t0, t1, half):
    """the faces of the wall on both sides of an opening (from the straightened outlines), so a lintel or a sill is flush with them"""
    uu = np.array(u) / np.hypot(*u); nr = np.array([-uu[1], uu[0]]); p0a = np.array(p0, float)
    neg, pos = [], []
    for a, b in EDGES:
        d = b - a; L = np.hypot(*d)
        if L < 3 or abs((d / L) @ nr) > .02: continue          # only faces along the wall
        ta, tb = sorted([(a - p0a) @ uu, (b - p0a) @ uu]); o = (a - p0a) @ nr
        if abs(o) > half + 16: continue
        if (ta < t0 + 1 and tb > t0 - 20) or (ta < t1 + 20 and tb > t1 - 1): (neg if o < 0 else pos).append(o)
    if neg and pos: return float(np.median(neg)), float(np.median(pos))
    return wall_band_px(p0, u, t0, t1, half)

def wall_band_px(p0, u, t0, t1, half):
    u = np.array(u) / np.hypot(*u); nrm = np.array([-u[1], u[0]])
    ys, xs = np.nonzero(walls)
    d = np.column_stack([xs - p0[0], ys - p0[1]]).astype(float)
    t, o = d @ u, d @ nrm
    lo, hi = [], []
    for tt in list(range(int(t0) - 14, int(t0))) + list(range(int(t1) + 1, int(t1) + 15)):   # slice by slice, so a wall meeting at a corner does not count
        m = (np.abs(o) < half + 16) & (np.abs(t - tt) < .5)
        if m.sum() > 3: lo.append(o[m].min()); hi.append(o[m].max())
    if len(lo) < 6: return -half, half
    return float(np.median(lo)) - .5, float(np.median(hi)) + .5

openings = []
def add(kind, p0, u, t0, t1, half, sill, head, name, door=None):
    o0, o1 = wall_band(p0, u, t0, t1, half)
    op = {'kind': kind, 'name': name, 'quad': gap_quad(p0, u, t0 - 2, t1 + 2, o0, o1), 'sill': sill, 'head': head, 'glazed': kind == 'window' or 'balcony' in name,
          'width': round((t1 - t0) / S), 'panes': 3 if (t1 - t0) / S >= 250 else 2 if (t1 - t0) / S > 150 else 1}
    if door:                                       # the leaf: its hinge, the way it closes, the side it opens to (from the arcs on the drawing)
        hinge_end, side, hidden = door
        uu = np.array(u) / np.hypot(*u); nrm = np.array([-uu[1], uu[0]])
        a, b = (t0, t1) if hinge_end == 0 else (t1, t0)
        op['door'] = {'hinge': pt(p0, u, a, (o0 + o1) / 2), 'to': pt(p0, u, b, (o0 + o1) / 2), 'side': (nrm * side).tolist(),
                      'half': (o1 - o0) / 2 / S, 'hidden': hidden, 'front': 'front' in name}
    openings.append(op)

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
for t0, t1 in gaps((18, 0), (0, 1), 13, 480, 690): add('door', (18, 0), (0, 1), t0, t1, 14, 0, 210, 'front door 90', (1, -1, False))
# inner doors
# (hinge at the start 0 / the end 1 of the gap, opens to +1 / -1 of the line's normal, hidden in the wall)
inner = [((0, 911), (1, 0), 13, 160, 600, ['pantry'], [(0, -1, True)]),
         ((614, 0), (0, 1), 6, 930, 1330, ['laundry', 'bedroom 1'], [(0, -1, True), (0, 1, False)]),
         ((0, 1338), (1, 0), 6, 625, 950, ['bathroom'], [(0, -1, False)]),
         ((781, 0), (0, 1), 6, 930, 1180, ['bedroom 3'], [(0, -1, False)]),
         ((858, 0), (0, 1), 5, 1202, 1330, ['bedroom 2'], [(0, -1, False)])]
for p0, u, half, lo, hi, names, specs in inner:
    g = gaps(p0, u, half, lo, hi); print(names, g)
    for (t0, t1), nm, sp in zip(g, names, specs): add('door', p0, u, t0, t1, half + 2, 0, DOOR, 'door ' + nm, sp)

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
foot_poly = max(reg_polys(foot), key=lambda p: cv2.contourArea(np.array(p['outer'], np.float32)))   # straightened too, so the slabs meet the wall faces

# the floor of the rooms stops under the frame of every balcony door and window (on the line of the glass) and under the front door;
# the outer half of such an opening is a threshold, not the floor of the room
SILLS = []
inner_floor = foot.copy()
for op in openings:
    if not (op['glazed'] or 'front' in op['name']): continue
    q = np.array(op['quad']); m0, m1 = (q[0] + q[1]) / 2, (q[3] + q[2]) / 2
    def outside(pnt): x, y = int(round(pnt[0])), int(round(pnt[1])); return not (0 <= y < foot.shape[0] and 0 <= x < foot.shape[1]) or not foot[y, x]
    o0_out = outside(m0 + (m0 - m1) * .6)                              # which face of the wall looks out
    mid_a, mid_b = (q[0] + q[3]) / 2, (q[1] + q[2]) / 2
    outer = [q[0].tolist(), q[1].tolist(), mid_b.tolist(), mid_a.tolist()] if o0_out else [q[3].tolist(), q[2].tolist(), mid_b.tolist(), mid_a.tolist()]
    SILLS.append({'name': op['name'], 'outer': outer, 'holes': []})
    cv2.fillPoly(inner_floor, [np.round(np.array(outer)).astype(np.int32)], 0)
floor_in = max(reg_polys(inner_floor), key=lambda p: cv2.contourArea(np.array(p['outer'], np.float32)))

# rooms: flood from a seed with all doors closed; the hall and the living room split along the passage
rooms_mask = closed.copy()
cv2.line(rooms_mask, (621, 911), (778, 911), 1, 2)
ROOMS = [('Living + kitchen', (520, 560)), ('Bedroom', (380, 1380)), ('Bedroom', (1200, 1420)), ('Bedroom', (1000, 1050)),
         ('Bathroom', (800, 1450)), ('Laundry', (530, 960)), ('Pantry', (300, 1010)), ('Hall', (700, 1100))]
rooms = []
for name, (x, y) in ROOMS:
    ff = rooms_mask.copy(); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, msk, (x, y), 3)
    a = int((ff == 3).sum()) / S / S / 1e4
    cs, _ = cv2.findContours((ff == 3).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = cv2.approxPolyDP(max(cs, key=cv2.contourArea), 2.0, True)[:, 0, :].tolist()
    rooms.append({'name': name, 'at': [x, y], 'area': round(a, 1), 'outline': out})
    print(name, round(a, 2), 'm2')

# ---------- floor finishes, after the interior layout (sheet A.04) ----------
# laminate EGGER Herringbone EL2152 Dąb Casella naturalny: kitchen, living room, corridor, the three rooms (everywhere else)
# tiles Ceramika Gres Granby Beige 60x60: the entrance, the laundry, the pantry; Domino Bihara Beige 60x60: the bathroom
def zone(mask):
    m = cv2.dilate((mask > 0).astype(np.uint8), np.ones((5, 5), np.uint8))    # tucked 2 px under the walls, so no wood shows at the edge
    for k in SILLS: cv2.fillPoly(m, [np.round(np.array(k['outer'])).astype(np.int32)], 0)   # and not out over a threshold
    ps = reg_polys(m)
    return max(ps, key=lambda q: cv2.contourArea(np.array(q['outer'], np.float32)))
def room_mask(x, y):
    ff = rooms_mask.copy(); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8); cv2.floodFill(ff, msk, (x, y), 3); return (ff == 3)
entrance = np.zeros_like(foot); cv2.rectangle(entrance, (0, 470), (227, 898), 1, -1)   # zone A: from the front door to the wardrobe front (A.04)
entrance = entrance & foot & (1 - walls)
FLOORS = [{'finish': 'granby', 'name': 'Ceramika Gres Granby Beige 60x60', 'zones': [zone(entrance), zone(room_mask(530, 960)), zone(room_mask(300, 1010))]},
          {'finish': 'bihara', 'name': 'Domino Bihara Beige 60x60', 'zones': [zone(room_mask(800, 1450))]}]
print('tile zones', [(f['finish'], [round(cv2.contourArea(np.array(z['outer'], np.float32)) / S / S / 1e4, 2) for z in f['zones']]) for f in FLOORS])

# ---------- skirting: white, in every room but the laundry, the pantry and the bathroom ----------
# it stops at a door's architrave (4.5 cm past the opening), at the reveal of a window or balcony door, at a hidden door and at the
# open passage between the hall and the living room; at a corner it runs on by its own thickness, so two runs close the corner
NO_SKIRT = {'Laundry', 'Pantry', 'Bathroom'}
SK_T = 1.6 * S
PASSAGE = (np.array([621.0, 911.0]), np.array([778.0, 911.0]))
SKIRT = []
allowed = np.zeros_like(walls)                     # where skirting belongs: the rooms that have it (doors and the passage closed)
for name, (x, y) in ROOMS:
    if name not in NO_SKIRT: allowed |= room_mask(x, y).astype(np.uint8)
def room_of(q):
    for name, (x, y) in ROOMS:
        if name not in NO_SKIRT and room_mask_cache[name][int(round(q[1])), int(round(q[0]))]: return name
    return None
room_mask_cache = {name: room_mask(x, y) for name, (x, y) in ROOMS if name not in NO_SKIRT}
for wp in WALLS:
    for ring in [wp['outer']] + wp['holes']:
        ring = np.array(ring)
        for k in range(len(ring)):
            a, b = ring[k], ring[(k + 1) % len(ring)]; L = float(np.hypot(*(b - a)))
            if L < 3: continue
            d = (b - a) / L; nrm = np.array([-d[1], d[0]]); mid = (a + b) / 2
            probe = mid + nrm * 3
            out = nrm if not walls[int(np.clip(probe[1], 0, walls.shape[0] - 1)), int(np.clip(probe[0], 0, walls.shape[1] - 1))] else -nrm   # the room side of this face
            cuts = []
            for op in openings:
                q = np.array(op['quad']); off = (q - a) @ nrm
                if off.min() > 3 or off.max() < -3: continue
                t = (q - a) @ d; ext = 0 if op['glazed'] or (op.get('door') or {}).get('hidden') else 4.5 * S
                cuts.append((t.min() + 2 - ext, t.max() - 2 + ext))
            ok = []                                     # sample the face every pixel: is the room in front of it one with skirting?
            for i in range(int(L) + 1):
                t = min(i, L); q = a + d * t + out * 4
                inside = allowed[int(np.clip(round(q[1]), 0, allowed.shape[0] - 1)), int(np.clip(round(q[0]), 0, allowed.shape[1] - 1))]
                ok.append(bool(inside) and not any(c0 <= t <= c1 for c0, c1 in cuts))
            def ext_at(dA, dB):                         # at a corner sticking out into the room: on, into a mitre; inside corner: stop
                turn = dA[0] * dB[1] - dA[1] * dB[0]; side = dA[0] * out[1] - dA[1] * out[0]
                if turn * side > 0: return 0.0
                beta = np.arccos(np.clip(dA @ dB, -1, 1)); return SK_T * np.tan(beta / 2)
            pv, nx_ = ring[k - 1], ring[(k + 2) % len(ring)]
            e0 = ext_at((a - pv) / max(np.hypot(*(a - pv)), 1e-6), d); e1 = ext_at(d, (nx_ - b) / max(np.hypot(*(nx_ - b)), 1e-6))
            i = 0
            while i < len(ok):
                if not ok[i]: i += 1; continue
                j = i
                while j + 1 < len(ok) and ok[j + 1]: j += 1
                t0, t1 = float(i), float(min(j, L))
                if i == 0: t0 -= e0
                if j >= len(ok) - 1: t1 += e1
                if t1 - t0 >= 4:
                    SKIRT.append({'a': (a + d * t0).tolist(), 'b': (a + d * t1).tolist(), 'in': out.tolist(), 'room': room_of(a + d * ((t0 + t1) / 2) + out * 4) or ''})
                i = j + 1
# under a window with a parapet the skirting runs on, along the face of the parapet (the wall pieces beside it reach it through their corner)
for op in openings:
    if op['sill'] <= 0: continue
    q = np.array(op['quad']); m0, m1 = (q[0] + q[1]) / 2, (q[3] + q[2]) / 2
    x, y = [int(round(v)) for v in m0 + (m0 - m1) * .6]
    o0_out = not (0 <= y < foot.shape[0] and 0 <= x < foot.shape[1]) or not foot[y, x]
    a, b = (q[3], q[2]) if o0_out else (q[0], q[1])                   # the room-side face of the parapet
    inn = (m1 - m0) if o0_out else (m0 - m1); inn = inn / np.hypot(*inn)
    d = (b - a) / np.hypot(*(b - a))
    SKIRT.append({'a': (a - d * 2).tolist(), 'b': (b + d * 2).tolist(), 'in': inn.tolist(), 'room': room_of((a + b) / 2 + inn * 4) or ''})   # into the neighbours a little: no seam
print('skirting', len(SKIRT), 'pieces,', round(sum(np.hypot(s['b'][0] - s['a'][0], s['b'][1] - s['a'][1]) for s in SKIRT) / S / 100, 1), 'm')

# ---------- the kitchen (concept M48 on the layout A.04): the run along the kitchen wall, the island 180 x 80 where A.04 puts it ----------
def kitchen_wall():
    best = None
    for p in WALLS:
        ring = np.array(p['outer'])
        for k in range(len(ring)):
            a, b = ring[k], ring[(k + 1) % len(ring)]; d = b - a; L = np.hypot(*d)
            if abs(L / S - 390) < 12 and abs(np.degrees(np.arctan2(d[1], d[0])) + 37.8) < 1.5 and (best is None or L > best[2]): best = (a, b, L)
    return best
ka, kb, kl = kitchen_wall()
kd = (kb - ka) / kl; kn = np.array([.6128, .7902])                  # along the run, and into the room
A04 = lambda ox, oy: np.array([OX + (ox - 316) / 1.181 * S, OY + (oy - 1610) / 1.181 * S])   # sheet A.04 (150 dpi, 1:50) -> plan px
isl = [A04(635, 490), A04(804, 362), A04(861, 436), A04(692.5, 565)]  # the island's corners on A.04
ic = np.mean(isl, axis=0)
print('kitchen run', round(kl / S, 1), 'cm; island centre', [round(v, 1) for v in (ic - [OX, OY]) / S], 'off the wall', round(float((ic - ka) @ kn) / S, 1), 'cm, along', round(float((ic - ka) @ kd) / S, 1))

BALC = [
    {'name': 'Balcony', 'outer': [pt(P2, U, -435, -27), pt(P2, U, -435, -208), pt(P2, U, 230, -208), pt(P2, U, 230, -27)]},
    # the side of the big balcony stands on the pier, 25 cm clear of the bedroom window (on the drawing it touches the window's edge)
    {'name': 'Balcony', 'outer': [pt(P2, U, 694, -27), pt(P2, U, 694, -208), [1968, 1452], [1505, 1820], [930, 1820], [930, 1639], [1440, 1639], [1690, 1445]]},
    {'name': 'Balcony', 'outer': [[181, 1639], [181, 1820], [651, 1820], [651, 1639]]},   # the left side on the corner pier, 25 cm clear of the window
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
    'walls': [cmpoly(p) for p in WALLS],                     # the geometry: one straightened outline per wall, so the faces run through
    'thick': [cmpoly(p) for p in polys(thick)], 'thin': [cmpoly(p) for p in polys(thin)],   # only for the cut surfaces (black / grey)
    'openings': [{**o, 'quad': [cm(q) for q in o['quad']], **({'door': {**o['door'], 'hinge': cm(o['door']['hinge']), 'to': cm(o['door']['to'])}} if 'door' in o else {})} for o in openings],
    'floor': cmpoly(foot_poly),
    'floorIn': cmpoly(floor_in),                                   # the rooms' floor: stops on the glass line of the balcony doors and at the front door
    'sills': [{'name': k['name'], 'outer': [cm(q) for q in k['outer']], 'holes': []} for k in SILLS],
    'finishes': {'base': 'EGGER Herringbone EL2152 Dąb Casella naturalny, 840 x 168 x 8 mm, 4V',
                 'tiles': [{'finish': f['finish'], 'name': f['name'], 'zones': [cmpoly(z) for z in f['zones']]} for f in FLOORS]},
    'balconies': [{'name': b['name'], 'outer': [cm(q) for q in b['outer']]} for b in BALC],
    'rails': [[cm(q) for q in r] for r in RAIL],
    'rooms': [{**r, 'at': cm(r['at']), 'outline': [cm(q) for q in r['outline']]} for r in rooms],
    'skirting': [{'a': cm(k['a']), 'b': cm(k['b']), 'in': [round(k['in'][0], 4), round(k['in'][1], 4)], 'room': k['room']} for k in SKIRT],
    'start': cm([80, 600]),
    'kitchen': {'a': cm(ka.tolist()), 'd': kd.round(5).tolist(), 'n': kn.tolist(), 'len': round(kl / S, 1),
                'island': {'c': cm(ic.tolist()), 'off': round(float((ic - ka) @ kn) / S, 1), 'along': round(float((ic - ka) @ kd) / S, 1), 'w': 180, 'd': 80}},
}
json.dump(data, open(OUT, 'w'), separators=(',', ':'))
print('openings', [(o['name'], o['width']) for o in openings])
print('walls', len(data['walls']), sum(len(p['outer']) for p in data['walls']), 'vertices; thick', len(data['thick']), 'thin', len(data['thin']), 'bytes', os.path.getsize(OUT))
import sys
if '--debug' in sys.argv:
    dbg = cv2.cvtColor(255 - (thick * 200 + thin * 90).astype(np.uint8), cv2.COLOR_GRAY2BGR)
    for p in WALLS:
        for ring in [p['outer']] + p['holes']: cv2.polylines(dbg, [np.round(np.array(ring) * 4).astype(np.int32)], True, (0, 0, 255), 1, cv2.LINE_AA, 2)
    cv2.imwrite(os.path.join(HERE, 'debug_walls.png'), dbg)
