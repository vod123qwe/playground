import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, useScroll } from '@react-three/drei';
import { Color, Group, MathUtils, MeshBasicMaterial } from 'three';
import { SECTIONS } from '../sections';

/**
 * The hero object: a refractive glass core that the scroll position drives
 * across the screen, rotates, scales, and re-colours to signal "states".
 */
export default function Product() {
  const scroll = useScroll();
  const group = useRef<Group>(null!);
  // MeshTransmissionMaterial has no exported type; we only need its color refs.
  const matRef = useRef<any>(null);
  const coreRef = useRef<MeshBasicMaterial>(null!);

  // Pre-build the per-section colors + a scratch color to avoid allocations.
  const colors = useMemo(() => SECTIONS.map((s) => new Color(s.color)), []);
  const target = useMemo(() => new Color(SECTIONS[0].color), []);

  useFrame((state, delta) => {
    const last = SECTIONS.length - 1;
    const p = scroll.offset * last; // section-index space: 0 .. last
    const i = Math.min(Math.floor(p), last - 1);
    const f = p - i; // 0..1 within the current segment
    const a = SECTIONS[i];
    const b = SECTIONS[i + 1] ?? a;

    // Frame-rate independent damping.
    const k = 1 - Math.pow(0.0015, delta);

    // Position
    group.current.position.x = MathUtils.lerp(
      group.current.position.x,
      MathUtils.lerp(a.productPos[0], b.productPos[0], f),
      k,
    );
    group.current.position.y = MathUtils.lerp(
      group.current.position.y,
      MathUtils.lerp(a.productPos[1], b.productPos[1], f),
      k,
    );
    group.current.position.z = MathUtils.lerp(
      group.current.position.z,
      MathUtils.lerp(a.productPos[2], b.productPos[2], f),
      k,
    );

    // Scale, with a gentle breathing pulse.
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    group.current.scale.setScalar(
      MathUtils.lerp(group.current.scale.x, MathUtils.lerp(a.scale, b.scale, f) * pulse, k),
    );

    // Rotation: constant spin + scroll-driven tumble.
    group.current.rotation.y += delta * 0.25;
    group.current.rotation.x = MathUtils.lerp(
      group.current.rotation.x,
      scroll.offset * Math.PI * 1.5,
      k,
    );

    // State colour for the glass attenuation + glowing core.
    target.copy(colors[i]).lerp(colors[i + 1] ?? colors[i], f);
    coreRef.current?.color.lerp(target, k);
    if (matRef.current?.attenuationColor) {
      matRef.current.attenuationColor.lerp(target, k);
    }
  });

  const start = SECTIONS[0].productPos;

  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.7}>
      <group ref={group} position={[start[0], start[1], start[2]]}>
        {/* Refractive glass shell */}
        <mesh>
          <icosahedronGeometry args={[1, 0]} />
          <MeshTransmissionMaterial
            ref={matRef}
            samples={6}
            resolution={512}
            transmission={1}
            roughness={0.05}
            thickness={1.4}
            ior={1.5}
            chromaticAberration={0.6}
            anisotropy={0.3}
            distortion={0.3}
            distortionScale={0.4}
            temporalDistortion={0.15}
            attenuationDistance={0.6}
            attenuationColor={SECTIONS[0].color}
            color="#ffffff"
          />
        </mesh>

        {/* Glowing inner core — feeds the bloom pass + signals the state. */}
        <mesh scale={0.42}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial ref={coreRef} color={SECTIONS[0].color} toneMapped={false} />
        </mesh>

        {/* Thin accent ring. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.7}>
          <torusGeometry args={[1, 0.012, 16, 128]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.25} />
        </mesh>
      </group>
    </Float>
  );
}
