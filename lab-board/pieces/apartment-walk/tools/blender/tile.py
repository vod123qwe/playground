# Cuts the rendered cube faces (render.py --cube) into the tiled 360 the viewer streams: for every face a pyramid of levels, 512 px
# tiles (level 0: the face at 512, level 3: at 4096, 8 x 8 tiles), JPEG. Writes assets/spots/<spot>/t<time>/<face>/<level>/<row>_<col>.jpg
# and assets/spots/<spot>/pano.json (the times there are). Run from tools/blender: python tile.py [spot ...]
import json, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
CUBES = os.path.join(HERE, 'work', 'cubes'); SPOTS = os.path.join(HERE, '..', '..', 'assets', 'spots')
FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz']; TILE = 512
for spot in sys.argv[1:] or sorted(os.listdir(CUBES)):
    times = []
    for td in sorted(os.listdir(os.path.join(CUBES, spot))):
        src = os.path.join(CUBES, spot, td)
        if not all(os.path.exists(os.path.join(src, f + '.png')) for f in FACES): print('incomplete', spot, td); continue
        size = Image.open(os.path.join(src, 'px.png')).size[0]; levels = size.bit_length() - TILE.bit_length() + 1
        for f in FACES:
            im = Image.open(os.path.join(src, f + '.png')).convert('RGB')
            for L in range(levels):
                n = 2 ** L; lv = im if TILE * n == size else im.resize((TILE * n, TILE * n), Image.LANCZOS)
                d = os.path.join(SPOTS, spot, td, f, str(L)); os.makedirs(d, exist_ok=True)
                for r in range(n):
                    for c in range(n):
                        lv.crop((c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE)).save(os.path.join(d, f'{r}_{c}.jpg'), quality=84, optimize=True, progressive=True)
        times.append(int(td[1:])); print(spot, td, size, levels, 'levels')
    if times:
        man = {'face': size, 'tile': TILE, 'levels': levels, 'faces': FACES, 'times': sorted(times)}
        json.dump(man, open(os.path.join(SPOTS, spot, 'pano.json'), 'w'), indent=1); print(spot, man)
