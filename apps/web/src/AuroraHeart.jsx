import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { heartbeat } from './atmosphere.js';

// Screen sits in front of the old model's letters and relief, on the Bund-facing wall.
export default function AuroraHeart({ timeOfDay }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uBeat: { value: 0 }, uNight: { value: 0 } }), []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uBeat.value = heartbeat(clock.elapsedTime);
    uniforms.uNight.value = timeOfDay === 'night' ? 1 : 0;
  });
  return <group name="Aurora_Animated_LED_Display" position={[-34, 30, -127.75]}>
    <mesh>
      <planeGeometry args={[16.45, 31.9]} />
      <shaderMaterial uniforms={uniforms}
        vertexShader={`varying vec2 vUv;
          void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime, uBeat, uNight;
          float heart(vec2 p) {
            float a=dot(p,p)-1.0;
            return a*a*a-p.x*p.x*p.y*p.y*p.y;
          }
          void main() {
            vec2 grid=vec2(72,144);
            float distanceBlend=smoothstep(.3,1.0,fwidth(vUv.x)*grid.x);
            vec2 uv=mix((floor(vUv*grid)+.5)/grid,vUv,distanceBlend);
            vec2 p=(uv-vec2(.5,.55))*vec2(2.85,5.6)/(1.0+.085*uBeat);
            float field=heart(p);
            float edge=max(fwidth(field),.008);
            float filled=1.0-smoothstep(-edge,edge,field);
            float inner=1.0-smoothstep(-edge,edge,heart(p*1.075));
            float outline=max(0.0,filled-inner);
            float scan=exp(-pow((uv.y-fract(uTime*.24))/.045,2.0));
            float pixel=mix(1.0-smoothstep(.28,.49,length(fract(vUv*grid)-.5)),1.0,distanceBlend);
            vec3 base=vec3(.004,.007,.012);
            float power=mix(.75,1.6,uNight)*(1.0+.55*uBeat);
            vec3 red=vec3(1.0,.002,.016)*filled*power;
            red+=vec3(1.0,.035,.06)*outline*(.4+scan*.9)*mix(.5,1.0,uNight);
            red+=vec3(.75,.005,.025)*scan*filled*.45;
            // Quiet perimeter and a moving row of LED points beneath the heart.
            float border=step(.974,max(abs(uv.x-.5)*2.0,abs(uv.y-.5)*2.0));
            float row=(1.0-smoothstep(.005,.012,abs(uv.y-.16)))*step(.16,uv.x)*step(uv.x,.84);
            float travel=.3+.7*pow(.5+.5*sin(uv.x*30.0-uTime*2.0),4.0);
            vec3 color=base+red*pixel+vec3(.18,.09,.025)*border+vec3(.6,.06,.09)*row*travel*pixel;
            gl_FragColor=vec4(color,1);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
  </group>;
}
