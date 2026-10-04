import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import BarberChair from './BarberChair';
import FloatingScissors from './FloatingScissors';

/**
 * SceneRig - Sets up the camera with optimized orbit for mobile.
 * Auto-rotates slightly to give a sense of dynamism without input.
 * Reduced orbit speed on mobile for better performance.
 */
const SceneRig = () => {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 1.2, z: 3.5 });
  const isMobile = useMemo(() => window.innerWidth < 768, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    // Gentle camera orbit with reduced speed on mobile
    const orbitSpeed = isMobile ? 0.04 : 0.08;
    const radius = isMobile ? 2.5 : 3.5;
    const angle = t * orbitSpeed + mouse.x * 0.2;
    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const targetY = 1.2 + mouse.y * 0.3;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(targetRef.current.x, targetRef.current.y, 0);
  });

  return null;
};

/**
 * Spotlight - Atmospheric lighting that brings warmth to the scene.
 * Reduced shadow quality on mobile for performance.
 */
const AtmosphericLights = ({ isMobile }) => {
  return (
    <>
      <ambientLight intensity={0.25} color="#f5e6c8" />
      <directionalLight
        position={[5, isMobile ? 4 : 8, 4]}
        intensity={isMobile ? 0.8 : 1.2}
        color="#fff5e0"
        castShadow={!isMobile}
        shadow-mapSize-width={isMobile ? 512 : 1024}
        shadow-mapSize-height={isMobile ? 512 : 1024}
        shadow-camera-far={isMobile ? 15 : 20}
        shadow-camera-left={isMobile ? -5 : -5}
        shadow-camera-right={isMobile ? 5 : 5}
        shadow-camera-top={isMobile ? 5 : 5}
        shadow-camera-bottom={isMobile ? -5 : -5}
      />
      <spotLight
        position={[0, isMobile ? 3 : 4, 2]}
        angle={isMobile ? 0.3 : 0.5}
        penumbra={isMobile ? 0.3 : 0.6}
        intensity={isMobile ? 1 : 1.5}
        color="#c9a45c"
        castShadow={!isMobile}
      />
      <pointLight position={[-3, isMobile ? 1 : 2, -2]} intensity={isMobile ? 0.3 : 0.5} color="#3b82f6" />
    </>
  );
};

/**
 * Floor with subtle pattern.
 * Uses lower resolution texture on mobile.
 */
const Floor = ({ isMobile }) => {
  const texture = useMemo(() => {
    const size = isMobile ? 128 : 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#1a1a1c';
    ctx.fillRect(0, 0, size, size);
    // Checker pattern
    const step = isMobile ? 32 : 64;
    ctx.fillStyle = '#222226';
    for (let x = 0; x < size; x += step) {
      for (let y = 0; y < size; y += step) {
        if ((x / step + y / step) % 2 === 0) {
          ctx.fillRect(x, y, step, step);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(isMobile ? 2 : 4, isMobile ? 2 : 4);
    return tex;
  }, [isMobile]);

  const geomArgs = isMobile ? [4, 32] : [8, 64];

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={geomArgs} />
      <meshStandardMaterial roughness={isMobile ? 0.8 : 0.7} metalness={isMobile ? 0.3 : 0.2} />
    </mesh>
  );
};

/**
 * BarberScene3D - Composes the full 3D scene.
 * Memoized to avoid unnecessary re-renders.
 * Includes mobile optimization for better performance on mobile devices.
 */
const BarberScene3D = () => {
  const isMobile = useMemo(() => window.innerWidth < 768, []);

  useEffect(() => {
    // Update mobile state on resize
    const handleResize = () => {
      // No state update needed, isMobile is recalculated on render
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Canvas
      shadows={!isMobile}
      dpr={1}
      camera={{ position: [0, isMobile ? 1.5 : 2, isMobile ? 3 : 4], fov: isMobile ? 50 : 45 }}
      gl={{ antialias: !isMobile }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <AtmosphericLights isMobile={isMobile} />
        <SceneRig />
        <Floor isMobile={isMobile} />
        <BarberChair position={[0, 0, 0]} />
        <FloatingScissors
          position={[1.6, isMobile ? 1.2 : 1.4, -0.5]}
          rotationOffset={isMobile ? Math.PI / 4 : Math.PI / 3}
          scale={isMobile ? 0.6 : 0.8}
        />
        <FloatingScissors
          position={[-1.4, isMobile ? 1.4 : 1.6, 0.3]}
          rotationOffset={isMobile ? -Math.PI / 6 : -Math.PI / 4}
          scale={isMobile ? 0.4 : 0.8}
        />
        <ContactShadows
          position={[0, isMobile ? -0.01 : 0, 0]}
          opacity={isMobile ? 0.3 : 0.6}
          scale={isMobile ? 3 : 6}
          blur={isMobile ? 2 : 2.5}
          far={isMobile ? 2 : 3}
        />
        <Environment preset="forest" background={false} />
      </Suspense>
    </Canvas>
  );
};

export default BarberScene3D;