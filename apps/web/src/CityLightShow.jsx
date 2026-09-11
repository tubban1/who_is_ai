import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CityLightShow - Real-time dynamic neon light show controller for Shanghai Bund & Lujiazui
 * Features:
 * - Dynamic asynchronous feature neon on each individual landmark
 * - Grand synchronized city-wide illumination waves (全城共辉灯光秀)
 * - Interactive HUD control pill for instant mode switching
 */
export default function CityLightShow({
  url = '/assets/plaza_environment.glb?v=shanghai_v10_postcard',
  onPhaseChange
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
      boats: []
    };

    obj.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      // Clone material so changes don't cross-contaminate
      if (child.material) {
        child.material = child.material.clone();
      }

      const name = child.name;

      if (name.includes('Aurora_Heart')) groups.auroraHeart.push(child);
      else if (name.includes('Aurora_LED_Screen')) groups.auroraScreen.push(child);
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
    console.log('[CityLightShow Groups]', JSON.stringify(Object.fromEntries(Object.entries(lightGroups).map(([k, v]) => [k, v.length]))));
  }, [lightGroups]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Determine current show state
    let isSync = false;
    if (lightMode === 'sync') {
      isSync = true;
    } else if (lightMode === 'auto') {
      // 18-second macro cycle: 11s individual random -> 7s synchronized light show
      const cycle = t % 18;
      isSync = cycle >= 11;
    } else {
      isSync = false;
    }

    if (currentPhase !== (isSync ? 'sync' : 'random')) {
      const nextP = isSync ? 'sync' : 'random';
      setCurrentPhase(nextP);
      if (onPhaseChange) onPhaseChange(nextP);
    }

    // Colors
    const cyan = new THREE.Color('#38bdf8');
    const magenta = new THREE.Color('#f43f5e');
    const amber = new THREE.Color('#fbbf24');
    const red = new THREE.Color('#ef4444');
    const white = new THREE.Color('#ffffff');

    if (isSync) {
      // ==================== 全城同步灯光秀 (SYNCHRONIZED CITY ILLUMINATION) ====================
      // A wave travels across all towers from West to East (X: -80 to +80)
      const waveFreq = 2.5;
      const globalPulse = (Math.sin(t * waveFreq) + 1) * 0.5; // 0 to 1
      const syncIntensity = 5.0 + globalPulse * 7.0;

      // Synchronized color wave based on time
      const themeColor = Math.sin(t * 0.8) > 0 ? cyan : magenta;

      // 1. Aurora Plaza
      lightGroups.auroraHeart.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = syncIntensity * 1.3;
      });
      lightGroups.auroraScreen.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 0.85;
      });
      lightGroups.auroraText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.5;
      });
      lightGroups.auroraNeonVertical.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.4;
      });
      lightGroups.auroraScreenNeon.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });
      lightGroups.auroraCrown.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });

      // 2. Citigroup Tower
      lightGroups.citiLogo.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = syncIntensity * 1.3;
      });
      lightGroups.citiRibbons.forEach((m, i) => {
        const ribbonWave = Math.sin(t * 5.0 - i * 0.4) > 0 ? syncIntensity * 1.2 : 2.0;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = ribbonWave;
      });
      lightGroups.citiNeonPillars.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.3;
      });
      lightGroups.citiCrown.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });

      // 3. Oriental Pearl
      lightGroups.pearlBelts.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.3;
      });
      lightGroups.pearlBeacon.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 18.0 * (Math.sin(t * 12) > 0.7 ? 1 : 0.2);
      });
      lightGroups.skybridgeGlow.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity;
      });

      // 4. Shanghai Tower Rings & Crown
      lightGroups.shanghaiRings.forEach((m, i) => {
        const active = Math.sin(t * 4.0 - i * 0.5) > 0.2;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = active ? syncIntensity * 1.4 : 2.0;
      });
      lightGroups.shanghaiCrown.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.5;
      });

      // 5. SWFC Apex, Skybridge & Edges
      lightGroups.swfcApex.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.4;
      });
      lightGroups.swfcEdges.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.4;
      });
      lightGroups.swfcAperture.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.5;
      });

      // 6. Jin Mao Tower Pagoda Tiers
      lightGroups.jinmaoTiers.forEach((m, i) => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });
      lightGroups.jinmaoSpire.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.6;
      });

      // 7. IFC Twin Towers
      lightGroups.ifcNeon.forEach(m => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.3;
      });
      lightGroups.ifcBeacons.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = syncIntensity * 1.5;
      });

      // 8. Background Towers Crowns & Edges
      lightGroups.pudongCrowns.forEach((m, i) => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.2;
      });
      lightGroups.pudongEdges.forEach((m, i) => {
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = syncIntensity * 1.1;
      });
      lightGroups.pudongAntennas.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 14.0 * (Math.sin(t * 8.0) > 0.4 ? 1 : 0.2);
      });
      lightGroups.backdropWindows.forEach((m, i) => {
        const wWave = Math.sin(t * 3.0 + i * 0.2) > 0 ? syncIntensity * 0.9 : 1.5;
        m.material.emissive.copy(themeColor);
        m.material.emissiveIntensity = wWave;
      });

      // 9. Customs Clock & Heritage
      lightGroups.customsClock.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 8.0 + globalPulse * 4.0;
      });
      lightGroups.waibaidu.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 7.0 + globalPulse * 3.0;
      });

    } else {
      // ==================== 各楼独特随机霓虹 (INDIVIDUAL FEATURE NEON RHYTHM) ====================

      // 1. 震旦大厦 (Aurora Plaza) - 拟真双跳心跳律动、金色外框与高耸三色垂直光柱
      const beatPhase = (t * 2.2) % 1.0;
      let heartPulse = 0;
      if (beatPhase < 0.14) {
        heartPulse = Math.sin((beatPhase / 0.14) * Math.PI);
      } else if (beatPhase >= 0.22 && beatPhase < 0.36) {
        heartPulse = Math.sin(((beatPhase - 0.22) / 0.14) * Math.PI) * 0.75;
      }
      lightGroups.auroraHeart.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = 5.0 + heartPulse * 12.0;
        // Subtle rhythmic heartbeat physical expansion
        const scale = 1.0 + heartPulse * 0.14;
        m.scale.set(scale, scale, scale);
      });
      lightGroups.auroraScreen.forEach(m => {
        const screenHue = (Math.sin(t * 0.6) + 1) * 0.5;
        m.material.emissive.lerpColors(new THREE.Color('#991b1b'), new THREE.Color('#b45309'), screenHue);
        m.material.emissiveIntensity = 6.5 + Math.sin(t * 1.8) * 2.5;
      });
      lightGroups.auroraText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 8.0 + heartPulse * 6.0;
      });
      lightGroups.auroraNeonVertical.forEach((m, idx) => {
        // Left (red), Center (magenta), Right (amber)
        const vPulse = Math.sin(t * 3.5 + idx * 0.8) * 0.5 + 0.5;
        m.material.emissiveIntensity = 6.0 + vPulse * 6.0 + heartPulse * 4.0;
      });
      lightGroups.auroraScreenNeon.forEach(m => {
        m.material.emissiveIntensity = 6.5 + heartPulse * 5.5;
      });
      lightGroups.auroraCrown.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 5.5 + Math.sin(t * 2.0) * 3.0;
      });

      // 2. 花旗集团大厦 (Citigroup Tower) - 标志性红白Logo呼吸、立面流光百叶与4根青色赛博霓虹角柱
      const citiPulse = (Math.sin(t * 2.8) + 1) * 0.5;
      lightGroups.citiLogo.forEach(m => {
        m.material.emissive.copy(red);
        m.material.emissiveIntensity = 6.0 + citiPulse * 7.0;
      });
      lightGroups.citiText.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 8.0 + citiPulse * 4.0;
      });
      lightGroups.citiRibbons.forEach((m, i) => {
        // Upward light waterfall cascade
        const ribbonFlow = Math.sin(t * 5.5 - i * 0.55);
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = ribbonFlow > 0.2 ? 7.5 : 1.2;
      });
      lightGroups.citiNeonPillars.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 5.0 + citiPulse * 6.5;
      });
      lightGroups.citiCrown.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 6.5 + Math.sin(t * 2.2) * 3.5;
      });

      // 3. 东方明珠 (Oriental Pearl) - 双球洋红粉光环律动、中段5颗小珍珠流光与高空防撞频闪
      const pearlPulse1 = (Math.sin(t * 2.2) + 1) * 0.5;
      const pearlPulse2 = (Math.sin(t * 2.2 + 1.4) + 1) * 0.5;
      lightGroups.pearlBelts.forEach((m, i) => {
        m.material.emissive.copy(magenta);
        m.material.emissiveIntensity = (i % 2 === 0 ? 5.0 + pearlPulse1 * 6.0 : 5.0 + pearlPulse2 * 6.0);
      });
      lightGroups.pearlMiniPearls.forEach((m, i) => {
        const miniPulse = Math.sin(t * 3.6 + i * 0.8) * 0.5 + 0.5;
        m.material.emissive.copy(magenta);
        m.material.emissiveIntensity = 5.0 + miniPulse * 7.0;
      });
      // Top mast aircraft beacon: sharp split-second strobe pulse
      const isBeaconFlash = (t * 4.0) % 1.0 < 0.18;
      lightGroups.pearlBeacon.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = isBeaconFlash ? 24.0 : 0.8;
      });
      // Circular skybridge cyber neon current
      const bridgeCurrent = (Math.sin(t * 3.6) + 1) * 0.5;
      lightGroups.skybridgeGlow.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 3.5 + bridgeCurrent * 4.5;
      });

      // 4. 上海国际会议中心 (Convention Center) - 双玻璃球体梦幻流光呼吸
      lightGroups.conventionGlobes.forEach((m, i) => {
        const cgPulse = Math.sin(t * 2.0 + i * Math.PI) * 0.5 + 0.5;
        m.material.emissive.lerpColors(cyan, magenta, cgPulse * 0.5);
        m.material.emissiveIntensity = 6.0 + cgPulse * 6.0;
      });

      // 5. 上海中心大厦 (Shanghai Tower) - 旋扭螺旋上升光波、楼顶皇冠与标志性翡翠绿色激光光带
      const emerald = new THREE.Color('#10b981');
      lightGroups.shanghaiRings.forEach((m, i) => {
        const ringWave = Math.sin(t * 3.8 - i * 0.65);
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = ringWave > 0.1 ? 8.5 : 1.5;
      });
      lightGroups.shanghaiLaser.forEach((m, i) => {
        const laserWave = Math.sin(t * 4.5 - i * 0.5);
        m.material.emissive.copy(emerald);
        m.material.emissiveIntensity = laserWave > 0 ? 12.0 : 4.0;
      });
      lightGroups.shanghaiCrown.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 7.0 + Math.sin(t * 2.4) * 4.0;
      });

      // 5. 环球金融中心 (SWFC "开瓶器") - 倒梯形天桥赛博光刃与垂直霓虹角线
      const swfcPulse = (Math.sin(t * 3.4) + 1) * 0.5;
      lightGroups.swfcApex.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 6.0 + swfcPulse * 6.5;
      });
      lightGroups.swfcEdges.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 5.0 + swfcPulse * 5.5;
      });
      lightGroups.swfcAperture.forEach(m => {
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = 6.5 + swfcPulse * 6.0;
      });

      // 6. 金茂大厦 (Jin Mao Tower) - 传统宝塔飞檐步步金光
      lightGroups.jinmaoTiers.forEach((m, i) => {
        const tierWave = Math.sin(t * 2.6 + i * 0.7);
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 4.5 + (tierWave > 0 ? 4.5 : 0.5);
      });
      lightGroups.jinmaoSpire.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = 8.0 + Math.sin(t * 4.0) * 4.0;
      });

      // 7. 国金双子塔 (IFC) - 钻石立体紫色霓虹棱线与高空信标
      const ifcStrobe = (t * 2.8) % 1.0 < 0.15;
      lightGroups.ifcNeon.forEach(m => {
        const ifcWave = (Math.sin(t * 2.8) + 1) * 0.5;
        m.material.emissive.copy(new THREE.Color('#a855f7'));
        m.material.emissiveIntensity = 4.5 + ifcWave * 5.0;
      });
      lightGroups.ifcBeacons.forEach(m => {
        m.material.emissive.copy(white);
        m.material.emissiveIntensity = ifcStrobe ? 16.0 : 1.0;
      });

      // 8. 外滩海关钟楼 (Customs Clock)
      const clockPulse = (Math.sin(t * 1.5) + 1) * 0.5;
      lightGroups.customsClock.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 6.0 + clockPulse * 3.0;
      });

      // 9. 和平饭店绿铜金字塔 (Peace Hotel)
      const peacePulse = (Math.sin(t * 1.8) + 1) * 0.5;
      lightGroups.peaceFlood.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 5.0 + peacePulse * 3.5;
      });

      // 10. 外白渡桥 (Waibaidu Bridge) - 钢桁架流金
      const bridgeWave = (Math.sin(t * 2.0) + 1) * 0.5;
      lightGroups.waibaidu.forEach(m => {
        m.material.emissive.copy(amber);
        m.material.emissiveIntensity = 5.5 + bridgeWave * 4.0;
      });

      // 11. 陆家嘴背景楼宇群 - 独立霓虹皇冠、垂直角线与天线警示灯
      lightGroups.pudongCrowns.forEach((m, i) => {
        const pPulse = (Math.sin(t * (1.8 + (i % 4) * 0.4) + i) + 1) * 0.5;
        m.material.emissiveIntensity = 5.0 + pPulse * 6.5;
      });
      lightGroups.pudongEdges.forEach((m, i) => {
        const ePulse = (Math.sin(t * 2.2 + i * 0.6) + 1) * 0.5;
        m.material.emissiveIntensity = 4.0 + ePulse * 5.0;
      });
      const antennaFlash = (t * 2.5) % 1.0 < 0.2;
      lightGroups.pudongAntennas.forEach(m => {
        m.material.emissiveIntensity = antennaFlash ? 16.0 : 2.0;
      });
      lightGroups.backdropWindows.forEach((m, i) => {
        const seed = (i * 17.31) % 1.0;
        const windowFlicker = Math.sin(t * (1.2 + seed * 2.0) + seed * 12.0) > 0;
        m.material.emissive.copy(cyan);
        m.material.emissiveIntensity = windowFlicker ? 5.5 : 1.2;
      });

      // 12. 游船航标与红灯笼
      lightGroups.boats.forEach(m => {
        if (m.name.includes('Lantern')) {
          m.material.emissive.copy(red);
          m.material.emissiveIntensity = 6.0 + Math.sin(t * 3.0) * 3.0;
        } else if (m.name.includes('Win')) {
          m.material.emissive.copy(amber);
          m.material.emissiveIntensity = 6.0 + Math.sin(t * 2.0) * 1.5;
        }
      });
    }
  });

  return <primitive object={obj} position={[0, 0, 0]} scale={1} />;
}
