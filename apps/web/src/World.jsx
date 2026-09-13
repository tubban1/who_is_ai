import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import RiverWater from './RiverWater.jsx';
import ErrorBoundary3D from './ErrorBoundary3D.jsx';

function Asset({url,position,scale=1,rotation=[0,0,0],tint}){
  const {scene}=useGLTF(url); const obj=useMemo(()=>scene.clone(true),[scene]);
  useMemo(()=>{
    obj.traverse(o=>{
      if(o.isMesh){
        o.castShadow=true;
        o.receiveShadow=true;
        if(tint){
          o.material=o.material.clone();
          o.material.color=new THREE.Color(tint);
        }
      }
    });
  },[obj,tint]);
  return <primitive object={obj} position={position} scale={scale} rotation={rotation}/>;
}

import CharacterAvatar from './CharacterAvatar.jsx';
import CityLightShow from './CityLightShow.jsx';
import RiversideTrees from './RiversideTrees.jsx';

function getGroundHeight(z) {
  // Elevated Bund sightseeing promenade is a level granite observation deck at height 1.2m
  return 1.2;
}

function Avatar({ p, near, conversationOpen, isTalking }) {
  const groupRef = useRef();
  const [moving, setMoving] = React.useState(false);
  const targetPos = useRef(new THREE.Vector3(p.x, getGroundHeight(p.z || 0), p.z || 0));
  const targetRot = useRef(p.rotation || 0);

  useEffect(() => {
    targetPos.current.set(p.x, getGroundHeight(p.z || 0), p.z || 0);
    targetRot.current = p.rotation || 0;
  }, [p.x, p.z, p.rotation]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const current = groupRef.current.position;
    const dx = targetPos.current.x - current.x;
    const dz = targetPos.current.z - current.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.02) {
      const lerpSpeed = 1 - Math.pow(0.01, dt);
      current.x += dx * lerpSpeed;
      current.z += dz * lerpSpeed;
      current.y = getGroundHeight(current.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRot.current,
        lerpSpeed
      );
      if (!moving) setMoving(true);
    } else {
      if (moving) setMoving(false);
    }
  });

  return (
    <group ref={groupRef} position={[p.x, getGroundHeight(p.z || 0), p.z || 0]} rotation={[0, p.rotation || 0, 0]}>
      <CharacterAvatar
        position={[0, 0, 0]}
        id={p.id}
        displayName={p.displayName}
        isNear={near}
        isTalking={isTalking}
        moving={moving}
        hideBadge={conversationOpen}
      />
    </group>
  );
}

import { t } from './i18n.js';
import { playSfx } from './audio.js';

function LocalPlayer({strangers,onNearest,onMoved,conversationOpen,language='zh',touchInput=null,conversation=null,uuid=null}){
  const ref=useRef();
  const keys=useRef({});
  const {camera}=useThree();
  const lastSend=useRef(0);
  const nearestRef=useRef(null);
  const lastEncounterId=useRef(null);
  const lastEncounterSoundTime=useRef(0);
  const [moving, setMoving] = React.useState(false);
  const currentLookAt = useRef(new THREE.Vector3(0, 7, -65));
  const lockedPartnerRef = useRef(null);

  useEffect(()=>{
    if (!conversationOpen) {
      lockedPartnerRef.current = null;
    }
  }, [conversationOpen]);

  useEffect(()=>{
    const d=e=>keys.current[e.code]=true, u=e=>keys.current[e.code]=false;
    window.addEventListener('keydown',d);
    window.addEventListener('keyup',u);
    return()=>{
      window.removeEventListener('keydown',d);
      window.removeEventListener('keyup',u);
    };
  },[]);

  useFrame((state,dt)=>{
    if(!ref.current) return;
    const k=keys.current;
    let x=0, z=0;
    if(!conversationOpen){
      if(k.KeyW||k.KeyZ||k.ArrowUp) z-=1;
      if(k.KeyS||k.ArrowDown) z+=1;
      if(k.KeyA||k.KeyQ||k.ArrowLeft) x-=1;
      if(k.KeyD||k.ArrowRight) x+=1;

      // Mobile Touch Joystick input overlay
      if (touchInput && (touchInput.x !== 0 || touchInput.y !== 0)) {
        x += touchInput.x;
        z += touchInput.y;
      }
    }
    const isLocalMoving = (Math.hypot(x, z) > 0.05);
    if (isLocalMoving !== moving) setMoving(isLocalMoving);

    if(isLocalMoving){
      playSfx('step');
      const len=Math.hypot(x,z);
      const nx = x / len;
      const nz = z / len;
      const isRunning = k.ShiftLeft || k.ShiftRight || (touchInput?.run);
      const speed = isRunning ? 8.0 : 4.6;
      ref.current.position.x=THREE.MathUtils.clamp(ref.current.position.x + nx*speed*dt, -66, 66);
      ref.current.position.z=THREE.MathUtils.clamp(ref.current.position.z + nz*speed*dt, -9.8, 8.0);
      ref.current.rotation.y=Math.atan2(nx, nz);
    }
    const p=ref.current.position;
    p.y = getGroundHeight(p.z);

    if (conversationOpen) {
      // Find and permanently lock the conversation partner for the dialogue duration
      let partner = null;
      const partnerId = conversation?.other?.id || conversation?.targetPublicId || conversation?.initiatorPublicId;

      if (lockedPartnerRef.current) {
        partner = strangers.find(s => s.id === lockedPartnerRef.current);
      }
      if (!partner && partnerId) {
        partner = strangers.find(s => s.id === partnerId);
        if (partner) lockedPartnerRef.current = partner.id;
      }
      if (!partner && nearestRef.current) {
        partner = nearestRef.current;
        lockedPartnerRef.current = partner.id;
      }

      if (partner) {
        // Cinematic Portrait Camera: Lock firmly onto partner's face
        const dx = p.x - partner.x;
        const dz = p.z - partner.z;
        const dist = Math.max(1.8, Math.hypot(dx, dz));
        const nx = dx / dist;
        const nz = dz / dist;
        const desiredCam = new THREE.Vector3(
          partner.x + nx * 2.2 + (-nz) * 0.38,
          p.y + 1.58,
          partner.z + nz * 2.2 + (nx) * 0.38
        );
        const desiredLook = new THREE.Vector3(partner.x, p.y + 1.54, partner.z);
        const lerpCam = 1 - Math.pow(0.003, dt);
        camera.position.lerp(desiredCam, lerpCam);
        currentLookAt.current.lerp(desiredLook, lerpCam);
        camera.lookAt(currentLookAt.current);
      } else {
        const desired = new THREE.Vector3(p.x, p.y + 2.4, p.z + 5.2);
        camera.position.lerp(desired, 1 - Math.pow(.002, dt));
        currentLookAt.current.lerp(new THREE.Vector3(p.x, p.y + 5.8, p.z - 65), 1 - Math.pow(.002, dt));
        camera.lookAt(currentLookAt.current);
      }
    } else {
      const desired = new THREE.Vector3(p.x, p.y + 2.4, p.z + 5.2);
      camera.position.lerp(desired, 1 - Math.pow(.002, dt));
      currentLookAt.current.lerp(new THREE.Vector3(p.x, p.y + 5.8, p.z - 65), 1 - Math.pow(.002, dt));
      camera.lookAt(currentLookAt.current);
    }

    // Proximity encounter with hysteresis (entry: 3.8m, exit: 4.6m)
    if (conversationOpen) {
      if (nearestRef.current !== null) {
        nearestRef.current = null;
        onNearest(null);
      }
    } else {
      const threshold = nearestRef.current ? 4.6 : 3.8;
      let best=null, bestD=Infinity;
      for(const s of strangers){
        const d=Math.hypot(s.x-p.x, s.z-p.z);
        if(d<bestD){ bestD=d; best=s; }
      }
      const n = bestD <= threshold ? best : null;

      if(n?.id !== nearestRef.current?.id){
        nearestRef.current = n;
        onNearest(n);

        if(n && n.id !== lastEncounterId.current){
          const now = Date.now();
          if(now - lastEncounterSoundTime.current > 4000){
            playSfx('encounter');
            lastEncounterSoundTime.current = now;
          }
          lastEncounterId.current = n.id;
        } else if (!n) {
          lastEncounterId.current = null;
        }
      }
    }

    if(state.clock.elapsedTime-lastSend.current>.15){
      lastSend.current=state.clock.elapsedTime;
      onMoved({x:p.x,z:p.z,rotation:ref.current.rotation.y});
    }
  });

  return (
    <group ref={ref} position={[0,1.2,-6]}>
      <CharacterAvatar
        position={[0, 0, 0]}
        id="player_local"
        displayName={t('youAvatar', language)}
        isPlayer={true}
        moving={moving}
        isTalking={conversationOpen}
        hideBadge={conversationOpen}
      />
    </group>
  );
}

export default function World({strangers,onNearest,onPlayerMoved,conversationOpen,language='zh',touchInput=null,timeOfDay='night',conversation=null,uuid=null}){
  const [nearestId, setNearestId] = React.useState(null);
  const handleNearest = React.useCallback((n) => {
    setNearestId(n?.id || null);
    if (onNearest) onNearest(n);
  }, [onNearest]);

  const partnerId = conversation?.other?.id || conversation?.targetPublicId || conversation?.initiatorPublicId;

  return <>
    {/* Shanghai The Bund & Lujiazui Dynamic Light Show & Megacity Environment */}
    <ErrorBoundary3D fallback={null}>
      <Suspense fallback={null}>
        <CityLightShow timeOfDay={timeOfDay} />
      </Suspense>
    </ErrorBoundary3D>
    {/* Flowing Huangpu River with sparkling ripples & zero-flicker depth offset */}
    <RiverWater timeOfDay={timeOfDay} />
    <RiversideTrees />
    {/* Dynamic Strangers (AI / Humans) */}
    {strangers.map(s => {
      const isPartner = conversationOpen && (partnerId ? partnerId === s.id : nearestId === s.id);
      return (
        <Avatar
          p={s}
          key={s.id}
          near={nearestId === s.id && !conversationOpen}
          isTalking={isPartner}
          conversationOpen={conversationOpen}
        />
      );
    })}
    {/* Local Controllable Player */}
    <LocalPlayer strangers={strangers} onNearest={handleNearest} onMoved={onPlayerMoved} conversationOpen={conversationOpen} conversation={conversation} uuid={uuid} language={language} touchInput={touchInput}/>
  </>;
}
