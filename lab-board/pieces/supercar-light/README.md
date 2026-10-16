# Supercar Light

A supercar of 10,000 triangles that looks real because of its maps and its light. Two switches on the stage:
**Intact / Damaged** and **PBR Before / After** (Before = the downloaded file as it came). Customize opens the lab's card
with the paint, rims, light, relief, dents, maps and effects; a short click on the car dents it.

- `assets/` is exported by the pipeline in `F:\AI - Tests\supercar-light\` (`python tools/export_lab.py`): WebP maps per
  look (`tex/clean`, `tex/damaged`), the shared AO, `model.glb`, `raw.glb` (Before), `body_hd.glb` (meshopt, for Displacement)
  and the HDRIs (studio 2k, the others 1k).
- `?thumb` = the board's still, `?demo=1` = the board's live preview (turns for good). Thumbnail and hover video come from
  `tools/lab_shots.mjs` in the pipeline folder (headless Edge, DevTools protocol), so they match the demo's first frame.
- Quality starts at High and steps down on its own if a device stays under ~26 fps (after a 4 s warm-up), until a quality is picked.

## Credits

- Model: [CAR Model](https://poly.pizza/m/5zUWP5UsLg-) by Ignition Labs, CC-BY 3.0 (repainted, re-shaded, maps baked).
- HDRI: [Poly Haven](https://polyhaven.com) (studio_small_09, the_sky_is_on_fire, wide_street_01, empty_warehouse_01), CC0.
- Damaged paint: generated with ChatGPT from the model's own texture atlas.
