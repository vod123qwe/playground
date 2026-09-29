# The 360 of a photo spot in Blender Cycles, from the viewer's export (AW.exportScene, see save_server.py).
# Run headless:
#   blender -b -P render.py -- --spot living-a --time 690 --cube work/living-a/t690 --face 4096 --samples 256
#   blender -b -P render.py -- --spot living-a --size 8192 --out work/living-a.png            (one equirectangular 360)
#   blender -b -P render.py -- --spot kitchen-a --persp 127.6,-12,95 --back 1.6 --out work/k.png   (a still, to check things)
# It imports work/apartment.glb, brings the materials up to the real finishes (materials.py), lights it with a physical sky and the sun
# at a clock time (the export carries the sun for each time the 360s are made at), switches the lamps on after sunset, and renders on
# the card (OptiX), denoised with OpenImageDenoise. --cube renders the six faces of a cube (90 degrees each, px nx py ny pz nz in the
# viewer's axes) for the tiled 360 (tile.py cuts them).
import bpy, sys, os, math, argparse, time
from mathutils import Matrix, Vector
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import materials

ap = argparse.ArgumentParser()
ap.add_argument('--glb', default=os.path.join(HERE, 'work', 'apartment.glb'))
ap.add_argument('--spot', default='living-a')
ap.add_argument('--time', type=int, default=0)                   # minutes after midnight (one of the export's suns); 0: the export's own
ap.add_argument('--size', type=int, default=2048)              # the equirectangular width; the height is half
ap.add_argument('--cube', default='')                           # a folder: the six cube faces go there as <face>.png
ap.add_argument('--face', type=int, default=4096)
ap.add_argument('--samples', type=int, default=256)
ap.add_argument('--bounces', type=int, default=8)
ap.add_argument('--exposure', type=float, default=None)         # default: by the light (day, golden hour, dusk)
ap.add_argument('--wb', type=float, default=6700)
ap.add_argument('--out', default=os.path.join(HERE, 'work', 'out.png'))
ap.add_argument('--save-blend', default='')
ap.add_argument('--plain', action='store_true')                 # keep the exported materials (a baseline)
ap.add_argument('--persp', default='')                          # 'yaw,pitch,fov' in degrees: a still from the spot's eye instead of the 360
ap.add_argument('--res', default='1920x1080')                   # the still's size
ap.add_argument('--back', type=float, default=0)                 # the still's camera this many metres back from the spot, along the view
ap.add_argument('--lamps', default='auto')                      # on | off | auto (on when the sun is under the horizon)
a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
a.out = os.path.abspath(a.out)
t0 = time.time()

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a.glb)
sc = bpy.context.scene
X = {k: sc[k] for k in sc.keys()}
sun_x = X['sun'] if not a.time else X['suns'][str(a.time)]
spot = next(s for s in X['spots'] if s['id'] == a.spot)
g2b = lambda v: Vector((v[0], -v[2], v[1]))                     # glTF (y up) to Blender (z up)

d = g2b(list(sun_x['dir'])).normalized(); el = math.asin(max(-1, min(1, d[2])))
lamps = a.lamps == 'on' or (a.lamps == 'auto' and el < math.radians(2))
for o in [o for o in bpy.data.objects if o.type == 'LIGHT']: bpy.data.objects.remove(o)
if not a.plain: materials.upgrade(X, lamps=lamps)

# ---------- the light: a physical sky with the sun in it, where the clock puts it ----------
day = min(1, max(0, (math.degrees(el) + 6) / 14))                 # 0 in the dusk (6 under the horizon), 1 from 8 up
rot = math.atan2(d[0], d[1])                                    # the sky puts its sun at azimuth 90 deg - rotation (measured against a marker)
w = bpy.data.worlds.new('sky'); sc.world = w; w.use_nodes = True
N, L = w.node_tree.nodes, w.node_tree.links; N.clear()
sky = N.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'; sky.sun_disc = el > 0
sky.sun_elevation = el; sky.sun_rotation = rot; sky.altitude = 250; sky.air_density = 1; sky.aerosol_density = 1.2
bg = N.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1
# the camera sees the view out of the windows (the generic panorama, as in the viewer), dimmed with the day; the light comes from the sky
view = bpy.data.images.load(os.path.join(HERE, '..', '..', 'assets', 'view.jpg'))
tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value[2] = X.get('viewRotY', math.pi / 2)
env = N.new('ShaderNodeTexEnvironment'); env.image = view
tint = N.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs['Factor'].default_value = 1 - day
tint.inputs['B'].default_value = (.35, .45, .75, 1)             # the dusk turns the view blue
bgv = N.new('ShaderNodeBackground'); bgv.inputs['Strength'].default_value = 6 * (.06 + .94 * day ** 1.5)
lp = N.new('ShaderNodeLightPath'); mix = N.new('ShaderNodeMixShader'); out = N.new('ShaderNodeOutputWorld')
L.new(sky.outputs[0], bg.inputs[0]); L.new(tc.outputs['Generated'], mp.inputs[0]); L.new(mp.outputs[0], env.inputs[0])
L.new(env.outputs[0], tint.inputs['A']); L.new(tint.outputs['Result'], bgv.inputs[0])
L.new(lp.outputs['Is Camera Ray'], mix.inputs[0]); L.new(bg.outputs[0], mix.inputs[1]); L.new(bgv.outputs[0], mix.inputs[2]); L.new(mix.outputs[0], out.inputs[0])

# ---------- the camera at the spot's eye ----------
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
eye = g2b(spot['eye']); cam.location = eye
if a.persp:                                                     # yaw 0 looks along +x (as the 360's centre), counter-clockwise from above
    yaw, pitch, fov = map(float, a.persp.split(',')); cd.type = 'PERSP'; cd.lens_unit = 'FOV'; cd.angle = math.radians(fov)
    cam.rotation_euler = (math.pi / 2 + math.radians(pitch), 0, -math.pi / 2 + math.radians(yaw))
    th = math.radians(yaw); cam.location = (eye[0] - math.cos(th) * a.back, eye[1] - math.sin(th) * a.back, eye[2])
elif not a.cube:
    cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'; cam.rotation_euler = (math.pi / 2, 0, -math.pi / 2)

# ---------- Cycles on the card ----------
sc.render.engine = 'CYCLES'
pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'OPTIX'; pr.refresh_devices()
for dv in pr.devices: dv.use = dv.type == 'OPTIX'
cy = sc.cycles; cy.device = 'GPU'; cy.samples = a.samples * (2 if lamps else 1); cy.use_adaptive_sampling = True; cy.adaptive_threshold = .008
cy.max_bounces = a.bounces; cy.diffuse_bounces = a.bounces; cy.glossy_bounces = 6; cy.transmission_bounces = 12; cy.transparent_max_bounces = 16
cy.sample_clamp_indirect = 10; cy.caustics_reflective = False; cy.caustics_refractive = False; cy.blur_glossy = .5
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'; cy.denoising_prefilter = 'ACCURATE'; cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'; cy.denoising_use_gpu = True
try: cy.denoising_quality = 'HIGH'
except Exception: pass
cy.use_light_tree = True
sc.render.use_persistent_data = True
vs = sc.view_settings
try: vs.view_transform = 'AgX'; vs.look = 'AgX - Base Contrast'
except Exception as e: print('view transform', e)
# the exposure follows the light as an eye would: the day as set, a little up in the golden hour, well up in the dusk (the lamps carry it)
low = 1 - min(1, max(0, (math.degrees(el) - 2) / 18))            # 1 with the sun low, 0 from 20 up
vs.exposure = a.exposure if a.exposure is not None else (.8 if lamps else .15 + 3.3 * low)
vs.use_white_balance = True; vs.white_balance_temperature = a.wb + (0 if lamps else 3400 * low)   # the golden hour warmer (higher = warmer here)
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_depth = '8'
if a.save_blend: bpy.ops.wm.save_as_mainfile(filepath=a.save_blend)
print('SETUP', round(time.time() - t0, 1), 's; sun el', round(math.degrees(el), 1), 'rot', round(math.degrees(rot), 1), 'lamps', lamps, 'exposure', round(vs.exposure, 2))

def shoot(path):
    sc.render.filepath = path; t1 = time.time(); bpy.ops.render.render(write_still=True); print('RENDER', round(time.time() - t1, 1), 's ->', path, flush=True)

if a.cube:
    # the faces in the viewer's axes (x, y up, z): forward and up; seen from inside, the image's right is forward x up
    FACES = {'px': ((1, 0, 0), (0, 1, 0)), 'nx': ((-1, 0, 0), (0, 1, 0)), 'pz': ((0, 0, 1), (0, 1, 0)), 'nz': ((0, 0, -1), (0, 1, 0)),
             'py': ((0, 1, 0), (0, 0, 1)), 'ny': ((0, -1, 0), (0, 0, -1))}
    cd.type = 'PERSP'; cd.lens_unit = 'FOV'; cd.sensor_fit = 'HORIZONTAL'; cd.angle = math.pi / 2
    sc.render.resolution_x = sc.render.resolution_y = a.face; sc.render.resolution_percentage = 100
    os.makedirs(a.cube, exist_ok=True)
    for f, (fw, up) in FACES.items():
        F, U = g2b(fw), g2b(up); R = F.cross(U)
        cam.matrix_world = Matrix.Translation(eye) @ Matrix(((R[0], U[0], -F[0]), (R[1], U[1], -F[1]), (R[2], U[2], -F[2]))).to_4x4()
        shoot(os.path.join(os.path.abspath(a.cube), f + '.png'))
else:
    sc.render.resolution_x = a.size; sc.render.resolution_y = a.size // 2; sc.render.resolution_percentage = 100
    if a.persp: sc.render.resolution_x, sc.render.resolution_y = map(int, a.res.split('x'))
    shoot(a.out)
print('DONE', round(time.time() - t0, 1), 's')
