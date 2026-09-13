import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { heartbeat } from './atmosphere.js';

/**
 * Photorealistic Flowing Huangpu River Water Component
 * Custom procedural water shader that simulates natural gentle river flow,
 * specularity, moonlight shimmer, and zero-flicker depth polygon offset.
 */
export default function RiverWater({ timeOfDay = 'night' }) {
  const meshRef = useRef();

  const uniforms = useMemo(() => ({
    uTime: { value: 0.0 },
    uNight: { value: 1 },
    uBeat: { value: 0 },
    uDeepColor: { value: new THREE.Color('#101e24') },
    uSurfaceColor: { value: new THREE.Color('#344b54') },
    uCrestColor: { value: new THREE.Color('#a4b6b7') }
  }), []);
  useEffect(() => {
    const day = timeOfDay === 'day';
    uniforms.uNight.value = day ? 0 : 1;
    uniforms.uDeepColor.value.set(day ? '#286e7e' : '#071720');
    uniforms.uSurfaceColor.value.set(day ? '#83b9cd' : '#294957');
    uniforms.uCrestColor.value.set(day ? '#fff0ce' : '#829ba9');
  }, [timeOfDay, uniforms]);

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
    uniform float uNight, uBeat;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vWave;

    void main() {
      vec2 p = vWorldPos.xz;
      float ripple1 = sin(p.x * 2.1 + p.y * 1.3 + uTime * 1.1);
      float ripple2 = sin(p.x * .85 - p.y * 3.5 - uTime * 1.6);
      vec3 normal = normalize(vec3(ripple1 * .10, 1.0, ripple2 * .17));
      vec3 view = normalize(cameraPosition - vWorldPos);
      float fresnel = .035 + .965 * pow(1.0 - max(dot(normal, view), 0.0), 5.0);
      vec3 waterColor = mix(uDeepColor, uSurfaceColor, fresnel * .75);
      vec3 halfVector = normalize(view + normalize(mix(vec3(-.55,.8,-.65),vec3(-.5,.7,-.4),uNight)));
      float shimmer = pow(max(dot(normal, halfVector), 0.0), mix(100.0,180.0,uNight));
      waterColor += uCrestColor * shimmer * mix(2.4,.35,uNight);
      waterColor += uSurfaceColor * max(vWave,0.0) * .16;
      // Approximate fragmented landmark reflections along the river surface.
      // These are art-directed highlights, not ray-traced scene reflections.
      float breakup = pow(.5 + .5 * sin(p.y * 4.5 + ripple1 * 2.0 + uTime), 9.0);
      float drift = ripple1 * 1.8 + ripple2 * .7;
      float amber = exp(-pow((p.x + 34.0 + drift) / 7.0, 2.0));
      float pearl = exp(-pow((p.x + 10.0 + drift) / 4.0, 2.0));
      float blue = exp(-pow((p.x - 28.0 + drift) / 6.0, 2.0));
      float distanceFade = 1.0 - smoothstep(-95.0, -10.0, p.y);
      vec3 heartReflection=vec3(.58,.015,.06)*amber*(.65+.55*uBeat);
      vec3 pearlReflection=mix(vec3(.22,.07,.23),vec3(.06,.25,.35),.5+.5*sin(uTime*.3))*pearl;
      waterColor += (vec3(.18,.12,.035)*amber + heartReflection + pearlReflection + vec3(.10,.24,.4)*blue) * breakup * (.18 + .6 * distanceFade) * uNight;
      gl_FragColor = vec4(waterColor, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
      uniforms.uBeat.value = heartbeat(state.clock.elapsedTime);
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
        transparent={false}
        polygonOffset={true}
        polygonOffsetFactor={-2.0}
        polygonOffsetUnits={-2.0}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}
