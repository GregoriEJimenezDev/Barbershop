import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * BarberChair - 3D model of a barber chair
 * Built procedurally from primitives. No external assets needed.
 */
const BarberChair = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.04;
    }
  });

  // Materials - memoized for performance
  const materials = useMemo(
    () => ({
      leather: new THREE.MeshStandardMaterial({
        color: '#3a0a0a',
        roughness: 0.4,
        metalness: 0.1
      }),
      metal: new THREE.MeshStandardMaterial({
        color: '#c9a45c',
        roughness: 0.3,
        metalness: 0.85
      }),
      metalDark: new THREE.MeshStandardMaterial({
        color: '#222226',
        roughness: 0.4,
        metalness: 0.7
      }),
      wood: new THREE.MeshStandardMaterial({
        color: '#3e2723',
        roughness: 0.8,
        metalness: 0.05
      })
    }),
    []
  );

  return (
    <group ref={groupRef} position={position}>
      {/* Base (round disk) */}
      <mesh position={[0, 0.05, 0]} material={materials.metalDark} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 32]} />
      </mesh>

      {/* Central pole */}
      <mesh position={[0, 0.4, 0]} material={materials.metal} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 16]} />
      </mesh>

      {/* Seat */}
      <mesh position={[0, 0.85, 0]} material={materials.leather} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.15, 0.75]} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 1.25, -0.32]} rotation={[-0.1, 0, 0]} material={materials.leather} castShadow>
        <boxGeometry args={[0.85, 0.75, 0.12]} />
      </mesh>

      {/* Headrest */}
      <mesh position={[0, 1.75, -0.32]} material={materials.leather} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.12]} />
      </mesh>

      {/* Left armrest */}
      <mesh position={[-0.45, 1.05, 0]} material={materials.metal} castShadow>
        <boxGeometry args={[0.08, 0.1, 0.55]} />
      </mesh>
      <mesh position={[-0.45, 1.15, 0.2]} material={materials.leather} castShadow>
        <boxGeometry args={[0.12, 0.05, 0.2]} />
      </mesh>

      {/* Right armrest */}
      <mesh position={[0.45, 1.05, 0]} material={materials.metal} castShadow>
        <boxGeometry args={[0.08, 0.1, 0.55]} />
      </mesh>
      <mesh position={[0.45, 1.15, 0.2]} material={materials.leather} castShadow>
        <boxGeometry args={[0.12, 0.05, 0.2]} />
      </mesh>

      {/* Footrest */}
      <mesh position={[0, 0.25, 0.55]} material={materials.metalDark} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
      </mesh>
    </group>
  );
};

export default BarberChair;
