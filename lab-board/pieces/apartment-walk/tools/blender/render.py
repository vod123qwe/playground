# The 360 of a photo spot in Blender Cycles, from the viewer's export (AW.exportScene, see save_server.py).
# Run headless:
#   blender -b -P render.py -- --spot living-a --size 8192 --samples 256 --out work/living-a.png
# It imports work/apartment.glb, brings the materials up to the real finishes (materials.py), lights it with a physical sky and the sun
# by the viewer's clock, and renders an equirectangular 360 at the spot's eye on the card (OptiX), denoised with OpenImageDenoise.
import bpy, sys, os, math, argparse, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import materials

ap = argparse.ArgumentParser()
ap.add_argument('--glb', default=os.path.join(HERE, 'work', 'apartment.glb'))
ap.add_argument('--spot', default='living-a')
ap.add_argument('--size', type=int, default=2048)              # the width; the height is half
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--bounces', type=int, default=8)
ap.add_argument('--exposure', type=float, default=1.8)
ap.add_argument('--wb', type=float, default=7600)
ap.add_argument('--out', default=os.path.join(HERE, 'work', 'out.png'))
ap.add_argument('--save-blend', default='')
ap.add_argument('--plain', action='store_true')                 # keep the exported materials (a baseline)
a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
a.out = os.path.abspath(a.out)
t0 = time.time()

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a.glb)
sc = bpy.context.scene
X = {k: sc[k] for k in sc.keys()}
sun_x = X['sun']; spot = next(s for s in X['spots'] if s['id'] == a.spot)
g2b = lambda v: (v[0], -v[2], v[1])                             # glTF (y up) to Blender (z up)

for o in [o for o in bpy.data.objects if o.type == 'LIGHT']: bpy.data.objects.remove(o)
if not a.plain: materials.upgrade(X)

# ---------- the light: a physical sky with the sun in it, where the viewer's clock puts it ----------
d = g2b(list(sun_x['dir'])); el = math.asin(max(-1, min(1, d[2])))
rot = math.atan2(d[0], d[1])                                    # the sky puts its sun at azimuth 90 deg - rotation (measured against a marker)
w = bpy.data.worlds.new('sky'); sc.world = w; w.use_nodes = True
N, L = w.node_tree.nodes, w.node_tree.links; N.clear()
sky = N.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'; sky.sun_disc = True
sky.sun_elevation = max(el, math.radians(.5)); sky.sun_rotation = rot; sky.altitude = 250; sky.air_density = 1; sky.aerosol_density = 1.2
bg = N.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1
# the camera sees the view out of the windows (the generic panorama, as in the viewer), the light comes from the sky
view = bpy.data.images.load(os.path.join(HERE, '..', '..', 'assets', 'view.jpg'))
tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value[2] = X.get('viewRotY', math.pi / 2)
env = N.new('ShaderNodeTexEnvironment'); env.image = view
bgv = N.new('ShaderNodeBackground'); bgv.inputs['Strength'].default_value = 6
lp = N.new('ShaderNodeLightPath'); mix = N.new('ShaderNodeMixShader'); out = N.new('ShaderNodeOutputWorld')
L.new(sky.outputs[0], bg.inputs[0]); L.new(tc.outputs['Generated'], mp.inputs[0]); L.new(mp.outputs[0], env.inputs[0]); L.new(env.outputs[0], bgv.inputs[0])
L.new(lp.outputs['Is Camera Ray'], mix.inputs[0]); L.new(bg.outputs[0], mix.inputs[1]); L.new(bgv.outputs[0], mix.inputs[2]); L.new(mix.outputs[0], out.inputs[0])

# ---------- the camera: equirectangular, at the spot's eye, the image's centre where the viewer's is ----------
cd = bpy.data.cameras.new('pano'); cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
cam = bpy.data.objects.new('pano', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = g2b(spot['eye']); cam.rotation_euler = (math.pi / 2, 0, -math.pi / 2)

# ---------- Cycles on the card ----------
sc.render.engine = 'CYCLES'
pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'OPTIX'; pr.refresh_devices()
for dv in pr.devices: dv.use = dv.type == 'OPTIX'
cy = sc.cycles; cy.device = 'GPU'; cy.samples = a.samples; cy.use_adaptive_sampling = True; cy.adaptive_threshold = .01
cy.max_bounces = a.bounces; cy.diffuse_bounces = a.bounces; cy.glossy_bounces = 6; cy.transmission_bounces = 12; cy.transparent_max_bounces = 16
cy.sample_clamp_indirect = 10; cy.caustics_reflective = False; cy.caustics_refractive = False; cy.blur_glossy = .5
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'; cy.denoising_prefilter = 'ACCURATE'; cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'; cy.denoising_use_gpu = True
try: cy.denoising_quality = 'HIGH'
except Exception: pass
cy.use_light_tree = True
sc.render.resolution_x = a.size; sc.render.resolution_y = a.size // 2; sc.render.resolution_percentage = 100
sc.render.use_persistent_data = True
vs = sc.view_settings
try: vs.view_transform = 'AgX'; vs.look = 'AgX - Base Contrast'
except Exception as e: print('view transform', e)
vs.exposure = a.exposure
vs.use_white_balance = True; vs.white_balance_temperature = a.wb   # above 6500 K: daylight a touch warm, as the viewer
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_depth = '8'
sc.render.filepath = a.out
if a.save_blend: bpy.ops.wm.save_as_mainfile(filepath=a.save_blend)
print('SETUP', round(time.time() - t0, 1), 's; sun el', round(math.degrees(el), 1), 'rot', round(math.degrees(rot), 1))
t1 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER', round(time.time() - t1, 1), 's ->', a.out)
