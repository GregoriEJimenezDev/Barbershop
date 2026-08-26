import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FloatingScissors - Animated decorative scissors that orbit
 * Adds a dynamic element to the 3D hero scene.
 */
const FloatingScissors = ({ position = [0, 0, 0], rotationOffset = 0, scale = 1 }) => {
  const groupRef = useRef();
  const bladesRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      // Orbit motion
      groupRef.current.rotation.y = t * 0.4 + rotationOffset;
      // Float up/down
      groupRef.current.position.y = position[1] + Math.sin(t * 0.7 + rotationOffset) * 0.15;
    }
    if (bladesRef.current) {
      const t = clock.getElapsedTime();
      // Scissor open/close animation
      const open = (Math.sin(t * 2) + 1) * 0.5;
      bladesRef.current.rotation.x = -open * 0.5;
    }
  });

  const metal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d6b26f',
        roughness: 0.2,
        metalness: 0.95
      }),
    []
  );

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <group ref={bladesRef}>
        {/* Upper blade */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.2]} material={metal} castShadow>
          <coneGeometry args={[0.04, 0.6, 4]} />
        </mesh>
        {/* Lower blade */}
        <mesh position={[0.2, 0, 0]} rotation={[0, Math.PI, -0.2]} material={metal} castShadow>
          <coneGeometry args={[0.04, 0.6, 4]} />
        </mesh>
        {/* Pivot */}
        <mesh material={metal}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
        {/* Handles */}
        <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0, 0.3]} material={metal}>
          <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
        </mesh>
        <mesh position={[-0.15, -0.05, 0]} rotation={[0, Math.PI, -0.3]} material={metal}>
          <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
};

export default FloatingScissors;
