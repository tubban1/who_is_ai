import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D, Quaternion, Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);
function Branch({ from, to, radius }) {
  const { midpoint, rotation, length } = useMemo(() => {
    const a = new Vector3(...from), b = new Vector3(...to), direction = b.clone().sub(a);
    return { midpoint: a.add(b).multiplyScalar(.5), rotation: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()), length: direction.length() };
  }, [from, to]);
  return <mesh position={midpoint} quaternion={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[radius * .5, radius, length, 7]} />
    <meshStandardMaterial color="#625345" roughness={.95} />
  </mesh>;
}

function RiversideTree({ x, seed }) {
  const leaves = useRef();
  const crown = useRef();
  const count = 900;
  const { instances, branches } = useMemo(() => {
    let state = seed;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
    const clusters = [[0, 2.5, 0], [-1.15, 1.85, .5], [1.05, 2, -.4], [.5, 1.8, 1.1], [-.25, 2.1, -1.05]];
    const branches = clusters.slice(1).map(point => ({ from: [0, -.25, 0], to: point }));
    const dummy = new Object3D();
    const instances = [];
    for (let i = 0; i < count; i++) {
      const center = clusters[i % clusters.length];
      const azimuth = random() * Math.PI * 2, y = random() * 2 - 1, r = Math.cbrt(random());
      const ring = Math.sqrt(1 - y * y);
      dummy.position.set(center[0] + Math.cos(azimuth) * ring * r * 1.2, center[1] + y * r * .85, center[2] + Math.sin(azimuth) * ring * r);
      dummy.rotation.set(random() * 2, random() * 6.28, random());
      const size = .12 + random() * .085;
      dummy.scale.set(size, size * .20, size * .66);
      dummy.updateMatrix();
      instances.push({ matrix: dummy.matrix.clone(), color: new Color().setHSL(.26 + random() * .055, .5 + random() * .2, .08 + random() * .07) });
    }
    return { instances, branches };
  }, [seed]);
  useLayoutEffect(() => {
    instances.forEach(({ matrix, color }, i) => { leaves.current.setMatrixAt(i, matrix); leaves.current.setColorAt(i, color); });
    leaves.current.instanceMatrix.needsUpdate = true;
    leaves.current.instanceColor.needsUpdate = true;
    leaves.current.computeBoundingSphere();
  }, [instances]);
  useFrame(({ clock }) => {
    if (!crown.current) return;
    const t = clock.elapsedTime;
    crown.current.rotation.z = Math.sin(t * .65 + seed) * .025 + Math.sin(t * 1.3 + seed) * .006;
    crown.current.rotation.x = Math.sin(t * .5 + seed * .3) * .013;
  });
  return <group position={[x, 1.2, -7.4]}>
    <mesh position={[0, .18, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[1.5, 1.6, .36, 24]} />
      <meshStandardMaterial color="#777b71" roughness={.87} />
    </mesh>
    <mesh position={[0, .367, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[1.4, 24]} /><meshStandardMaterial color="#343c29" roughness={1} />
    </mesh>
    <Branch from={[0, .3, 0]} to={[.06, 3.8, .04]} radius={.15} />
    <group ref={crown} position={[0, 2.1, 0]}>
      {branches.map((branch, i) => <Branch key={i} {...branch} radius={.075} />)}
      <instancedMesh ref={leaves} args={[null, null, count]} castShadow receiveShadow>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial roughness={.87} />
      </instancedMesh>
    </group>
  </group>;
}

export default function RiversideTrees() {
  return <group name="Wind_animated_riverside_trees">
    {[-62, -45, -28, -7, 7, 28, 45, 62].map((x, i) => <RiversideTree key={x} x={x} seed={1729 + i * 431} />)}
  </group>;
}
