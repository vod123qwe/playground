import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { SECTIONS } from '../sections';

const sideClass: Record<string, string> = {
  left: 'items-start text-left',
  right: 'items-end text-right',
  center: 'items-center text-center',
};

/**
 * The scroll-synced annotations. Each section fades in as it reaches the
 * centre of the viewport, in lock-step with the product's state changes.
 */
export default function Overlay() {
  const scroll = useScroll();
  const refs = useRef<Array<HTMLElement | null>>([]);

  useFrame(() => {
    const p = scroll.offset * (SECTIONS.length - 1);
    for (let i = 0; i < SECTIONS.length; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const fade = Math.max(0, 1 - Math.abs(p - i) * 1.15);
      el.style.opacity = String(fade);
      el.style.transform = `translateY(${(1 - fade) * 26}px)`;
    }
  });

  return (
    <div className="w-screen">
      {SECTIONS.map((s, i) => (
        <section
          key={s.eyebrow}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`flex h-screen w-screen flex-col justify-center px-8 will-change-[opacity,transform] sm:px-20 ${sideClass[s.side]}`}
        >
          <div className="max-w-md">
            <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-white/45">
              {s.eyebrow}
            </p>
            <h2 className="mb-5 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              {s.title}
            </h2>
            <p className="text-base leading-relaxed text-white/65 sm:text-lg">{s.body}</p>
            {i === SECTIONS.length - 1 && (
              <button className="mt-8 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/80">
                Zbuduj swoją AURA
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
