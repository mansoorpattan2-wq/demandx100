import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export type JarvisVisualState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

interface Jarvis3DOrbProps {
  assistantState: JarvisVisualState;
  audioLevel?: number; // 0.0 to 1.0 from live Web Audio analyser
  reducedMotion?: boolean;
}

// Internal animated 3D core & concentric rings
function OrbScene({
  assistantState,
  audioLevel = 0,
  reducedMotion = false,
}: {
  assistantState: JarvisVisualState;
  audioLevel: number;
  reducedMotion: boolean;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Particles cloud around orb
  const particleCount = 120;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  // Determine state-based color palette
  const stateColors = useMemo(() => {
    switch (assistantState) {
      case 'LISTENING':
        return {
          core: '#00F0FF',
          wireframe: '#06b6d4',
          rings: '#38bdf8',
          glow: '#0284c7',
        };
      case 'SPEAKING':
        return {
          core: '#00F0FF',
          wireframe: '#22d3ee',
          rings: '#06b6d4',
          glow: '#0891b2',
        };
      case 'PROCESSING':
        return {
          core: '#a855f7',
          wireframe: '#c084fc',
          rings: '#00F0FF',
          glow: '#7c3aed',
        };
      case 'ERROR':
        return {
          core: '#f43f5e',
          wireframe: '#fb7185',
          rings: '#fda4af',
          glow: '#e11d48',
        };
      case 'IDLE':
      default:
        return {
          core: '#00F0FF',
          wireframe: '#0ea5e9',
          rings: '#38bdf8',
          glow: '#0369a1',
        };
    }
  }, [assistantState]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const speedMultiplier = reducedMotion ? 0.1 : 1.0;

    // React to live audio level
    const audioReactiveScale = 1.0 + (assistantState === 'LISTENING' || assistantState === 'SPEAKING' ? audioLevel * 0.45 : 0);
    const audioReactiveRing = 1.0 + (assistantState === 'LISTENING' ? audioLevel * 0.6 : assistantState === 'SPEAKING' ? audioLevel * 0.3 : 0);

    // 1. Core Orb Animation
    if (coreRef.current) {
      if (!reducedMotion) {
        coreRef.current.rotation.y += delta * 0.4 * speedMultiplier;
        coreRef.current.rotation.x += delta * 0.25 * speedMultiplier;
      }

      // Breathing or speech oscillation
      const breath = assistantState === 'IDLE'
        ? 1.0 + Math.sin(time * 2.2) * 0.05
        : assistantState === 'PROCESSING'
        ? 1.0 + Math.sin(time * 8.0) * 0.08
        : audioReactiveScale;

      coreRef.current.scale.set(breath, breath, breath);
    }

    // 2. Concentric Ring 1 (X-Y Tilt)
    if (ring1Ref.current) {
      const rotSpeed = (assistantState === 'PROCESSING' ? 2.5 : 0.6) * speedMultiplier;
      ring1Ref.current.rotation.z += delta * rotSpeed;
      ring1Ref.current.rotation.x = 0.5 + Math.sin(time * 0.5) * 0.1;
      const s = audioReactiveRing;
      ring1Ref.current.scale.set(s, s, s);
    }

    // 3. Concentric Ring 2 (Y-Z Tilt)
    if (ring2Ref.current) {
      const rotSpeed = (assistantState === 'PROCESSING' ? -2.0 : -0.5) * speedMultiplier;
      ring2Ref.current.rotation.y += delta * rotSpeed;
      ring2Ref.current.rotation.z = -0.4 + Math.cos(time * 0.4) * 0.1;
      const s = 1.0 + (audioReactiveRing - 1.0) * 0.8;
      ring2Ref.current.scale.set(s, s, s);
    }

    // 4. Concentric Ring 3 (Outer Orbit)
    if (ring3Ref.current) {
      const rotSpeed = (assistantState === 'PROCESSING' ? 3.0 : 0.4) * speedMultiplier;
      ring3Ref.current.rotation.x += delta * rotSpeed;
      ring3Ref.current.rotation.y += delta * 0.3 * speedMultiplier;
      const s = 1.0 + (audioReactiveRing - 1.0) * 0.6;
      ring3Ref.current.scale.set(s, s, s);
    }

    // 5. Particles slow drift
    if (particlesRef.current && !reducedMotion) {
      particlesRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group>
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={assistantState === 'PROCESSING' ? 3.5 : 2.8} color={stateColors.core} distance={8} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#00F0FF" />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#3b82f6" />

      {/* Center 3D Floating Mesh */}
      <Float speed={reducedMotion ? 0 : 2} rotationIntensity={reducedMotion ? 0 : 0.5} floatIntensity={reducedMotion ? 0 : 0.6}>
        {/* Core Glowing Orb */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.2, 3]} />
          <meshStandardMaterial
            color={stateColors.core}
            emissive={stateColors.glow}
            emissiveIntensity={assistantState === 'LISTENING' ? 1.2 : 0.8}
            wireframe={false}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Outer Wireframe Hull */}
        <mesh scale={[1.28, 1.28, 1.28]}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshBasicMaterial
            color={stateColors.wireframe}
            wireframe
            transparent
            opacity={assistantState === 'PROCESSING' ? 0.9 : 0.4}
          />
        </mesh>

        {/* Concentric Ring 1 */}
        <group ref={ring1Ref}>
          <mesh>
            <torusGeometry args={[1.75, 0.02, 16, 100]} />
            <meshBasicMaterial color={stateColors.rings} transparent opacity={0.8} />
          </mesh>
          <mesh position={[1.75, 0, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Concentric Ring 2 */}
        <group ref={ring2Ref}>
          <mesh>
            <torusGeometry args={[2.1, 0.018, 16, 100]} />
            <meshBasicMaterial color={stateColors.rings} transparent opacity={0.65} />
          </mesh>
          <mesh position={[-2.1, 0, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#00F0FF" />
          </mesh>
        </group>

        {/* Concentric Ring 3 */}
        <group ref={ring3Ref}>
          <mesh>
            <torusGeometry args={[2.5, 0.015, 16, 100]} />
            <meshBasicMaterial color={stateColors.rings} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Quantum Dust Particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            color={stateColors.wireframe}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      </Float>
    </group>
  );
}

// 2D Lightweight Fallback for devices without WebGL or reduced capability
function Canvas2DFallback({
  assistantState,
  audioLevel = 0,
}: {
  assistantState: JarvisVisualState;
  audioLevel: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth || 300);
      const height = (canvas.height = canvas.offsetHeight || 300);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Glow gradient
      const baseRadius = 55 + (assistantState === 'LISTENING' || assistantState === 'SPEAKING' ? audioLevel * 35 : 0);
      const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseRadius * 1.5);
      gradient.addColorStop(0, assistantState === 'PROCESSING' ? 'rgba(168, 85, 247, 0.9)' : assistantState === 'ERROR' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(0, 240, 255, 0.95)');
      gradient.addColorStop(0.6, assistantState === 'PROCESSING' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(6, 182, 212, 0.4)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Central core
      ctx.fillStyle = assistantState === 'PROCESSING' ? '#c084fc' : assistantState === 'ERROR' ? '#fda4af' : '#00F0FF';
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rotating rings
      const rings = [baseRadius * 1.1, baseRadius * 1.45, baseRadius * 1.8];
      rings.forEach((r, idx) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * (idx % 2 === 0 ? 1 : -1) * (0.8 + idx * 0.4));
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.6);
        ctx.strokeStyle = assistantState === 'PROCESSING' ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node dot
        ctx.beginPath();
        ctx.arc(r, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      angle += 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [assistantState, audioLevel]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full max-w-[340px] max-h-[340px]" />
    </div>
  );
}

export const Jarvis3DOrb: React.FC<Jarvis3DOrbProps> = ({
  assistantState,
  audioLevel = 0,
  reducedMotion = false,
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <Canvas2DFallback assistantState={assistantState} audioLevel={audioLevel} />;
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        fallback={<Canvas2DFallback assistantState={assistantState} audioLevel={audioLevel} />}
      >
        <OrbScene
          assistantState={assistantState}
          audioLevel={audioLevel}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
};
