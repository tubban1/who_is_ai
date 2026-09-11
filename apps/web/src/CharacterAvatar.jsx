import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Deterministic hash to give each character a unique, stylish aesthetic
function getStylePalette(id = '', isPlayer = false) {
  if (isPlayer) {
    return {
      jacket: '#0284c7',
      jacketTrim: '#38bdf8',
      pants: '#0f172a',
      hair: '#1e293b',
      skin: '#fed7aa',
      shoes: '#0369a1',
      glow: '#38bdf8',
      acc: '#f59e0b',
      role: '你 (You)',
      icon: '⭐'
    };
  }

  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const PALETTES = [
    { jacket: '#e11d48', jacketTrim: '#fb7185', pants: '#18181b', hair: '#09090b', skin: '#fecdd3', shoes: '#be123c', glow: '#fb7185', acc: '#fcd34d', icon: '🌸' },
    { jacket: '#0d9488', jacketTrim: '#2dd4bf', pants: '#0f172a', hair: '#1e293b', skin: '#fed7aa', shoes: '#115e59', glow: '#2dd4bf', acc: '#38bdf8', icon: '🌿' },
    { jacket: '#7c3aed', jacketTrim: '#c084fc', pants: '#1e1b4b', hair: '#312e81', skin: '#fde047', shoes: '#6d28d9', glow: '#c084fc', acc: '#f43f5e', icon: '🔮' },
    { jacket: '#d97706', jacketTrim: '#fbbf24', pants: '#292524', hair: '#1c1917', skin: '#fef08a', shoes: '#b45309', glow: '#fbbf24', acc: '#06b6d4', icon: '☀️' },
    { jacket: '#2563eb', jacketTrim: '#60a5fa', pants: '#020617', hair: '#0f172a', skin: '#fed7aa', shoes: '#1d4ed8', glow: '#60a5fa', acc: '#10b981', icon: '⚡' },
    { jacket: '#db2777', jacketTrim: '#f472b6', pants: '#18181b', hair: '#3f3f46', skin: '#ffedd5', shoes: '#be185d', glow: '#f472b6', acc: '#fbbf24', icon: '✨' },
  ];

  const p = PALETTES[hash % PALETTES.length];
  return {
    ...p,
    role: '漫步者',
  };
}

/**
 * CharacterAvatar - Delicate, stylish 3D character with procedural movement animations
 */
export default function CharacterAvatar({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  displayName = 'Guest',
  id = 'guest',
  isPlayer = false,
  isNear = false,
  moving = null,
  onClick,
  hideBadge = false
}) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();

  const prevPos = useRef(new THREE.Vector3(...position));
  const isMoving = useRef(false);

  const style = useMemo(() => getStylePalette(id + displayName, isPlayer), [id, displayName, isPlayer]);

  // Materials with subtle metallic sheen & luminous neon trims
  const mats = useMemo(() => ({
    jacket: new THREE.MeshStandardMaterial({ color: style.jacket, roughness: 0.45, metalness: 0.1 }),
    jacketTrim: new THREE.MeshStandardMaterial({ color: style.jacketTrim, emissive: style.jacketTrim, emissiveIntensity: 0.6, roughness: 0.2 }),
    pants: new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.5 }),
    skin: new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.6 }),
    shoes: new THREE.MeshStandardMaterial({ color: style.shoes, roughness: 0.3 }),
    soleGlow: new THREE.MeshStandardMaterial({ color: style.glow, emissive: style.glow, emissiveIntensity: 1.2 }),
    headphones: new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2 }),
    headphoneGlow: new THREE.MeshStandardMaterial({ color: style.glow, emissive: style.glow, emissiveIntensity: 1.5 }),
    accessory: new THREE.MeshStandardMaterial({ color: style.acc, metalness: 0.5, roughness: 0.3 }),
  }), [style]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const curX = position[0];
    const curZ = position[2];
    const dx = curX - prevPos.current.x;
    const dz = curZ - prevPos.current.z;
    const distMoved = Math.hypot(dx, dz);

    isMoving.current = distMoved > 0.015;
    prevPos.current.set(curX, position[1], curZ);

    const activeMoving = moving !== null ? Boolean(moving) : isMoving.current;

    if (activeMoving) {
      // Dynamic Stride Walk Animation
      const strideFreq = 11.0;
      const swing = Math.sin(t * strideFreq);
      const bounce = Math.abs(Math.sin(t * strideFreq)) * 0.08;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.65;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.65;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.55;

      if (bodyRef.current) {
        bodyRef.current.position.y = 0.95 + bounce;
        bodyRef.current.rotation.x = 0.08; // Lean forward while walking
        bodyRef.current.rotation.z = Math.sin(t * strideFreq * 0.5) * 0.04;
      }
    } else {
      // Gentle Idle Breathing & Arm Sway
      const breath = Math.sin(t * 2.4) * 0.025;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.06;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.8) * 0.06;

      if (bodyRef.current) {
        bodyRef.current.position.y = 0.95 + breath;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.z = 0;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.2) * 0.08;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} onClick={onClick}>
      {/* 1. Contact Ambient Ground Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.0, 0.52, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* 2. Interactive Proximity Aura Ring */}
      {isNear && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.62, 0.82, 32]} />
          <meshBasicMaterial color={style.glow} transparent opacity={0.75} />
        </mesh>
      )}

      {/* 3. Articulated Legs */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.15, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} material={mats.pants}>
          <cylinderGeometry args={[0.08, 0.07, 0.72, 12]} />
        </mesh>
        {/* Sneaker */}
        <mesh position={[0, -0.76, 0.06]} material={mats.shoes}>
          <boxGeometry args={[0.13, 0.12, 0.26]} />
        </mesh>
        {/* Sneaker LED Sole */}
        <mesh position={[0, -0.81, 0.06]} material={mats.soleGlow}>
          <boxGeometry args={[0.135, 0.025, 0.265]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.15, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} material={mats.pants}>
          <cylinderGeometry args={[0.08, 0.07, 0.72, 12]} />
        </mesh>
        {/* Sneaker */}
        <mesh position={[0, -0.76, 0.06]} material={mats.shoes}>
          <boxGeometry args={[0.13, 0.12, 0.26]} />
        </mesh>
        {/* Sneaker LED Sole */}
        <mesh position={[0, -0.81, 0.06]} material={mats.soleGlow}>
          <boxGeometry args={[0.135, 0.025, 0.265]} />
        </mesh>
      </group>

      {/* 4. Upper Body & Torso */}
      <group ref={bodyRef} position={[0, 0.95, 0]}>
        {/* Waist & Hips */}
        <mesh position={[0, 0.0, 0]} material={mats.pants}>
          <boxGeometry args={[0.38, 0.18, 0.24]} />
        </mesh>

        {/* Jacket / Hoodie Torso */}
        <mesh position={[0, 0.32, 0]} material={mats.jacket}>
          <boxGeometry args={[0.44, 0.52, 0.28]} />
        </mesh>

        {/* Cyber Neon Zipper / Seam */}
        <mesh position={[0, 0.32, 0.142]} material={mats.jacketTrim}>
          <boxGeometry args={[0.04, 0.50, 0.015]} />
        </mesh>

        {/* High Collar */}
        <mesh position={[0, 0.58, 0.02]} material={mats.jacketTrim}>
          <cylinderGeometry args={[0.14, 0.16, 0.12, 12]} />
        </mesh>

        {/* Shoulder Sling Bag / Badge */}
        <mesh position={[-0.12, 0.26, 0.14]} material={mats.accessory}>
          <boxGeometry args={[0.12, 0.10, 0.04]} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.28, 0.50, 0]}>
          <mesh position={[0, -0.25, 0]} material={mats.jacket}>
            <cylinderGeometry args={[0.07, 0.06, 0.52, 10]} />
          </mesh>
          <mesh position={[0, -0.52, 0]} material={mats.skin}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.28, 0.50, 0]}>
          <mesh position={[0, -0.25, 0]} material={mats.jacket}>
            <cylinderGeometry args={[0.07, 0.06, 0.52, 10]} />
          </mesh>
          <mesh position={[0, -0.52, 0]} material={mats.skin}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
        </group>

        {/* Head & Hair & Headphones */}
        <group ref={headRef} position={[0, 0.74, 0.02]}>
          {/* Head Sphere */}
          <mesh material={mats.skin}>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>

          {/* Hair Mesh (Volumetric anime styled haircut) */}
          <mesh position={[0, 0.06, -0.02]} material={mats.hair}>
            <sphereGeometry args={[0.19, 16, 16]} />
          </mesh>
          <mesh position={[0, 0.14, 0.06]} material={mats.hair} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.26, 0.12, 0.24]} />
          </mesh>
          {/* Fringe Bangs */}
          <mesh position={[0, 0.08, 0.14]} material={mats.hair} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.1]} />
          </mesh>

          {/* Eyes (Stylized dark pupils) */}
          <mesh position={[-0.07, 0.02, 0.165]} material={mats.hair}>
            <boxGeometry args={[0.035, 0.035, 0.01]} />
          </mesh>
          <mesh position={[0.07, 0.02, 0.165]} material={mats.hair}>
            <boxGeometry args={[0.035, 0.035, 0.01]} />
          </mesh>

          {/* Cyber Headphones */}
          {/* Headband */}
          <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]} material={mats.headphones}>
            <torusGeometry args={[0.19, 0.025, 8, 16, Math.PI]} />
          </mesh>
          {/* Left Earcup */}
          <mesh position={[-0.19, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.headphones}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 12]} />
          </mesh>
          <mesh position={[-0.21, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.headphoneGlow}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
          </mesh>
          {/* Right Earcup */}
          <mesh position={[0.19, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.headphones}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 12]} />
          </mesh>
          <mesh position={[0.21, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.headphoneGlow}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
          </mesh>
        </group>
      </group>

      {/* 5. Refined Floating Nameplate & HUD Card */}
      {!hideBadge && (
        <Html position={[0, 2.35, 0]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div style={{
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            userSelect: 'none'
          }}>
            {/* Main Name Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: '12px',
              color: isPlayer ? '#38bdf8' : (isNear ? '#fef08a' : '#f1f5f9'),
              background: isNear
                ? 'rgba(15, 23, 42, 0.92)'
                : 'rgba(10, 15, 26, 0.80)',
              border: isNear
                ? `1.5px solid ${style.glow}`
                : (isPlayer ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.16)'),
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: isNear
                ? `0 4px 18px rgba(0,0,0,0.6), 0 0 12px ${style.glow}66`
                : '0 2px 10px rgba(0,0,0,0.45)',
              transform: isNear ? 'scale(1.05)' : 'scale(1.0)',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ fontSize: '12px' }}>{style.icon}</span>
              <span>{displayName}</span>
            </div>

            {/* Interactive Proximity Callout */}
            {isNear && !isPlayer && (
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)',
                animation: 'pulse 1.5s infinite'
              }}>
                按 E 对话 [TALK]
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
