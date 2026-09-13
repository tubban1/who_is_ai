import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinnedMesh } from 'three/examples/jsm/utils/SkeletonUtils.js';
import ErrorBoundary3D from './ErrorBoundary3D.jsx';

// 6 Distinct High-Quality Ready Player Me 3D Character Models (2 Male, 4 Diverse Female: 50% / 50% Ratio)
const MODEL_MALE_1_URL = '/assets/rpm_citizen.glb';           // 风衣青年 / 商务雅痞
const MODEL_MALE_2_URL = '/assets/boy.glb';                   // 潮牌滑板少年（黑框眼镜、卫衣球鞋）
const MODEL_FEMALE_SKIRT_URL = '/assets/female_skirt_chic.glb'; // 小香风 · 百褶短裙丽人（高腰百褶短裙、修身短外套、长筒皮靴）
const MODEL_FEMALE_WRAP_URL = '/assets/female_girlfriend.glb';  // 都市轻奢 · 收腰风衣裙名媛（系带收腰、斜裁包臀、高挑气质）
const MODEL_FEMALE_OFFICE_URL = '/assets/female_pencil_skirt.glb'; // 职场知性 · 包臀一步短裙御姐（高腰收腹、干练包臀短裙、修长身材）
const MODEL_FEMALE_CASUAL_URL = '/assets/feminine_model.glb';   // 海派漫步 · 浪漫海派丽人（自然随性都市常服）

// Native Ready Player Me Humanoid Animation GLBs (100% matched bone hierarchy, no zombie retargeting bugs)
const M_IDLE_URL = '/assets/anims/m_idle.glb';
const M_WALK_URL = '/assets/anims/m_walk.glb';
const M_TALK_URL = '/assets/anims/m_talk.glb';

const F_IDLE_URL = '/assets/anims/f_idle.glb';
const F_WALK_URL = '/assets/anims/f_walk.glb';
const F_TALK_URL = '/assets/anims/f_talk.glb';

// ==================== 6 ICONIC SHANGHAI BUND ARCHETYPES (1:1 MALE/FEMALE) ====================
export const ARCHETYPES = {
  // === 男性形象 (50% 全场占比) ===
  TRENCH: {
    key: 'trench',
    title: '风衣青年 · 海派漫步',
    gender: 'masculine',
    modelUrl: MODEL_MALE_1_URL,
    palettes: [
      { jacket: '#88745d', pants: '#1e242b', hair: '#1c1917' }, // 经典海派驼色风衣
      { jacket: '#252d38', pants: '#17191d', hair: '#121214' }, // 深邃午夜藏蓝风衣
      { jacket: '#3d4538', pants: '#1c2024', hair: '#292524' }, // 军绿雅痞风衣
    ]
  },
  SKATER: {
    key: 'skater',
    title: '潮牌少年 · 街头先锋',
    gender: 'masculine',
    modelUrl: MODEL_MALE_2_URL,
    palettes: [
      { jacket: '#dc2626', pants: '#18181b', hair: '#292524' }, // 街头红色连帽卫衣
      { jacket: '#0284c7', pants: '#27272a', hair: '#1c1917' }, // 赛博电光蓝连帽衫
      { jacket: '#7c3aed', pants: '#18181b', hair: '#3f3f46' }, // 极光紫工装少年
    ]
  },

  // === 女性多样化形象 (50% 全场占比，涵盖高腰百褶短裙、优雅风衣裙、知性西服与海派常服，突出女性特征) ===
  PLEATED_SKIRT: {
    key: 'pleated_skirt',
    title: '小香风 · 百褶短裙丽人',
    gender: 'feminine',
    modelUrl: MODEL_FEMALE_SKIRT_URL,
    palettes: [
      { jacket: '#0a0a0c', pants: '#18181b', skirt: '#12151f', hair: '#c084fc' }, // 经典黑金小香风 + 丁香紫发色 + 百褶短裙
      { jacket: '#450a0a', pants: '#1c1010', skirt: '#300b0b', hair: '#1c1917' }, // 勃艮第酒红修身外套 + 深酒红百褶短裙
      { jacket: '#1e293b', pants: '#0f172a', skirt: '#1e293b', hair: '#38bdf8' }, // 摩登藏蓝外套 + 雾霾蓝挑染短裙
    ]
  },
  WRAP_DRESS: {
    key: 'wrap_dress',
    title: '都市轻奢 · 收腰风衣裙名媛',
    gender: 'feminine',
    modelUrl: MODEL_FEMALE_WRAP_URL,
    palettes: [
      { jacket: '#0f172a', pants: '#020617', hair: '#475569' }, // 午夜黑金收腰风衣裙
      { jacket: '#78350f', pants: '#451a03', hair: '#1c1917' }, // 焦糖卡其收腰裙
      { jacket: '#064e3b', pants: '#022c22', hair: '#134e4a' }, // 祖母绿复古风衣裙
    ]
  },
  OFFICE: {
    key: 'office',
    title: '职场知性 · 包臀短裙御姐',
    gender: 'feminine',
    modelUrl: MODEL_FEMALE_OFFICE_URL,
    palettes: [
      { jacket: '#1e3a5f', pants: '#1e293b', skirt: '#1e293b', hair: '#1c1917' }, // 陆家嘴深蓝西装包臀短裙
      { jacket: '#334155', pants: '#0f172a', skirt: '#0f172a', hair: '#27272a' }, // 炭黑干练商务包臀短裙
      { jacket: '#475569', pants: '#1e293b', skirt: '#1e293b', hair: '#334155' }, // 摩登烟灰高级知性短裙
    ]
  },
  MODERN_LADY: {
    key: 'modern_lady',
    title: '海派丽人 · 外滩漫步',
    gender: 'feminine',
    modelUrl: MODEL_FEMALE_CASUAL_URL,
    palettes: [
      { jacket: '#991b1b', pants: '#1c1917', hair: '#1c1917' }, // 优雅酒红常服
      { jacket: '#0f766e', pants: '#18181b', hair: '#27272a' }, // 复古墨绿常服
      { jacket: '#4c1d95', pants: '#0f172a', hair: '#1e1b4b' }, // 魅影深紫常服
    ]
  }
};

/**
 * 严格按照男女 1:1 (50% : 50%) 比例均衡分配市民形象，女性具备 4 大风格造型
 */
export function getCharacterArchetype(id, displayName, isPlayer) {
  if (isPlayer) return ARCHETYPES.TRENCH;

  const maleList = [ARCHETYPES.TRENCH, ARCHETYPES.SKATER];
  const femaleList = [ARCHETYPES.PLEATED_SKIRT, ARCHETYPES.WRAP_DRESS, ARCHETYPES.OFFICE, ARCHETYPES.MODERN_LADY];

  // 如果是服务器的 a_01, a_02 规律ID，按序号严格交替（奇数男，偶数女，精确 1:1 男女平衡）
  const match = id && typeof id === 'string' ? id.match(/\d+/) : null;
  if (match) {
    const num = parseInt(match[0], 10);
    const isMale = (num % 2 === 1);
    if (isMale) {
      const maleIdx = Math.floor((num - 1) / 2) % maleList.length;
      return maleList[maleIdx];
    } else {
      const femaleIdx = Math.floor((num - 1) / 2) % femaleList.length;
      return femaleList[femaleIdx];
    }
  }

  const hash = Math.abs(Array.from((id || '') + (displayName || '')).reduce((n, c) => n + c.charCodeAt(0), 0));
  const isMale = (hash % 2 === 0);
  if (isMale) {
    return maleList[Math.floor(hash / 2) % maleList.length];
  } else {
    return femaleList[Math.floor(hash / 2) % femaleList.length];
  }
}

/**
 * 原地踏步消除 Root Motion 前向漂移，保留自然的上下颠簸 (Hip Bobbing)
 */
function prepareInPlaceClips(idleGltf, walkGltf, talkGltf) {
  const idleRaw = idleGltf?.animations?.[0];
  const walkRaw = walkGltf?.animations?.[0];
  const talkRaw = talkGltf?.animations?.[0];

  const idleClip = idleRaw ? idleRaw.clone() : null;
  if (idleClip) idleClip.name = 'idle';

  const talkClip = talkRaw ? talkRaw.clone() : null;
  if (talkClip) talkClip.name = 'talk';

  let walkClip = null;
  if (walkRaw) {
    const clonedTracks = walkRaw.tracks.map(t => t.clone());
    for (const track of clonedTracks) {
      // 对 Hips.position 消除前向持续 Z 轴漂移，使得角色在游戏引擎驱动移动时脚踏实地走动
      if (track.name.endsWith('.position') && track.name.toLowerCase().includes('hips')) {
        const times = track.times;
        const values = track.values;
        const count = times.length;
        if (count > 1) {
          const t0 = times[0];
          const tDuration = times[count - 1] - t0;
          const x0 = values[0];
          const xEnd = values[(count - 1) * 3];
          const z0 = values[2];
          const zEnd = values[(count - 1) * 3 + 2];
          for (let i = 0; i < count; i++) {
            const alpha = tDuration > 0 ? (times[i] - t0) / tDuration : 0;
            const xDrift = (1 - alpha) * x0 + alpha * xEnd;
            const zDrift = (1 - alpha) * z0 + alpha * zEnd;
            values[i * 3] -= xDrift;
            values[i * 3 + 2] -= zDrift;
          }
        }
      }
    }
    walkClip = new THREE.AnimationClip('walk', walkRaw.duration, clonedTracks);
  }

  return [idleClip, walkClip, talkClip].filter(Boolean);
}

// ==================== SHARED SKINNED HUMAN MESH ====================
function SkinnedHumanMesh({ avatarGltf, idleGltf, walkGltf, talkGltf, archetype, palette, moving, isTalking, id }) {
  const groupRef = useRef();

  // 提取并准备经过原地踏步修正的动画片段
  const clips = useMemo(() => {
    return prepareInPlaceClips(idleGltf, walkGltf, talkGltf);
  }, [idleGltf, walkGltf, talkGltf]);

  // 深度克隆骨骼网格与材质
  const { model, morphMeshes } = useMemo(() => {
    const cloned = cloneSkinnedMesh(avatarGltf.scene);
    const morphs = [];

    cloned.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      if (node.morphTargetDictionary && node.morphTargetInfluences) {
        morphs.push(node);
      }

      // 个性化定制服装与发色（安全保护面部皮肤与五官不被染色）
      if (node.material) {
        const customize = (mat) => {
          const m = mat.clone();
          const isTop = (node.name && node.name.includes('Outfit_Top')) || (mat.name && mat.name.includes('Outfit_Top'));
          const isBottom = (node.name && (node.name.includes('Outfit_Bottom') || node.name.includes('Skirt'))) || 
                           (mat.name && (mat.name.includes('Outfit_Bottom') || mat.name.includes('Skirt')));
          const isHair = (node.name && node.name.includes('Hair')) || (mat.name && mat.name.includes('Hair'));

          if (isTop && palette.jacket) {
            m.color.set(palette.jacket);
          } else if (isBottom && (palette.skirt || palette.pants)) {
            m.color.set(palette.skirt || palette.pants);
          } else if (isHair && palette.hair) {
            m.color.set(palette.hair);
          }
          return m;
        };
        node.material = Array.isArray(node.material) ? node.material.map(customize) : customize(node.material);
      }
    });

    return { model: cloned, morphMeshes: morphs };
  }, [avatarGltf.scene, palette]);

  const { actions } = useAnimations(clips, groupRef);
  const currentActionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__AVATARS_LOADED_COUNT__ = (window.__AVATARS_LOADED_COUNT__ || 0) + 1;
    }
  }, []);

  useEffect(() => {
    if (!actions || !actions.idle) return;

    let targetAction = actions.idle;
    if (moving && actions.walk) {
      targetAction = actions.walk;
    } else if (isTalking && actions.talk) {
      targetAction = actions.talk;
    }

    const prevAction = currentActionRef.current;
    if (prevAction !== targetAction) {
      targetAction.reset().fadeIn(0.22).play();
      if (prevAction) {
        prevAction.fadeOut(0.22);
      }
      currentActionRef.current = targetAction;
    }
  }, [moving, isTalking, actions]);

  // 独立的自然眨眼频次相位
  const blinkOffset = useMemo(() => {
    return (Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 100) * 0.05;
  }, [id]);

  // 动态面部表情驱动：自然眨眼与说话口型
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + blinkOffset;
    const blinkCycle = t % 3.8;
    const isBlinking = blinkCycle < 0.16;
    const blinkWeight = isBlinking ? Math.sin((blinkCycle / 0.16) * Math.PI) : 0;

    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;
      if (!dict || !infl) continue;

      // 自然眨眼
      if (dict.eyeBlinkLeft !== undefined) infl[dict.eyeBlinkLeft] = blinkWeight;
      if (dict.eyeBlinkRight !== undefined) infl[dict.eyeBlinkRight] = blinkWeight;

      // 对话交流时的口型起伏与亲切微笑
      if (isTalking) {
        if (dict.mouthOpen !== undefined) {
          infl[dict.mouthOpen] = Math.max(0, Math.sin(t * 11) * 0.24 + 0.06);
        }
        if (dict.mouthSmile !== undefined) {
          infl[dict.mouthSmile] = 0.22;
        }
      } else {
        if (dict.mouthOpen !== undefined && infl[dict.mouthOpen] > 0.001) {
          infl[dict.mouthOpen] = THREE.MathUtils.damp(infl[dict.mouthOpen], 0, 8, 0.016);
        }
        if (dict.mouthSmile !== undefined && infl[dict.mouthSmile] > 0.001) {
          infl[dict.mouthSmile] = THREE.MathUtils.damp(infl[dict.mouthSmile], 0.08, 4, 0.016);
        }
      }
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={model} />
    </group>
  );
}

function MasculineCitizenMesh(props) {
  const avatarGltf = useGLTF(props.archetype.modelUrl);
  const idleGltf = useGLTF(M_IDLE_URL);
  const walkGltf = useGLTF(M_WALK_URL);
  const talkGltf = useGLTF(M_TALK_URL);

  return (
    <SkinnedHumanMesh
      avatarGltf={avatarGltf}
      idleGltf={idleGltf}
      walkGltf={walkGltf}
      talkGltf={talkGltf}
      {...props}
    />
  );
}

function FeminineCitizenMesh(props) {
  const avatarGltf = useGLTF(props.archetype.modelUrl);
  const idleGltf = useGLTF(F_IDLE_URL);
  const walkGltf = useGLTF(F_WALK_URL);
  const talkGltf = useGLTF(F_TALK_URL);

  return (
    <SkinnedHumanMesh
      avatarGltf={avatarGltf}
      idleGltf={idleGltf}
      walkGltf={walkGltf}
      talkGltf={talkGltf}
      {...props}
    />
  );
}

function CitizenMesh(props) {
  if (props.archetype.gender === 'feminine') {
    return <FeminineCitizenMesh {...props} />;
  }
  return <MasculineCitizenMesh {...props} />;
}

// 占位人形剪影（在模型下载加载完成前显示）
function LoadingSilhouette({ color = '#3b4252' }) {
  return (
    <group>
      <mesh position={[0, 1.12, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.60, 4, 12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.64, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#bb9274" />
      </mesh>
      {[-0.09, 0.09].map(x => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <capsuleGeometry args={[0.065, 0.68, 4, 8]} />
          <meshStandardMaterial color="#30343a" />
        </mesh>
      ))}
    </group>
  );
}

let cachedShadowTex = null;
function getContactShadowTexture() {
  if (typeof document === 'undefined') return null;
  if (cachedShadowTex) return cachedShadowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  cachedShadowTex = new THREE.CanvasTexture(canvas);
  return cachedShadowTex;
}

export default function CharacterAvatar({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  displayName = 'Guest',
  id = 'guest',
  isPlayer = false,
  isNear = false,
  isTalking = false,
  moving = false,
  onClick,
  hideBadge = false,
}) {
  const archetype = useMemo(() => {
    return getCharacterArchetype(id, displayName, isPlayer);
  }, [id, displayName, isPlayer]);

  const palette = useMemo(() => {
    const arch = archetype || ARCHETYPES.TRENCH;
    const palettes = arch.palettes || ARCHETYPES.TRENCH.palettes;
    const hash = Math.abs(Array.from((id || '') + (displayName || '')).reduce((n, c) => n + c.charCodeAt(0), 0));
    return palettes[hash % palettes.length] || palettes[0];
  }, [id, displayName, archetype]);

  const fallback = <LoadingSilhouette color={palette.jacket} />;
  const shadowTex = useMemo(() => getContactShadowTexture(), []);

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <ErrorBoundary3D fallback={fallback}>
        <Suspense fallback={fallback}>
          <CitizenMesh
            archetype={archetype}
            palette={palette}
            moving={Boolean(moving)}
            isTalking={Boolean(isTalking)}
            id={id}
          />
        </Suspense>
      </ErrorBoundary3D>

      {/* 脚底自然柔和阴影 */}
      {shadowTex && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.85, 0.85]} />
          <meshBasicMaterial
            map={shadowTex}
            transparent
            opacity={0.65}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 临近交互高亮光环 */}
      {isNear && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
          <ringGeometry args={[0.42, 0.47, 48]} />
          <meshBasicMaterial color="#e2c28f" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}

      {/* 头顶身份标牌与职业标签 */}
      {!hideBadge && (
        <Html position={[0, 2.05, 0]} center distanceFactor={4.5} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              whiteSpace: 'nowrap',
              padding: '4px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              color: isPlayer ? '#b5d5e4' : '#eee9df',
              background: 'rgba(18, 23, 27, 0.82)',
              border: `1px solid ${isNear ? '#bba477' : 'rgba(255, 255, 255, 0.16)'}`,
              boxShadow: isNear ? '0 0 10px rgba(226, 194, 143, 0.35)' : 'none',
              userSelect: 'none',
              backdropFilter: 'blur(4px)',
              textAlign: 'center',
            }}
          >
            <div>{displayName}</div>
            <div style={{ fontSize: '9px', opacity: 0.65, marginTop: '1px' }}>
              {archetype.title}
            </div>
          </div>
          {isNear && !isPlayer && (
            <div
              style={{
                textAlign: 'center',
                color: '#f2d9a6',
                fontSize: '10px',
                marginTop: '3px',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                fontWeight: 600,
              }}
            >
              E · 对话
            </div>
          )}
        </Html>
      )}
    </group>
  );
}

// 轻量骨骼动画预加载（几十 KB，确保动作就绪无抖动）
// 角色大型网格模型（几 MB）采用渐进式按需加载与 <LoadingSilhouette /> 占位，避免首屏瞬间打爆网络带宽
useGLTF.preload(M_IDLE_URL);
useGLTF.preload(M_WALK_URL);
useGLTF.preload(M_TALK_URL);
useGLTF.preload(F_IDLE_URL);
useGLTF.preload(F_WALK_URL);
useGLTF.preload(F_TALK_URL);
