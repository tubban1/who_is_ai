import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import AuroraHeart from './AuroraHeart.jsx';

/**
 * CityLightShow - Real-time dynamic neon light show controller for Shanghai Bund & Lujiazui
 * Features:
 * - Dynamic asynchronous feature neon on each individual landmark
 * - Grand synchronized city-wide illumination waves (全城共辉灯光秀)
 * - Interactive HUD control pill for instant mode switching
 */
export default function CityLightShow({
  url = '/assets/plaza_environment.glb?v=shanghai_v10_postcard',
  onPhaseChange,
  timeOfDay = 'night'
}) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => scene.clone(true), [scene]);

  // Mode: 'auto' (alternates organic individual rhythms with periodic city sweeps)
  const lightMode = 'auto';
  const [currentPhase, setCurrentPhase] = useState('random');

  // Collected mesh groups for animated neon manipulation
  const lightGroups = useMemo(() => {
    const groups = {
      // Aurora Plaza
      auroraHeart: [],
      auroraScreen: [],
      auroraText: [],
      auroraCrown: [],
      auroraNeonVertical: [],
      auroraScreenNeon: [],
      // Citigroup Tower
      citiLogo: [],
      citiText: [],
      citiRibbons: [],
      citiCrown: [],
      citiNeonPillars: [],
      // Oriental Pearl
      pearlBelts: [],
      pearlBeacon: [],
      pearlCabins: [],
      pearlMiniPearls: [],
      skybridgeGlow: [],
      // Convention Center
      conventionGlobes: [],
      // Shanghai Tower
      shanghaiRings: [],
      shanghaiCrown: [],
      shanghaiLaser: [],
      // SWFC
      swfcApex: [],
      swfcSkybridge: [],
      swfcEdges: [],
      swfcAperture: [],
      // Jin Mao Tower
      jinmaoTiers: [],
      jinmaoSpire: [],
      // IFC Twin Towers
      ifcBeacons: [],
      ifcNeon: [],
      // Customs House
      customsClock: [],
      customsFlood: [],
      // Peace Hotel
      peaceRoof: [],
      peaceFlood: [],
      // Waibaidu Bridge
      waibaidu: [],
      // Backdrop towers
      pudongCrowns: [],
      pudongEdges: [],
      pudongAntennas: [],
      backdropWindows: [],
      // Cruise ships
      boats: [],
      // Materials that need a clean day/night transition.
      allEmissive: [],
      allSurfaces: []
    };

    obj.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      // Clone material so changes don't cross-contaminate. Keep the original
      // emissive state on each clone so switching back from daytime can
      // restore the GLB's authored values before the night animation resumes.
      if (child.material) {
        const cloneMaterial = (source) => {
          const material = source.clone();
          if (material.emissive) {
            groups.allEmissive.push({
              material,
              color: material.emissive.clone(),
              intensity: material.emissiveIntensity ?? 1
            });
          }
          if (/ground|floor|deck|promenade|plaza|asphalt|granite|pavement|stone/i.test(child.name || source.name)) {
            groups.allSurfaces.push(material);
          }
          return material;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(cloneMaterial)
          : cloneMaterial(child.material);
      }

      const name = child.name;

      // Hide old deformed extruded 3D hearts from the base model, as AuroraHeart provides the true flat LED screen
      if (name.includes('Aurora_Heart')) {
        child.visible = false;
        return;
      }

      if (name.includes('Aurora_LED_Screen')) groups.auroraScreen.push(child);
      else if (name.includes('Aurora_Text')) groups.auroraText.push(child);
      else if (name.includes('Aurora_Crown')) groups.auroraCrown.push(child);
      else if (name.includes('Aurora_NeonVertical')) groups.auroraNeonVertical.push(child);
      else if (name.includes('Aurora_ScreenNeon')) groups.auroraScreenNeon.push(child);
      else if (name.includes('Citi_RedArc')) groups.citiLogo.push(child);
      else if (name.includes('Citi_Text')) groups.citiText.push(child);
      else if (name.includes('Citi_Ribbon')) groups.citiRibbons.push(child);
      else if (name.includes('Citi_Crown')) groups.citiCrown.push(child);
      else if (name.includes('Citi_NeonPillar')) groups.citiNeonPillars.push(child);
      else if (name.includes('Pearl_') && (name.includes('GlowBelt') || name.includes('LightBand'))) groups.pearlBelts.push(child);
      else if (name.includes('Pearl_BeaconLight')) groups.pearlBeacon.push(child);
      else if (name.includes('Pearl_SpaceCabin')) groups.pearlCabins.push(child);
      else if (name.includes('Pearl_Mini')) groups.pearlMiniPearls.push(child);
      else if (name.includes('Convention_Globe')) groups.conventionGlobes.push(child);
      else if (name.includes('Skybridge_') && name.includes('Glow')) groups.skybridgeGlow.push(child);
      else if (name.includes('ShanghaiTower_Ring')) groups.shanghaiRings.push(child);
      else if (name.includes('ShanghaiTower_Crown')) groups.shanghaiCrown.push(child);
      else if (name.includes('ShanghaiTower_Laser')) groups.shanghaiLaser.push(child);
      else if (name.includes('SWFC_ApexGlow')) groups.swfcApex.push(child);
      else if (name.includes('SWFC_Skybridge')) groups.swfcSkybridge.push(child);
      else if (name.includes('SWFC_Edge')) groups.swfcEdges.push(child);
      else if (name.includes('SWFC_Aperture')) groups.swfcAperture.push(child);
      else if (name.includes('JinMao_Glow')) groups.jinmaoTiers.push(child);
      else if (name.includes('JinMao_Spire')) groups.jinmaoSpire.push(child);
      else if (name.includes('IFC_') && name.includes('Beacon')) groups.ifcBeacons.push(child);
      else if (name.includes('IFC_') && name.includes('Neon')) groups.ifcNeon.push(child);
      else if (name.includes('Customs_Clock')) groups.customsClock.push(child);
      else if (name.includes('Customs_BaseFlood')) groups.customsFlood.push(child);
      else if (name.includes('Peace_Hotel_PyramidRoof') || name.includes('Peace_Dormer')) groups.peaceRoof.push(child);
      else if (name.includes('Peace_Hotel_Flood') || name.includes('Peace_Hotel_Marquee')) groups.peaceFlood.push(child);
      else if (name.includes('Waibaidu_')) groups.waibaidu.push(child);
      else if (name.includes('Pudong_Crown')) groups.pudongCrowns.push(child);
      else if (name.includes('Pudong_Edge')) groups.pudongEdges.push(child);
      else if (name.includes('Pudong_Antenna')) groups.pudongAntennas.push(child);
      else if (name.includes('Pudong_Win')) groups.backdropWindows.push(child);
      else if (name.includes('Cruise_')) groups.boats.push(child);
    });

    return groups;
  }, [obj]);

  useEffect(() => {
    const isDay = timeOfDay === 'day';
    lightGroups.allSurfaces.forEach(material => {
      material.roughness = isDay ? 0.82 : 0.68;
      material.metalness = 0.04;
    });
    lightGroups.allEmissive.forEach(({ material, color, intensity }) => {
      if (isDay) {
        material.emissiveIntensity = 0;
      } else {
        material.emissive.copy(color);
        material.emissiveIntensity = intensity;
      }
    });
  }, [lightGroups, timeOfDay]);

  useEffect(() => {
    console.log('[CityLightShow Groups]', JSON.stringify(Object.fromEntries(Object.entries(lightGroups).map(([k, v]) => [k, v.length]))));
  }, [lightGroups]);

  useFrame((state) => {
    if (timeOfDay === 'day') return;
    const t = state.clock.elapsedTime;

    // Macro cycle: 45-second cycle (35s peaceful individual night breathing, 10s synchronized skyline wave)
    let isSync = false;
    if (lightMode === 'sync') {
      isSync = true;
    } else if (lightMode === 'auto') {
      const cycle = t % 45;
      isSync = cycle >= 35;
    }

    if (currentPhase !== (isSync ? 'sync' : 'random')) {
      const nextP = isSync ? 'sync' : 'random';
      setCurrentPhase(nextP);
      if (onPhaseChange) onPhaseChange(nextP);
    }

    // Colors - elegant Shanghai night neon palette
    const cyan = new THREE.Color('#38bdf8');
    const magenta = new THREE.Color('#f43f5e');
    const amber = new THREE.Color('#fbbf24');
    const red = new THREE.Color('#ef4444');
    const white = new THREE.Color('#f8fafc');

    if (isSync) {
      // ==================== 全城同步灯光秀 (SYNCHRONIZED CITY ILLUMINATION) ====================
      // Slow, majestic light wave washing across Lujiazui towers
      const waveFreq = 0.35;
      const globalPulse = (Math.sin(t * waveFreq) + 1) * 0.5; // Smooth 0 to 1
      const syncIntensity = 1.8 + globalPulse * 1.0; // Gentle, elegant 1.8 to 2.8

      // Slowly alternating theme color (every ~15 seconds)
      const themeColor = Math.sin(t * 0.2) > 0 ? cyan : magenta;

      // 1. Aurora Plaza
      lightGroups.auroraScreen.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 0.85;
      });
      lightGroups.auroraText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });
      lightGroups.auroraNeonVertical.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });
      lightGroups.auroraScreenNeon.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 0.9;
      });
      lightGroups.auroraCrown.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 0.9;
      });

      // 2. Citigroup Tower
      lightGroups.citiLogo.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });
      lightGroups.citiRibbons.forEach((m, i) => {
        const ribbonWave = Math.sin(t * 0.7 - i * 0.25) > 0 ? syncIntensity * 1.1 : 1.2;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = ribbonWave;
      });
      lightGroups.citiNeonPillars.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });
      lightGroups.citiCrown.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });

      // 3. Oriental Pearl
      lightGroups.pearlBelts.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });
      lightGroups.pearlBeacon.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.8 * (Math.sin(t * 0.8) * 0.5 + 0.5);
      });
      lightGroups.skybridgeGlow.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 0.9;
      });

      // 4. Shanghai Tower Rings & Crown
      lightGroups.shanghaiRings.forEach((m, i) => {
        const active = Math.sin(t * 0.6 - i * 0.2) > 0;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = active ? syncIntensity * 1.2 : 1.2;
      });
      lightGroups.shanghaiCrown.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });

      // 5. SWFC Apex, Skybridge & Edges
      lightGroups.swfcApex.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });
      lightGroups.swfcEdges.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });
      lightGroups.swfcSkybridge.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });

      // 6. Jin Mao Tower
      lightGroups.jinmaoTiers.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });
      lightGroups.jinmaoSpire.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });

      // 7. IFC Twin Towers
      lightGroups.ifcNeon.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.0;
      });
      lightGroups.ifcBeacons.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });

      // 8. Background Towers Crowns & Edges
      lightGroups.pudongCrowns.forEach((m) => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 0.9;
      });
      lightGroups.pudongEdges.forEach((m) => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 0.9;
      });
      lightGroups.pudongAntennas.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.4 * (Math.sin(t * 1.0) * 0.5 + 0.5);
      });
      lightGroups.backdropWindows.forEach((m, i) => {
        const wWave = Math.sin(t * 0.5 + i * 0.1) > 0 ? syncIntensity * 0.9 : 1.2;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = wWave;
      });

      // 9. Customs Clock & Heritage
      lightGroups.customsClock.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 2.4 + globalPulse * 0.6;
      });
      lightGroups.waibaidu.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 2.2 + globalPulse * 0.5;
      });

    } else {
      // ==================== 各楼独特温和漫步霓虹 (ORGANIC INDIVIDUAL NIGHT RHYTHM) ====================

      // 1. 震旦大厦 (Aurora Plaza) - 屏幕与金色边框温和呼吸
      lightGroups.auroraScreen.forEach(m => {
        const screenHue = (Math.sin(t * 0.3) + 1) * 0.5;
        m.material.emissive.lerpColors(new THREE.Color('#7f1d1d'), new THREE.Color('#92400e'), screenHue);
        m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.5) * 0.6;
      });
      lightGroups.auroraText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.5 + Math.sin(t * 0.6) * 0.6;
      });
      lightGroups.auroraNeonVertical.forEach((m, idx) => {
        const vPulse = Math.sin(t * 0.7 + idx * 0.6) * 0.5 + 0.5;
        m.material.emissiveIntensity = 1.8 + vPulse * 0.8;
      });
      lightGroups.auroraScreenNeon.forEach(m => {
        m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.5) * 0.5;
      });
      lightGroups.auroraCrown.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.4) * 0.6;
      });

      // 2. 花旗集团大厦 (Citigroup Tower) - 优雅慢速呼吸与流光
      const citiPulse = (Math.sin(t * 0.6) + 1) * 0.5;
      lightGroups.citiLogo.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = 2.2 + citiPulse * 0.8;
      });
      lightGroups.citiText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.5 + citiPulse * 0.6;
      });
      lightGroups.citiRibbons.forEach((m, i) => {
        const wave = Math.sin(t * 0.8 - i * 0.3);
        m.material.emissive.copy(wave > 0 ? cyan : new THREE.Color('#0284c7'));
        m.material.emissiveIntensity = 1.8 + Math.max(0, wave) * 0.8;
      });
      lightGroups.citiNeonPillars.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 2.0 + citiPulse * 0.6;
      });
      lightGroups.citiCrown.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 2.0 + citiPulse * 0.6;
      });

      // 3. 东方明珠 (Oriental Pearl) - 温柔旋转探照灯与三球漫漫微光
      const pearlCycle = (Math.sin(t * 0.35) + 1) * 0.5;
      const pearlColor = pearlCycle > 0.5 ? magenta : cyan;
      lightGroups.pearlBelts.forEach((m, idx) => {
        const flow = Math.sin(t * 0.7 + idx * 0.8) * 0.5 + 0.5;
        m.material.emissive.copy(pearlColor);
        m.material.emissiveIntensity = 1.8 + flow * 0.8;
      });
      lightGroups.pearlCabins.forEach(m => {
        m.material.emissive.copy(magenta);
        m.material.emissiveIntensity = 2.2 + Math.sin(t * 0.4) * 0.5;
      });
      lightGroups.pearlBeacon.forEach(m => {
        m.material.emissive.copy(white);
        // Smooth rotating beacon rather than sharp strobe
        m.material.emissiveIntensity = 2.8 * (Math.sin(t * 0.8) * 0.5 + 0.5);
      });
      lightGroups.pearlMiniPearls.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 1.8 + Math.sin(t * 0.5) * 0.4;
      });
      lightGroups.conventionGlobes.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 1.8 + Math.sin(t * 0.4) * 0.4;
      });

      // 4. 上海中心大厦 (Shanghai Tower) - 柔缓呼吸圆环
      lightGroups.shanghaiRings.forEach((m, i) => {
        const ringProgress = (t * 0.6 - i * 0.25) % Math.PI;
        const ringGlow = Math.sin(ringProgress);
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 1.8 + (ringGlow > 0 ? ringGlow * 1.0 : 0);
      });
      lightGroups.shanghaiCrown.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 2.4 + Math.sin(t * 0.5) * 0.6;
      });

      // 5. 环球金融中心 (SWFC) - 典雅开瓶器慢光
      const swfcPulse = Math.sin(t * 0.5);
      lightGroups.swfcApex.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 2.2 + swfcPulse * 0.5;
      });
      lightGroups.swfcEdges.forEach((m, i) => {
        const edgeGlow = Math.sin(t * 0.6 + i * 0.3) * 0.5 + 0.5;
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 1.8 + edgeGlow * 0.6;
      });
      lightGroups.swfcSkybridge.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 2.0 + swfcPulse * 0.4;
      });

      // 6. 金茂大厦 (Jin Mao Tower) - 经典温暖金铜微光
      const jinmaoWarm = Math.sin(t * 0.4) * 0.5 + 0.5;
      lightGroups.jinmaoTiers.forEach((m, i) => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 1.8 + Math.sin(t * 0.5 + i * 0.2) * 0.5;
      });
      lightGroups.jinmaoSpire.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.4 + jinmaoWarm * 0.5;
      });

      // 7. 国金中心双子塔 (IFC Twin Towers)
      lightGroups.ifcNeon.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 1.8 + Math.sin(t * 0.5) * 0.4;
      });
      lightGroups.ifcBeacons.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.2 * (Math.sin(t * 0.9) * 0.5 + 0.5);
      });

      // 8. 海关大楼钟楼与外滩百年历史建筑群
      lightGroups.customsClock.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 2.4 + Math.sin(t * 0.3) * 0.3;
      });
      lightGroups.customsFlood.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 1.8;
      });
      lightGroups.peaceRoof.forEach(m => {
        m.material.emissive.copy(new THREE.Color('#10b981'));
        m.material.emissiveIntensity = 2.0;
      });
      lightGroups.peaceFlood.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 1.8;
      });
      lightGroups.waibaidu.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.4) * 0.3;
      });

      // 9. 背景高楼天际线
      lightGroups.pudongCrowns.forEach((m, i) => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 1.8 + Math.sin(t * 0.4 + i * 0.3) * 0.4;
      });
      lightGroups.pudongAntennas.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 2.2 * (Math.sin(t * 1.0) * 0.5 + 0.5);
      });
      lightGroups.backdropWindows.forEach((m, i) => {
        const seed = (i * 17.31) % 1.0;
        const windowFlicker = Math.sin(t * 0.4 + seed * 6.0) > 0;
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = windowFlicker ? 2.0 : 1.2;
      });

      // 10. 黄浦江游船航标与红灯笼
      lightGroups.boats.forEach(m => {
        if (m.name.includes('Lantern')) {
          m.material.emissive.copy(red);
          m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.8) * 0.6;
        } else if (m.name.includes('Win')) {
          m.material.emissive.copy(amber);
          m.material.emissiveIntensity = 2.0 + Math.sin(t * 0.6) * 0.4;
        }
      });
    }
  });

  return (
    <group>
      <primitive object={obj} position={[0, 0, 0]} scale={1} />
      <AuroraHeart timeOfDay={timeOfDay} />
    </group>
  );
}

useGLTF.preload('/assets/plaza_environment.glb?v=shanghai_v10_postcard');
