# Fetches the Poly Haven scans (CC0) that materials.py lays on, 4K JPG: colour, normal (GL) and roughness, into tex/<id>/ (git-ignored).
# Run: python get_textures.py
import json, os, urllib.request
IDS = ['white_oak_veneer', 'wool_boucle', 'velour_velvet', 'rough_linen', 'hessian_230', 'painted_plaster_wall']
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'lab-board/1.0'}))
for i in IDS:
    files = json.load(get(f'https://api.polyhaven.com/files/{i}'))
    os.makedirs(os.path.join(OUT, i), exist_ok=True)
    for kind in ('Diffuse', 'nor_gl', 'Rough'):
        k = next((k for k in files if k.lower() == kind.lower()), None)
        if not k: continue
        url = files[k]['4k']['jpg']['url']; dst = os.path.join(OUT, i, os.path.basename(url))
        if not os.path.exists(dst):
            with open(dst, 'wb') as f: f.write(get(url).read())
        print(i, kind, os.path.getsize(dst) // 1000, 'kB')
