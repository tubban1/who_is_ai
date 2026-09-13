import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Vector3 } from 'three';

export default function AtmosphereSky({ timeOfDay }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uDay: { value: timeOfDay === 'day' ? 1 : 0 },
    uZenith: { value: new Color(timeOfDay === 'day' ? '#4a98cc' : '#030b17') },
    uHorizon: { value: new Color(timeOfDay === 'day' ? '#d3e9ed' : '#1b3549') },
    uSun: { value: new Vector3(-.48, .72, -.5).normalize() },
  }), [timeOfDay]);
  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });
  return <mesh frustumCulled={false} renderOrder={-100}>
    <sphereGeometry args={[700, 32, 16]} />
    <shaderMaterial key={timeOfDay} side={BackSide} depthWrite={false} uniforms={uniforms}
      vertexShader={`varying vec3 vDirection;
        void main() { vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
      fragmentShader={`
        uniform float uTime, uDay;
        uniform vec3 uZenith, uHorizon, uSun;
        varying vec3 vDirection;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        float clouds(vec2 p) { return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.07); }
        void main() {
          vec3 d=normalize(vDirection);
          vec3 color=mix(uHorizon,uZenith,pow(max(d.y,0.0),.45));
          vec2 plane=d.xz/max(.12,d.y)*1.4+vec2(uTime*.007,uTime*.003);
          float cloud=smoothstep(.48,.73,clouds(plane))*smoothstep(.02,.25,d.y);
          color=mix(color,mix(vec3(.07,.1,.14),vec3(.95,.97,1),uDay),cloud*mix(.2,.82,uDay));
          float sun=dot(d,uSun);
          color+=vec3(1,.87,.59)*pow(max(sun,0.0),32.0)*.14*uDay;
          color+=vec3(3,2.6,1.8)*smoothstep(.9994,.9997,sun)*uDay;
          float moon=dot(d,normalize(vec3(.5,.64,-.75)));
          color+=vec3(.52,.65,.81)*smoothstep(.9995,.9998,moon)*(1.0-uDay);
          color+=vec3(.12,.18,.25)*pow(max(moon,0.0),300.0)*(1.0-uDay);
          vec2 stars=vec2(atan(d.z,d.x),asin(d.y))*240.0;
          float star=step(.995,hash(floor(stars)))*(1.0-smoothstep(.03,.14,length(fract(stars)-.5)));
          color+=vec3(.5,.63,.8)*star*(1.0-uDay)*smoothstep(.08,.5,d.y);
          gl_FragColor=vec4(color,1);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}
