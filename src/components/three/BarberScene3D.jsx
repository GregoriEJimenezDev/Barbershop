import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import BarberChair from './BarberChair';
import FloatingScissors from './FloatingScissors';

/**
 * SceneRig - Sets up the camera and controls the scene composition.
 * Auto-rotates slightly to give a sense of dynamism without input.
 */
const SceneRig = () => {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 1.2, z: 3.5 });

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    // Gentle camera orbit
    const radius = 3.5;
    const angle = t * 0.08 + mouse.x * 0.2;
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
 */
const AtmosphericLights = () => {
  return (
    <>
      <ambientLight intensity={0.25} color="#f5e6c8" />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <spotLight
        position={[0, 4, 2]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.5}
        color="#c9a45c"
        castShadow
      />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#3b82f6" />
    </>
  );
};

/**
 * Floor with subtle pattern
 */
const Floor = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1c';
    ctx.fillRect(0, 0, 256, 256);
    // Checker pattern
    ctx.fillStyle = '#222226';
    for (let x = 0; x < 256; x += 64) {
      for (let y = 0; y < 256; y += 64) {
        if ((x / 64 + y / 64) % 2 === 0) {
          ctx.fillRect(x, y, 64, 64);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[8, 64]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.2} />
    </mesh>
  );
};

/**
 * BarberScene3D - Composes the full 3D scene.
 * Memoized to avoid unnecessary re-renders.
 */
const BarberScene3D = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <AtmosphericLights />
        <SceneRig />
        <Floor />
        <BarberChair position={[0, 0, 0]} />
        <FloatingScissors
          position={[1.6, 1.4, -0.5]}
          rotationOffset={Math.PI / 3}
          scale={0.8}
        />
        <FloatingScissors
          position={[-1.4, 1.6, 0.3]}
          rotationOffset={-Math.PI / 4}
          scale={0.6}
        />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.6}
          scale={6}
          blur={2.5}
          far={3}
        />
        <Environment preset="warehouse" background={false} />
      </Suspense>
    </Canvas>
  );
};

export default BarberScene3D;
