import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Scroll, ScrollControls } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import Product from './components/Product';
import Environmental from './components/Environmental';
import Overlay from './components/Overlay';
import Header from './components/Header';
import { SECTIONS } from './sections';

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050507] text-white">
      <Header />

      <Canvas camera={{ position: [0, 0, 6], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#050507']} />
        <fog attach="fog" args={['#050507', 8, 18]} />

        <Suspense fallback={null}>
          <ScrollControls pages={SECTIONS.length} damping={0.2}>
            <Environmental />
            <Product />
            <Scroll html style={{ width: '100%' }}>
              <Overlay />
            </Scroll>
          </ScrollControls>

          <EffectComposer>
            <Bloom
              mipmapBlur
              intensity={1.15}
              luminanceThreshold={0.25}
              luminanceSmoothing={0.4}
              radius={0.7}
            />
            <Vignette offset={0.25} darkness={0.85} />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[11px] uppercase tracking-[0.3em]">Przewiń</span>
        <span className="aura-scroll-hint text-lg">↓</span>
      </div>
    </div>
  );
}
