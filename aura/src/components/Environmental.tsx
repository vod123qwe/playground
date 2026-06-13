import { Environment, Lightformer, Sparkles } from '@react-three/drei';

/**
 * Lights, a procedurally-built studio environment (no external HDRI), and
 * floating sparkles for ambience. Keeps the project fully self-contained.
 */
export default function Environmental() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <Sparkles
        count={70}
        scale={[14, 9, 5]}
        size={2}
        speed={0.3}
        opacity={0.5}
        color="#9db4ff"
      />

      {/* Reflections are baked from Lightformers — no asset downloads. */}
      <Environment resolution={256}>
        <group rotation={[0, 0, 1]}>
          <Lightformer form="circle" intensity={4} position={[0, 5, -9]} scale={10} />
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[-5, 1, -1]}
            scale={[3, 10, 1]}
            color="#4060ff"
          />
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[5, 1, -1]}
            scale={[3, 10, 1]}
            color="#ff4060"
          />
          <Lightformer form="ring" intensity={3} position={[0, 0, 5]} scale={5} />
        </group>
      </Environment>
    </>
  );
}
