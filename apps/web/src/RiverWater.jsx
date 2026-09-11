import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Photorealistic Flowing Huangpu River Water Component
 * Custom procedural water shader that simulates natural gentle river flow,
 * specularity, moonlight shimmer, and zero-flicker depth polygon offset.
 */
export default function RiverWater() {
  const meshRef = useRef();

  const uniforms = useMemo(() => ({
    uTime: { value: 0.0 },
    uDeepColor: { value: new THREE.Color('#031422') },
    uSurfaceColor: { value: new THREE.Color('#0b3b5c') },
    uCrestColor: { value: new THREE.Color('#2288b8') }
  }), []);

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vWave;

    void main() {
      vUv = uv;
      vec3 pos = position;
      // Gentle dual-frequency waves flowing eastwards along X axis
      float wave1 = sin(pos.x * 0.18 + uTime * 1.8) * cos(pos.y * 0.12 + uTime * 1.2) * 0.10;
      float wave2 = sin(pos.x * 0.45 - uTime * 2.2 + pos.y * 0.3) * 0.05;
      pos.z += wave1 + wave2;
      vWave = wave1 + wave2;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uDeepColor;
    uniform vec3 uSurfaceColor;
    uniform vec3 uCrestColor;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vWave;

    void main() {
      // Flowing ripples
      float ripple1 = sin(vWorldPos.x * 1.2 + uTime * 2.5 + sin(vWorldPos.z * 0.8)) * 0.5 + 0.5;
      float ripple2 = cos(vWorldPos.z * 1.5 - uTime * 1.8 + vWorldPos.x * 0.6) * 0.5 + 0.5;
      float sparkle = pow(ripple1 * ripple2, 3.5) * 0.85;

      // Depth gradient based on wave height
      vec3 waterColor = mix(uDeepColor, uSurfaceColor, vWave * 2.5 + 0.5);
      // Add sparkling moonlit reflections & skyline glow
      waterColor += uCrestColor * sparkle;

      gl_FragColor = vec4(waterColor, 0.94);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.92, -73.1]}
      receiveShadow={false}
    >
      {/* 280m long x 126m wide flowing river surface covering wide Huangpu channel */}
      <planeGeometry args={[280, 126, 80, 36]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        polygonOffset={true}
        polygonOffsetFactor={-2.0}
        polygonOffsetUnits={-2.0}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}
