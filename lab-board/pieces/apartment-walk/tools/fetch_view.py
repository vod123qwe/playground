"""The data for the REAL view out of the windows: terrain heights and OpenStreetMap features around a point, in local metres.

    python tools/fetch_view.py <lat> <lon>

Writes to assets/private/view-data/ (git-ignored: it would give the flat's location away): meta.json, near.f32 and far.f32
(height grids) and osm.json (buildings, land use, roads, railways, water). Nothing written there holds a latitude or a
longitude: only metres east (x) and south (z) of the point. tools/view.html?mode=real reads it and renders the panorama.

Terrain: Mapzen Terrarium tiles on AWS (open data). Map features: (c) OpenStreetMap contributors, ODbL, via Overpass.
"""
import json, math, os, struct, sys, time, urllib.request, urllib.parse, io
from PIL import Image

LAT, LON = float(sys.argv[1]), float(sys.argv[2])
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'private', 'view-data'); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'apartment-walk-view/1.0 (a personal 3D model)', 'Accept': 'application/json'}
R = 6378137.0
mx = math.cos(math.radians(LAT)) * math.pi / 180 * R          # metres per degree of longitude here
my = math.pi / 180 * R                                          # ... of latitude
loc = lambda lat, lon: ((lon - LON) * mx, -(lat - LAT) * my)    # (east, south) in metres
deg = lambda x, z: (LAT - z / my, LON + x / mx)

# ---------- terrain: Terrarium tiles, bilinear, onto two grids ----------
tiles = {}
def tile(z, x, y):
    k = (z, x, y)
    if k not in tiles:
        u = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        for _ in range(4):
            try: tiles[k] = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read())).convert('RGB'); break
            except Exception as e: print('retry', u, e); time.sleep(2)
    return tiles[k]
def height(lat, lon, z):
    n = 2 ** z; fx = (lon + 180) / 360 * n * 256; la = math.radians(lat)
    fy = (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n * 256
    x0, y0 = int(math.floor(fx - .5)), int(math.floor(fy - .5)); tx, ty = fx - .5 - x0, fy - .5 - y0
    def px(x, y):
        im = tile(z, x // 256, y // 256); r, g, b = im.getpixel((x % 256, y % 256)); return r * 256 + g + b / 256 - 32768
    return (px(x0, y0) * (1 - tx) + px(x0 + 1, y0) * tx) * (1 - ty) + (px(x0, y0 + 1) * (1 - tx) + px(x0 + 1, y0 + 1) * tx) * ty
def grid(half, n, z, name):
    a = []
    for j in range(n + 1):
        for i in range(n + 1):
            x, zz = -half + 2 * half * i / n, -half + 2 * half * j / n; la, lo = deg(x, zz); a.append(height(la, lo, z))
    with open(os.path.join(OUT, name), 'wb') as f: f.write(struct.pack(f'{len(a)}f', *a))
    return a
print('terrain near'); near = grid(1600, 320, 15, 'near.f32')      # 3.2 km, 10 m
print('terrain far'); far = grid(12000, 300, 12, 'far.f32')         # 24 km, 80 m
h0 = height(LAT, LON, 15)

# ---------- OpenStreetMap ----------
def overpass(q):
    for host in ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']:
        try:
            req = urllib.request.Request(host, data=urllib.parse.urlencode({'data': q}).encode(), headers=UA)
            return json.loads(urllib.request.urlopen(req, timeout=180).read())
        except Exception as e: print('overpass', host, e)
    raise SystemExit('Overpass did not answer')
def bbox(r): (s, w), (n, e) = deg(-r, r), deg(r, -r); return f'{s},{w},{n},{e}'
def rings(el):                                                  # outer rings, in local metres
    if el['type'] == 'way' and 'geometry' in el: return [[loc(p['lat'], p['lon']) for p in el['geometry']]]
    if el['type'] == 'relation': return [[loc(p['lat'], p['lon']) for p in m['geometry']] for m in el.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
    return []
rnd = lambda ps: [[round(x, 1), round(z, 1)] for x, z in ps]
print('osm near')
near_q = f"""[out:json][timeout:170];(
  way["building"]({bbox(1800)}); relation["building"]({bbox(1800)});
  way["highway"]({bbox(1600)}); way["railway"]({bbox(2500)});
  way["landuse"]({bbox(1800)}); relation["landuse"]({bbox(1800)});
  way["natural"~"wood|scrub|water|grassland|tree_row"]({bbox(1800)}); relation["natural"~"wood|water"]({bbox(1800)});
  way["leisure"~"park|garden|pitch|playground"]({bbox(1600)}); way["waterway"]({bbox(2500)}); node["natural"="tree"]({bbox(900)});
);out geom;"""
d = overpass(near_q)
print('osm far')
far_q = f"""[out:json][timeout:170];(
  way["landuse"~"forest|farmland|meadow|residential|industrial"]({bbox(11000)}); relation["landuse"~"forest|residential"]({bbox(11000)});
  way["natural"~"wood|water"]({bbox(11000)}); relation["natural"~"wood|water"]({bbox(11000)});
);out geom;"""
f = overpass(far_q)

out = {'buildings': [], 'areas': [], 'roads': [], 'rails': [], 'water': [], 'trees': [], 'farAreas': []}
for el in d['elements']:
    t = el.get('tags', {})
    if el['type'] == 'node':
        x, z = loc(el['lat'], el['lon']); out['trees'].append([round(x, 1), round(z, 1)]); continue
    if 'building' in t:
        for r in rings(el):
            lv = t.get('building:levels'); h = t.get('height')
            out['buildings'].append({'p': rnd(r), 'kind': t['building'], 'levels': float(lv) if lv and lv.replace('.', '', 1).isdigit() else None,
                                     'h': float(h.split()[0]) if h and h.split()[0].replace('.', '', 1).isdigit() else None, 'roof': t.get('roof:shape')})
    elif 'highway' in t and el['type'] == 'way':
        out['roads'].append({'p': rnd(rings(el)[0]), 'kind': t['highway']})
    elif 'railway' in t and el['type'] == 'way':
        out['rails'].append({'p': rnd(rings(el)[0]), 'kind': t['railway']})
    elif 'waterway' in t and el['type'] == 'way':
        out['water'].append({'line': rnd(rings(el)[0]), 'kind': t['waterway']})
    else:
        k = t.get('landuse') or t.get('natural') or t.get('leisure')
        for r in rings(el):
            if t.get('natural') == 'tree_row': out['roads'].append({'p': rnd(r), 'kind': 'tree_row'}); continue
            (out['water'] if k == 'water' else out['areas']).append({'p': rnd(r), 'kind': k})
for el in f['elements']:
    t = el.get('tags', {}); k = t.get('landuse') or t.get('natural')
    for r in rings(el):
        simp = r[::max(1, len(r) // 60)]
        out['farAreas'].append({'p': rnd(simp), 'kind': k})
json.dump(out, open(os.path.join(OUT, 'osm.json'), 'w'))
json.dump({'near': {'half': 1600, 'n': 320}, 'far': {'half': 12000, 'n': 300}, 'h0': h0,
           'note': 'local metres: x east, z south of the flat; heights in metres above sea level'}, open(os.path.join(OUT, 'meta.json'), 'w'))
print('buildings', len(out['buildings']), 'areas', len(out['areas']), 'roads', len(out['roads']), 'rails', len(out['rails']), 'far', len(out['farAreas']), 'h0', round(h0, 1))
