import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * MicrotubuleTorus models hypothesized quantum-coherent structures within neurons.
 * This component is optimized using InstancedMesh to minimize draw calls.
 */
export const MicrotubuleTorus = ({
  radius,
  count = 360,
  offset = 0,
  color = "#C5A059",
  speed = 1,
}: {
  radius: number;
  count?: number;
  offset?: number;
  color?: string;
  speed?: number;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const cubes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + offset;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      arr.push({ x, y, angle });
    }
    return arr;
  }, [radius, count, offset]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime() * speed;

    for (let i = 0; i < count; i++) {
      const cube = cubes[i];
      tempObject.position.set(cube.x, cube.y, Math.sin(time + i * 0.1) * 0.2);
      tempObject.rotation.set(0, 0, cube.angle + time);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
};

export const QuantumScene = () => {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <MicrotubuleTorus radius={5} count={360} color="#C5A059" speed={1} />
      <MicrotubuleTorus
        radius={10}
        count={720}
        offset={Math.PI}
        color="#E5C079"
        speed={0.5}
      />
    </group>
  );
};

export default QuantumScene;
