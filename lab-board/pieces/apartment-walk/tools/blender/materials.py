# The exported materials brought up to the real finishes, by name (the viewer names every material after its variable, see exportScene).
# Pass 1: what the light needs: the glass as thin glass, the sheers letting the light through, the LED strip and the lamps glowing.
import bpy

def principled(m):
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m and m.use_nodes else None

def fresh(m):                                                   # an empty node tree with an output
    nt = m.node_tree; nt.nodes.clear()
    return nt, nt.nodes.new('ShaderNodeOutputMaterial')

def thin_glass(m, tint=(.93, .97, .97, 1)):                    # a pane: passes the light straight through, reflects by Fresnel; no refraction offset
    nt, out = fresh(m); N, L = nt.nodes, nt.links
    tr = N.new('ShaderNodeBsdfTransparent'); tr.inputs[0].default_value = tint
    gl = N.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = .02
    fr = N.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.5
    mx = N.new('ShaderNodeMixShader')
    L.new(fr.outputs[0], mx.inputs[0]); L.new(tr.outputs[0], mx.inputs[1]); L.new(gl.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs[0])

def sheer(m, color=(.97, .96, .93, 1), through=.55):             # voile: part of the light straight through, part scattered (translucent)
    nt, out = fresh(m); N, L = nt.nodes, nt.links
    tr = N.new('ShaderNodeBsdfTransparent'); tl = N.new('ShaderNodeBsdfTranslucent'); tl.inputs[0].default_value = color
    df = N.new('ShaderNodeBsdfDiffuse'); df.inputs[0].default_value = color
    a = N.new('ShaderNodeMixShader'); a.inputs[0].default_value = .5; L.new(tl.outputs[0], a.inputs[1]); L.new(df.outputs[0], a.inputs[2])
    b = N.new('ShaderNodeMixShader'); b.inputs[0].default_value = 1 - through; L.new(tr.outputs[0], b.inputs[1]); L.new(a.outputs[0], b.inputs[2])
    L.new(b.outputs[0], out.inputs[0])

def glow(m, color, strength):
    nt, out = fresh(m); N, L = nt.nodes, nt.links
    e = N.new('ShaderNodeEmission'); e.inputs[0].default_value = color; e.inputs['Strength'].default_value = strength
    L.new(e.outputs[0], out.inputs[0])

def base(name):                                                 # 'glass.004' -> 'glass'
    return name.split('.')[0]

def lamp(m, color, strength):                                  # a lampshade that glows: the finish kept, emission on top
    p = principled(m)
    if p: p.inputs['Emission Color'].default_value = color; p.inputs['Emission Strength'].default_value = strength

def upgrade(X, lamps=False):
    print('FINISHES', sorted(finishes()))
    warm = (1, .78, .52, 1)                                      # 2700 K
    for m in bpy.data.materials:
        b = base(m.name)
        if b == 'islandLED': lamp(m, warm, 40 if lamps else 0)       # the LEDs in the three amber pendants over the island
        elif b == 'glow': lamp(m, warm, 7 if lamps else 0)           # the pendant over the dining table
        elif b == 'bedLamp': lamp(m, warm, 5 if lamps else 0)        # the bedside lamps' drums
        elif b == 'donutGlass': lamp(m, (1, .6, .25, 1), 4 if lamps else 0)   # the orange glass donut on the TV console
    for m in bpy.data.materials:
        b = base(m.name)
        if b == 'glass': thin_glass(m)
        elif b == 'amberGlass': thin_glass(m, (.86, .55, .28, 1))        # the pendants' cognac glass
        elif b == 'rail': thin_glass(m, (.9, .96, .96, 1))
        elif b == 'sheerM': sheer(m)
        elif b == 'led': glow(m, (1, .86, .68, 1), 25 if lamps else 12)
        elif b == 'downlight': glow(m, (1, .84, .64, 1), 160 if lamps else .3)
        elif b == 'frosted':
            p = principled(m)
            if p: p.inputs['Alpha'].default_value = .85; p.inputs['Roughness'].default_value = .6

# ---------- pass 2: the real finishes, from Poly Haven scans (CC0) in tex/<id>/ (get_textures.py fetches them; not in the repo) ----------
# Each scan is laid on by box projection in world metres, so the grain and the weave come out at their real size whatever the UVs.
import os
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
FINISH = {    # material name: (scan, tile size in m, tint (or None: the scan's own colour), normal strength, roughness scale, sheen)
    'oak':       ('white_oak_veneer', 1.0, (.80, .66, .50), .6, 1.0, 0, 1.4),   # natural oak fronts etc.: by the viewer's UVs (1 = 140 cm, grain up the fronts)
    'boucle':    ('wool_boucle', .35, 'flat', 1.0, 1.0, .6),       # the dining chairs: the scan's loops and sheen, our colour (the scan is checked)
    'fabric':    ('wool_boucle', .35, 'flat', 1.0, 1.0, .6),
    'chenille':  ('velour_velvet', .5, (.88, .78, .65), .8, 1.0, .55),  # the sofa: a warm light beige chenille
    'linen':     ('rough_linen', .45, 'keep', .8, 1.0, .3),             # cushions, the bedding, the bed: the viewer's colours, the scan's weave
    'drapeM':    ('rough_linen', .6, (.80, .73, .64), 1.0, 1.0, .4),     # the drapes
    'jute':      ('hessian_230', .6, (.91, .86, .78), 1.2, 1.0, 0),     # the rug
    'wall':      ('painted_plaster_wall', 2.0, 'keep', .15, 1.0, 0),   # the paint keeps its colour; only a faint roller texture
    'paint':     ('painted_plaster_wall', 2.0, 'keep', .15, 1.0, 0),
}

def has_scan(i): return os.path.isdir(os.path.join(TEX, i))
def scan_file(i, kind):
    d = os.path.join(TEX, i)
    return next((os.path.join(d, f) for f in os.listdir(d) if kind in f.lower()), None)

def finish(m, spec):
    sid, tile, tint, nstr, rsc, sheen = spec[:6]; uv = spec[6] if len(spec) > 6 else 0
    p = principled(m)
    if not p or not has_scan(sid): return False
    nt = m.node_tree; N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = ((uv or 1) / tile,) * 3
    L.new(tc.outputs['UV' if uv else 'Object'], mp.inputs[0])
    def img(kind, colour):
        f = scan_file(sid, kind)
        if not f: return None
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(f, check_existing=True)
        if not uv: t.projection = 'BOX'; t.projection_blend = .25
        t.image.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'; L.new(mp.outputs[0], t.inputs[0]); return t
    col = img('diff', True) if tint != 'flat' else None
    if col and tint != 'keep':
        for l in list(p.inputs['Base Color'].links): nt.links.remove(l)
        if tint:
            mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
            gr = N.new('ShaderNodeRGBToBW'); L.new(col.outputs[0], gr.inputs[0])                     # the scan's tone, in our colour
            L.new(gr.outputs[0], mx.inputs['A']); mx.inputs['B'].default_value = (*[c * 1.6 for c in tint], 1)
            L.new(mx.outputs['Result'], p.inputs['Base Color'])
        else: L.new(col.outputs[0], p.inputs['Base Color'])
    ro = img('rough', False)
    if ro:
        for l in list(p.inputs['Roughness'].links): nt.links.remove(l)
        if rsc != 1:
            mt = N.new('ShaderNodeMath'); mt.operation = 'MULTIPLY'; mt.inputs[1].default_value = rsc; L.new(ro.outputs[0], mt.inputs[0]); L.new(mt.outputs[0], p.inputs['Roughness'])
        else: L.new(ro.outputs[0], p.inputs['Roughness'])
    nm = img('nor_gl', False)
    if nm:
        for l in list(p.inputs['Normal'].links): nt.links.remove(l)
        nn = N.new('ShaderNodeNormalMap'); nn.inputs['Strength'].default_value = nstr; L.new(nm.outputs[0], nn.inputs['Color']); L.new(nn.outputs[0], p.inputs['Normal'])
    if sheen:
        p.inputs['Sheen Weight'].default_value = sheen; p.inputs['Sheen Roughness'].default_value = .5
    return True

def finishes():
    done = set()
    for m in bpy.data.materials:
        spec = FINISH.get(base(m.name))
        if spec and finish(m, spec): done.add(base(m.name))
    # finishes without a scan: the lacquers, the stone, the glaze
    for m in bpy.data.materials:
        b, p = base(m.name), principled(m)
        if not p: continue
        if b == 'cashmere': p.inputs['Roughness'].default_value = .5                                     # matt lacquer, a soft sheen
        elif b == 'tajmahal':                                                                             # polished quartzite: the 4K map, a clear coat
            p.inputs['Coat Weight'].default_value = .6; p.inputs['Coat Roughness'].default_value = .06
            hi = os.path.join(os.path.dirname(TEX), '..', '..', 'assets', 'tex', 'tajmahal_4k.jpg')
            for l in m.node_tree.links:
                if l.to_socket == p.inputs['Base Color'] and l.from_node.type == 'TEX_IMAGE' and os.path.exists(hi):
                    l.from_node.image = bpy.data.images.load(hi, check_existing=True); l.from_node.interpolation = 'Cubic'
        elif b in ('tiles',): p.inputs['Coat Weight'].default_value = 1; p.inputs['Coat Roughness'].default_value = .04     # the glaze
        elif b == 'travertine': p.inputs['Coat Weight'].default_value = .2; p.inputs['Coat Roughness'].default_value = .3
        elif b == 'floorOak': p.inputs['Coat Weight'].default_value = .15; p.inputs['Coat Roughness'].default_value = .35  # the lacquered laminate
    return done
