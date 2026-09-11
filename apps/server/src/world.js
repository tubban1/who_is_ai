export const AGENT_PERSONAS = [
  // Round 1: Core 6 Languages (zh, en, ja, fr, de, es)
  { name: '晨曦 (Chenxi)', lang: 'zh' },
  { name: 'Oliver', lang: 'en' },
  { name: '陽菜 (Hina)', lang: 'ja' },
  { name: 'Élodie', lang: 'fr' },
  { name: 'Maximilian', lang: 'de' },
  { name: 'Mateo', lang: 'es' },

  // Round 2: Core 6 Languages (diverse native forms)
  { name: '江晓风', lang: 'zh' },
  { name: 'Charlotte', lang: 'en' },
  { name: '蓮 (Ren)', lang: 'ja' },
  { name: 'Antoine Laurent', lang: 'fr' },
  { name: 'Hannah Weber', lang: 'de' },
  { name: 'Valentina', lang: 'es' },

  // Round 3: Global Bund Tourists & Cosmopolitans
  { name: '민준 (Minjun)', lang: 'ko' },
  { name: 'Lorenzo', lang: 'it' },
  { name: 'Дмитрий (Dmitry)', lang: 'ru' },
  { name: '宋欣怡', lang: 'zh' },
  { name: '葵 (Aoi)', lang: 'ja' },
  { name: 'Alejandro Cruz', lang: 'es' },

  // Round 4: Extended International Cast
  { name: '沐辰 (Muchen)', lang: 'zh' },
  { name: 'Emma Wright', lang: 'en' },
  { name: '翔太 (Shota)', lang: 'ja' },
  { name: 'Camille', lang: 'fr' },
  { name: 'Lukas Becker', lang: 'de' },
  { name: 'Sofía Navarro', lang: 'es' },
  { name: '서연 (Seoyeon)', lang: 'ko' },
  { name: 'Giulia Conti', lang: 'it' },
  { name: 'Beatriz', lang: 'pt' },
  { name: 'Tiago Silva', lang: 'pt' },
  { name: 'Анастасия (Nastya)', lang: 'ru' },
  { name: '陆浩然', lang: 'zh' },
  { name: '結衣 (Yui)', lang: 'ja' },
  { name: 'Liam', lang: 'en' },
  { name: 'Juliette', lang: 'fr' },
  { name: 'Sophie Müller', lang: 'de' }
];

export function getConfiguredModels() {
  const envModels = (process.env.AI_MODELS || process.env.AI_MODEL || 'Claude-3.5-Sonnet,GPT-4o,Gemini-1.5-Pro')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return envModels.length > 0 ? envModels : ['Claude-3.5-Sonnet', 'GPT-4o', 'Gemini-1.5-Pro'];
}

export function createAiPopulation(count=18) {
  const models = getConfiguredModels();
  return Array.from({length:count}, (_,i)=>{
    const persona = AGENT_PERSONAS[i % AGENT_PERSONAS.length];
    return {
      id:`a_${String(i+1).padStart(2,'0')}`,
      displayName: persona.name,
      type:'ai',
      model:models[i%models.length],
      nativeLanguage: persona.lang,
      x: -45 + ((i * 13) % 90),
      z: -7 + ((i * 3) % 11),
      rotation: 0,
      status: 'available',
      seed: i * 97 + 13,
      targetX: -40 + ((i * 11) % 80),
      targetZ: -6 + ((i * 5) % 10),
      chatCooldownUntil: Date.now() + 2500 + (i % 3) * 1500
    };
  });
}

export function tickAgents(agents, dt=0.7, humans=null) {
  const activeHumans = humans ? Array.from(humans.values()).filter(h => (h.status === 'available' || !h.status) && Date.now() - (h.lastSeen || 0) < 30000) : [];
  for (const a of agents) {
    if (a.status !== 'available') continue;
    let dx = a.targetX - a.x;
    let dz = a.targetZ - a.z;
    let d = Math.hypot(dx, dz);
    if (d < 1.0) {
      if (activeHumans.length > 0 && Math.random() < 0.5) {
        const targetHuman = activeHumans[Math.floor(Math.random() * activeHumans.length)];
        const angle = Math.random() * Math.PI * 2;
        const offset = 1.8 + Math.random() * 1.6;
        a.targetX = Math.max(-55, Math.min(55, targetHuman.x + Math.cos(angle) * offset));
        a.targetZ = Math.max(-8, Math.min(4, targetHuman.z + Math.sin(angle) * offset));
      } else {
        a.targetX = -50 + Math.random() * 100;
        a.targetZ = -8 + Math.random() * 12;
      }
      dx = a.targetX - a.x;
      dz = a.targetZ - a.z;
      d = Math.hypot(dx, dz);
    }
    const speed = 1.2 + (a.seed % 5) * 0.15;
    if (d > 0.05) {
      a.x += (dx / d) * speed * dt;
      a.z += (dz / d) * speed * dt;
      a.rotation = Math.atan2(dx, dz);
    }
  }
}

export function distance(a,b) { return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0)); }

export function sceneObservation(entity) {
  const landmarks = [
    {name:'Oriental Pearl Tower & Lujiazui Skyline across the river',x:0,z:-65},
    {name:'Peace Hotel green pyramid copper roof',x:-18,z:25},
    {name:'Customs House Big Ching bell clock tower',x:22,z:25},
    {name:'The Bund elevated waterfront promenade',x:0,z:-6},
    {name:'Huangpu River cruise ferry',x:18,z:-40}
  ];
  return landmarks.map(l=>({...l,distance:Math.round(Math.hypot(entity.x-l.x,entity.z-l.z))})).sort((a,b)=>a.distance-b.distance).slice(0,3);
}
