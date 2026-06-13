# Lithos — hero section

Full-screen, dark-themed hero for a fictional geology brand. The signature
feature is a **cursor-following spotlight** that reveals a second image through
a soft circular mask painted on a `<canvas>` and applied via `mask-image`.

Built with **React 18 + TypeScript + Vite + Tailwind CSS** and
**lucide-react** for icons.

## Run

```bash
cd lithos
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## How the reveal works

- `Hero` tracks the raw mouse position and eases a smoothed copy toward it on
  every `requestAnimationFrame` tick (`smooth += (mouse - smooth) * 0.1`).
- `RevealLayer` paints a soft radial gradient (radius `SPOTLIGHT_R = 260`) at
  the smoothed cursor onto an offscreen canvas, exports it with
  `toDataURL()`, and applies it as the `mask-image` of the reveal image.
- The base image sits at `z-10`, the masked reveal image at `z-30`, headings
  and copy at `z-50`, and the fixed nav at `z-100`.
