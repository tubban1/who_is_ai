export const LANGUAGE_NAME_POOLS = {
  zh: [
    '晨曦', '江晓风', '宋欣怡', '沐辰', '陆浩然', '林深见鹿', '小橙子', '晚风拂柳',
    '陈雨欣', '阿泽', '张宇轩', '李子墨', '安安', '若汐', '沈清秋', '落叶知秋',
    '海棠依旧', '晴天小狗', '七月流火', '夜行者', '知更鸟', '顾北辰', '苏小言', '白露',
    '星河漫步', '清风徐来', '半夏微凉', '云舒', '楚天阔', '南风知我意'
  ],
  en: [
    'Oliver', 'Charlotte', 'Liam', 'Emma Wright', 'Lucas_M', 'Chloe', 'Sammy', 'SkyWalker',
    'NeonRider', 'Sophie_K', 'Daniel', 'Mia', 'Alex', 'James', 'Zoe', 'Ethan', 'PixelDancer',
    'Grace', 'Noah', 'Harper', 'Benjamin', 'Luna', 'Leo', 'Ava Martinez', 'Mason Reed'
  ],
  ja: [
    '陽菜 (Hina)', '蓮 (Ren)', '葵 (Aoi)', '翔太 (Shota)', '結衣 (Yui)', 'さくら',
    '大和', 'ゆき', '海斗', 'ソラ', '美咲', '拓海', '悠真', 'ハルカ', 'リク', '楓 (Kaede)'
  ],
  ko: [
    '민준 (Minjun)', '서연 (Seoyeon)', '도윤 (Doyun)', '지우 (Jiwoo)', '하준 (Hajun)',
    '서아 (Seoah)', '유준 (Yujun)', '채원 (Chaewon)', '지호 (Jiho)', '수아 (Sua)'
  ],
  fr: [
    'Élodie', 'Antoine Laurent', 'Camille', 'Juliette', 'Maxime', 'Chloé',
    'Lucas', 'Manon', 'Théo', 'Léa', 'Hugo', 'Clément'
  ],
  de: [
    'Maximilian', 'Hannah Weber', 'Lukas Becker', 'Sophie Müller', 'Felix',
    'Emma', 'Leon', 'Mia', 'Paul', 'Marie', 'Jonas'
  ],
  es: [
    'Mateo', 'Valentina', 'Alejandro Cruz', 'Sofía Navarro', 'Santiago',
    'Isabella', 'Matías', 'Camila', 'Sebastián', 'Lucía', 'Diego'
  ],
  it: [
    'Lorenzo', 'Giulia Conti', 'Leonardo', 'Sofia', 'Alessandro', 'Aurora', 'Francesco'
  ],
  pt: [
    'Beatriz', 'Tiago Silva', 'Rodrigo', 'Carolina', 'Gabriel', 'Mariana'
  ],
  ru: [
    'Дмитрий (Dmitry)', 'Анастасия (Nastya)', 'Александр (Alex)', 'Елена (Elena)', 'Иван (Ivan)'
  ]
};

export function getRandomName(lang = 'zh') {
  const pool = LANGUAGE_NAME_POOLS[lang] || LANGUAGE_NAME_POOLS.zh;
  return pool[Math.floor(Math.random() * pool.length)];
}

const AGENT_LANGUAGES = [
  'zh', 'en', 'zh', 'ja', 'en', 'fr',
  'zh', 'de', 'es', 'ko', 'zh', 'en',
  'ja', 'fr', 'zh', 'de', 'es', 'ru'
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
    const lang = AGENT_LANGUAGES[i % AGENT_LANGUAGES.length];
    const name = getRandomName(lang);
    return {
      id:`a_${String(i+1).padStart(2,'0')}`,
      displayName: name,
      type:'ai',
      model:models[i%models.length],
      nativeLanguage: lang,
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
