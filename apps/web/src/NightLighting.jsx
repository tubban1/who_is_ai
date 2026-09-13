import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ATMOSPHERES } from './atmosphere.js';

export default function NightLighting({ timeOfDay = 'night' }) {
  const { gl, scene } = useThree();
  const moon = useRef();
  const target = useRef();
  const streetLights = useRef([]);
  const day = timeOfDay === 'day';
  useEffect(() => {
    // Locally generated reflection lighting; no remote HDR download is needed.
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const map = generator.fromScene(room, .04);
    const previous = scene.environment;
    scene.environment = map.texture;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = previous;
      map.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    const previousExposure = gl.toneMappingExposure;
    const previousIntensity = scene.environmentIntensity;
    gl.toneMappingExposure = ATMOSPHERES[timeOfDay].exposure;
    scene.environmentIntensity = ATMOSPHERES[timeOfDay].environment;
    return () => { gl.toneMappingExposure = previousExposure; scene.environmentIntensity = previousIntensity; };
  }, [gl, scene, timeOfDay]);
  useFrame(({ camera, clock }) => {
    if (!moon.current || !target.current) return;
    // Follow the player so shadows retain detail across the entire promenade.
    const x = camera.position.x;
    const t = clock.elapsedTime;
    // Very slow solar travel and light cloud cover modulate real shadow maps.
    const sunAngle = t * .0015;
    moon.current.position.set(x - 22 + Math.sin(sunAngle) * 7, day ? 34 : 28, day ? -26 : -18);
    moon.current.intensity = day ? 2.6 * (.92 + .08 * Math.sin(t * .075)) : .65;
    target.current.position.set(x, 0, -4);
    target.current.updateMatrixWorld();
    moon.current.target = target.current;
    streetLights.current.forEach((light, index) => {
      if (light) light.intensity = day ? 0 : 48 * (1 + .025 * Math.sin(t * .8 + index));
    });
  });
  return <>
    <hemisphereLight args={[day ? '#c4e4fa' : '#739fca', day ? '#a59b7d' : '#30293b', day ? 1.05 : .52]} />
    <ambientLight intensity={day ? .12 : .1} />
    <object3D ref={target} />
    <directionalLight ref={moon} color={day ? '#fff0ce' : '#91b9f0'} intensity={day ? 2.6 : .65} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22}
      shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-near={1}
      shadow-camera-far={100} shadow-normalBias={.03} shadow-bias={-.00015} shadow-radius={2} />
    {[-66, -52, -38, -24, 18, 32, 46, 60].map((x, index) => <pointLight key={x} ref={light => { streetLights.current[index] = light; }} position={[x, 4.4, -10.2]} color="#ffd5a0" intensity={day ? 0 : 48} distance={18} decay={2} />)}
    <pointLight position={[0, 5.5, 3]} color="#f1d2ae" intensity={day ? 0 : 32} distance={24} decay={2} />
  </>;
}
