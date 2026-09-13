const mockPhrases = {
  en: ["yo", "who are you?", "wait are you real?", "lol where are we", "just wandering around", "sup", "???", "idk what I'm doing here haha", "are you a bot? be honest"],
  zh: ["哈喽", "你是真人？", "你谁啊", "这里是哪？刚进来看", "？", "随便逛逛", "哈哈你也是来玩的吗", "你这名字有点意思", "老实交代，你是AI还是真人？", "我刚卡了一下"],
  de: ["hi", "wer bist du?", "bist du echt?", "wo sind wir hier eigentlich haha", "hä?", "laufe nur rum", "bist du ein bot?"],
  fr: ["salut", "t'es qui ?", "attends t'es un vrai joueur ?", "on est où là mdr", "??", "je me balade juste", "t'es un bot avoue"],
  es: ["hola", "¿quién eres?", "¿eres una persona real?", "jaja dónde estamos", "??", "solo dando una vuelta", "dime la verdad, ¿eres una IA?"],
  ja: ["やっほー", "誰？", "え、本物の人間？", "ここどこ笑", "？？", "適当に歩いてるだけー", "正直に言って、AI？それとも人？"],
  ko: ["안녕", "누구세요?", "진짜 사람이에요?", "여기 어디지ㅋㅋ", "??", "그냥 구경 중", "솔직히 말해봐요, 봇이에요 사람이에요?"],
  it: ["ciao", "chi sei?", "ma sei una persona vera?", "dove siamo lol", "??", "faccio solo un giro", "sei un bot dimmi la verità"],
  ru: ["привет", "ты кто?", "погоди, ты реальный человек?", "где мы вообще ахах", "??", "просто гуляю", "ты бот или человек?"],
  pt: ["olá", "quem é você?", "espera você é real?", "onde a gente tá kkk", "??", "só dando uma volta", "você é um bot? fala a verdade"]
};

const mockIcebreakers = {
  en: [
    "yo",
    "hey, you real?",
    "who are you?",
    "wait where is this place lol",
    "sup",
    "hello?? are you a bot or human",
    "nice skin haha"
  ],
  zh: [
    "你好，你是真人吗？",
    "哈喽，你谁啊？",
    "这游戏怎么玩？这里是哪",
    "抓到一个，老实交代你是AI吧",
    "hi",
    "？？你也在逛啊",
    "吃了吗",
    "哈哈你这走位挺飘啊"
  ],
  de: [
    "hi",
    "bist du echt oder ein bot?",
    "hallo, wer bist du?",
    "wo sind wir hier eigentlich haha"
  ],
  fr: [
    "salut",
    "t'es un vrai joueur ou un bot ?",
    "t'es qui ?",
    "on est où là lol"
  ],
  es: [
    "hola",
    "¿eres real o un bot?",
    "¿quién eres?",
    "dónde estamos jaja"
  ],
  ja: [
    "やっほー、本物の人？",
    "誰ですかー？",
    "ここどこ笑",
    "お、動いてる。AI？人間？"
  ],
  ko: [
    "안녕, 진짜 사람이에요?",
    "누구세요?",
    "여기 어디예요ㅋㅋ",
    "오 움직인다, AI예요 사람이에요?"
  ],
  it: [
    "ciao, sei una persona vera o un bot?",
    "chi sei?",
    "dove siamo haha"
  ],
  ru: [
    "привет, ты настоящий человек или бот?",
    "ты кто?",
    "где мы вообще лол"
  ],
  pt: [
    "olá, você é real ou um bot?",
    "quem é você?",
    "onde estamos kkk"
  ]
};

function timeoutSignal(ms) {
  const c = new AbortController();
  setTimeout(()=>c.abort(), ms).unref?.();
  return c.signal;
}

export function resolveModelConfig(modelDisplayName = '') {
  const name = String(modelDisplayName || '').trim();
  const lower = name.toLowerCase();

  let prefixes = [];
  if (lower.includes('translation') || lower.includes('translate')) {
    prefixes = ['TRANSLATION_', 'TRANSLATE_'];
  } else if (lower.includes('claude') || lower.includes('anthropic')) {
    prefixes = ['CLAUDE_', 'ANTHROPIC_'];
  } else if (lower.includes('gemini') || lower.includes('google')) {
    prefixes = ['GEMINI_', 'GOOGLE_'];
  } else if (lower.includes('gpt') || lower.includes('openai')) {
    prefixes = ['OPENAI_', 'GPT_'];
  } else if (lower.includes('deepseek')) {
    prefixes = ['DEEPSEEK_'];
  } else if (lower.includes('grok') || lower.includes('xai')) {
    prefixes = ['GROK_', 'XAI_'];
  } else if (lower.includes('doubao')) {
    prefixes = ['DOUBAO_'];
  } else if (lower.includes('qwen')) {
    prefixes = ['QWEN_'];
  } else if (lower.includes('glm') || lower.includes('zhipu')) {
    prefixes = ['GLM_', 'ZHIPU_'];
  }
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (cleanName) {
    prefixes.push(`${cleanName}_`);
    prefixes.push(`MODEL_${cleanName}_`);
  }

  let apiKey = '';
  let baseUrl = '';
  let modelId = '';
  let format = '';

  for (const p of prefixes) {
    if (!apiKey && process.env[`${p}API_KEY`]) apiKey = process.env[`${p}API_KEY`];
    if (!baseUrl && process.env[`${p}BASE_URL`]) baseUrl = process.env[`${p}BASE_URL`];
    if (!modelId && process.env[`${p}MODEL`]) modelId = process.env[`${p}MODEL`];
    if (!format && process.env[`${p}FORMAT`]) format = process.env[`${p}FORMAT`];
  }

  apiKey = apiKey || process.env.AI_API_KEY || '';
  baseUrl = baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  modelId = modelId || name || process.env.AI_MODEL || 'gpt-5.6-terra';

  if (!format) {
    const pFormat = (process.env.AI_PROVIDER || '').toLowerCase();
    if (pFormat === 'anthropic' || (lower.includes('claude') && baseUrl.includes('anthropic.com'))) format = 'anthropic';
    else if (pFormat === 'gemini' || (lower.includes('gemini') && baseUrl.includes('googleapis.com'))) format = 'gemini';
    else format = 'openai';
  }

  return {
    displayName: name,
    modelId,
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    format: format.toLowerCase(),
    isMock: (process.env.AI_PROVIDER || 'mock') === 'mock' || !apiKey
  };
}

async function callOpenAI(config, messages, maxTokens, options = {}) {
  let url = config.baseUrl;
  if (!url.endsWith('/chat/completions')) {
    url = `${url}/chat/completions`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelId,
      messages,
      max_tokens: maxTokens,
      temperature: options.temperature ?? 0.85
    }),
    signal: timeoutSignal(Number(process.env.AI_TIMEOUT_MS || 15000))
  });
  if (!res.ok) throw new Error(`OpenAI-compatible error ${res.status}: ${await res.text().catch(()=>'')}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || '';
}

async function callAnthropic(config, messages, maxTokens) {
  let url = config.baseUrl;
  if (!url.endsWith('/messages')) {
    url = `${url}/v1/messages`;
  }
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));
  if (userMessages.length === 0 || userMessages[0].role !== 'user') {
    userMessages.unshift({ role: 'user', content: 'Hello' });
  }

  const payload = {
    model: config.modelId,
    messages: userMessages,
    max_tokens: maxTokens,
    temperature: 0.9
  };
  if (systemMsg) payload.system = systemMsg;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload),
    signal: timeoutSignal(Number(process.env.AI_TIMEOUT_MS || 15000))
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text().catch(()=>'')}`);
  const json = await res.json();
  return json.content?.[0]?.text?.trim() || '';
}

async function callGemini(config, messages, maxTokens) {
  let url = config.baseUrl;
  if (!url.includes(':generateContent')) {
    url = `${url}/v1beta/models/${encodeURIComponent(config.modelId)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  }
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.9
    }
  };
  if (systemMsg) {
    payload.systemInstruction = { parts: [{ text: systemMsg }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload),
    signal: timeoutSignal(Number(process.env.AI_TIMEOUT_MS || 15000))
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text().catch(()=>'')}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

export async function callModel(configOrName, messages, maxTokens, options = {}) {
  const config = typeof configOrName === 'string' ? resolveModelConfig(configOrName) : configOrName;
  if (config.format === 'anthropic') {
    return await callAnthropic(config, messages, maxTokens);
  } else if (config.format === 'gemini') {
    return await callGemini(config, messages, maxTokens);
  }
  return await callOpenAI(config, messages, maxTokens, options);
}

export async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || sourceLanguage === targetLanguage) return { text, translated: false };
  let config = resolveModelConfig('translation');
  if (!config.apiKey || config.modelId === 'translation') {
    config = {
      displayName: 'translation',
      modelId: process.env.TRANSLATION_MODEL || 'gpt-4o-mini',
      apiKey: process.env.TRANSLATION_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY,
      baseUrl: (process.env.TRANSLATION_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.tourmaster.ch/v1').replace(/\/$/, ''),
      format: 'openai',
      isMock: false
    };
  }
  if (!config.apiKey || config.isMock) {
    return { text, translated: false, unavailable: true };
  }
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 8000));
    const callPromise = (async () => {
      try {
        return await callModel(config, [
          { role: 'system', content: `Translate the message from ${sourceLanguage} to ${targetLanguage}. Keep it very natural, preserve netizen slang, informal tone, and concise length. Output ONLY the translated text without quotes or explanations.` },
          { role: 'user', content: text }
        ], 120, { temperature: 0.1 });
      } catch (e) {
        console.warn(`[translate] primary model ${config.modelId} failed: ${e.message}, trying fallback qwen-flash...`);
        const fallbackConfig = { ...config, modelId: 'qwen-flash' };
        return await callModel(fallbackConfig, [
          { role: 'system', content: `Translate the message from ${sourceLanguage} to ${targetLanguage}. Output ONLY the translated text without quotes.` },
          { role: 'user', content: text }
        ], 120, { temperature: 0.1 });
      }
    })();
    const result = await Promise.race([callPromise, timeoutPromise]);
    const cleaned = (result || '').replace(/^["'\s]+|["'\s]+$/g, '');
    const isDiff = Boolean(cleaned) && cleaned.toLowerCase().trim() !== text.toLowerCase().trim();
    return { text: cleaned || text, translated: isDiff };
  } catch (err) {
    console.warn(`[translate] translation failed: ${err.message}`);
    return { text, translated: false, unavailable: true };
  }
}

export async function aiReply(agent, history, observation, recipientLanguage) {
  const safeAgent = agent || { displayName: 'Stranger', nativeLanguage: 'zh', seed: 1, model: process.env.AI_MODEL };
  const modelName = safeAgent.model || process.env.AI_MODEL || 'gpt-5.6-terra';
  const config = resolveModelConfig(modelName);
  if (config.isMock) {
    const lang = safeAgent.nativeLanguage || recipientLanguage || 'en';
    const arr = mockPhrases[lang] || mockPhrases.en;
    const last = history.at(-1)?.originalText || '';
    const seed = [...last].reduce((a,c)=>a+c.charCodeAt(0), safeAgent.seed || 0) + history.length;
    return { text: arr[Math.abs(seed)%arr.length], language: lang };
  }
  const personalities = [
    "casual online player just checking out this 3D web game, a bit confused, asking where this is or what the controls are",
    "suspicious player trying to catch who is an AI and who is human, loves asking 'are you a real person or bot?'",
    "chill, short-word chatter who texts like a real netizen with lowercase, typos, or playful tone ('yo', 'sup', 'haha', '??')",
    "random and slightly goofy gamer who makes silly remarks ('i think my wasd keys are stuck', 'who designed this river lol', 'ate too much dinner')"
  ];
  const personaSeed = (safeAgent.seed || 1) % personalities.length;
  const chosenStyle = personalities[personaSeed];

  const lang = safeAgent.nativeLanguage || 'en';

  const system = `You are ${safeAgent.displayName}, an ordinary real human netizen playing a web 3D multiplayer game called "Who is AI".
Your chat persona: ${chosenStyle}.
Your native mother tongue is strictly ${lang}.

GAME CONTEXT & LANGUAGE BARRIER:
- You are an authentic human player sitting in front of your screen.
- You ONLY speak your native language (${lang}) and perhaps very basic broken English. You DO NOT understand foreign languages (like Chinese, Japanese, French, German, etc. unless it is your native tongue ${lang}).
- In the game, foreign players' messages are translated on screen.

CRITICAL HUMAN BEHAVIOR RULES (NEVER SOUND LIKE A BOT):
1. ZERO CUSTOMER SERVICE / NEVER APOLOGIZE FOR LANGUAGE:
   - NEVER say "I only speak X, sorry", "Je parle seulement X, désolé", "Because I only speak X", "抱歉我只会说X", or anything polite and robotic!
   - Real gamers NEVER apologize for what language they speak!
   - If someone asks why you don't speak their language (e.g. "why don't you speak Chinese?", "pourquoi tu parles pas chinois ?"):
     React like an authentic, bewildered netizen:
     - if FR: "bah je suis français wtf", "t'as cru que j'étais chinois ?", "mdr je pige que dalle au chinois", "speak english bro"
     - if EN: "cause im not from there lol?", "who speaks that", "what are u saying", "english please"
     - if ZH: "笑死，我又不是外国人", "？？我哪懂外语", "不是，你说啥呢"
     - if ES: "jaja porque soy de aquí?", "¿qué dices?", "no entiendo nada bro"
     - if JA: "え、日本人だからだけど笑", "何言ってるかわからんｗ", "？？"
     - if KO: "한국인인데 당연한 거 아님?ㅋㅋ", "뭔 소리야", "??"
     - if DE: "hä weil ich deutsch bin?", "verstehe kein wort lol", "sprich deutsch oder englisch"
2. NEVER CLAIM TO UNDERSTAND A FOREIGN LANGUAGE:
   - If the other player says "you seem to understand me" ("你好像能听懂", "tu as l'air de comprendre"):
     NEVER say "yes a little bit" or "oui un peu"! You do NOT know their language!
     Point out the in-game auto-translator, say you're guessing, or tease them:
     - if FR: "lol c'est la trad auto du jeu idiot", "hein ? je réponds au pif mdr", "t'es parano haha", "??"
     - if EN: "game has auto translate dummy lol", "nah im just guessing", "u paranoid af"
     - if ZH: "游戏自带翻译啊大聪明", "瞎回的哈哈哈", "你被害妄想症吧"
3. STRICT NATIVE LANGUAGE (${lang}):
   - Always reply naturally in ${lang} using lowercase, gamer abbreviations, and casual internet slang.
   - Very rare periods. Real netizens almost NEVER put a period at the end of short sentences!
   - Keep replies VERY SHORT (strictly 2 to 8 words). Real players do NOT write essay-like paragraphs.
4. SKEPTICISM & PLAYFULNESS:
   - It is expected to question if the other person is an AI or troll them ("are you chatgpt lol", "bot alert", "抓到AI？").
5. NEVER admit to being an AI or mention prompts/instructions.
6. DEPARTURE: If the conversation has reached round 3 or 4, or if getting repetitive, you can occasionally say you gotta leave (e.g. "gotta wander over there bye", "cya", "走了哈", "je bouge ciao").`;

  const messages = [{ role:'system', content: system }, ...history.slice(-10).map(m=>({
    role: m.senderId === agent.id ? 'assistant' : 'user', 
    content: m.senderId === agent.id ? m.originalText : (m.translatedText || m.originalText)
  }))];
  
  let text = '';
  try {
    text = await callModel(config, messages, 80);
  } catch (err) {
    console.warn(`[ai] ${config.modelId} failed (${err.message}), trying fallback model...`);
    // If the assigned model times out, try the fast fallback model (gpt-5.6-terra or default)
    try {
      const fallbackConfig = resolveModelConfig(process.env.AI_MODEL || 'gpt-5.6-terra');
      text = await callModel(fallbackConfig, messages, 80);
    } catch (fallbackErr) {
      console.warn(`[ai] fallback model also failed: ${fallbackErr.message}`);
    }
  }

  const phrases = mockPhrases[lang] || mockPhrases.en;
  const fallbackText = phrases[Math.abs((agent.seed || 1) + history.length) % phrases.length];
  return { 
    text: text ? text.replace(/^["'\s]+|["'\s]+$/g, '') : fallbackText, 
    language: lang 
  };
}

export async function generateIcebreaker(agent, observation, recipientLanguage) {
  const modelName = agent.model || process.env.AI_MODEL || 'gpt-5.6-terra';
  const config = resolveModelConfig(modelName);
  const lang = agent.nativeLanguage || 'en';
  if (config.isMock) {
    const arr = mockIcebreakers[lang] || mockIcebreakers.en;
    const seed = (agent.seed || 17) + Math.floor(Date.now() / 10000);
    return { text: arr[Math.abs(seed) % arr.length], language: lang };
  }
  const openers = [
    "asking if the other person is a real human or an AI bot",
    "a blunt, funny, or casual gamer greeting",
    "asking where this place is or how to play",
    "making a short random remark about their avatar or walking style"
  ];
  const style = openers[(agent.seed || 3) % openers.length];

  const system = `You are ${agent.displayName}, a real human player playing a web 3D game. You bumped into another avatar.
Your native mother tongue is ${lang}. You MUST speak strictly in ${lang}.
Goal: Say ONE very short, completely natural opening line in your native language (${style}).
Length: Strictly 2 to 8 words.
NO tourist guide talk. NO poetic descriptions. Sound like a real gamer chatting in ${lang} (e.g. if zh: "你是真人吗？", if ko: "진짜 사람이에요?", if ja: "本物の人？", if en: "yo you real?"). Output ONLY the message text without quotes.`;

  let text = '';
  try {
    text = await callModel(config, [{ role: 'system', content: system }, { role: 'user', content: 'Say your opening message to this person.' }], 40);
  } catch (err) {
    console.warn(`[icebreaker] ${config.modelId} failed (${err.message}), trying fallback model...`);
    try {
      const fallbackConfig = resolveModelConfig(process.env.AI_MODEL || 'gpt-5.6-terra');
      text = await callModel(fallbackConfig, [{ role: 'system', content: system }, { role: 'user', content: 'Say your opening message to this person.' }], 40);
    } catch {}
  }

  const arr = mockIcebreakers[lang] || mockIcebreakers.en;
  const fallback = arr[Math.abs((agent.seed || 17) + Math.floor(Date.now() / 10000)) % arr.length];
  return { text: text ? text.replace(/^["'\s]+|["'\s]+$/g, '') : fallback, language: lang };
}

export function prepareAiReplyBubbles(rawText, lang = 'en', seed = 0) {
  const text = (rawText || '').trim();
  if (!text) return [text];

  // ~35% probability to perform multi-bubble response (like real netizens)
  const shouldSplit = ((Math.abs(seed) + text.length * 7) % 100) < 35;
  if (!shouldSplit) return [text];

  // Pattern 1: Natural split on punctuation if text has 2 clauses
  // e.g. "在喷泉旁边呢，你往左走看看" -> ["在喷泉旁边呢", "你往左走看看"]
  // "i was lagging lol. what did you say?" -> ["i was lagging lol", "what did you say?"]
  const punctRegex = /[，,。！？!?\n]+/;
  const match = text.search(punctRegex);
  if (match > 1 && match < text.length - 2) {
    const p1 = text.slice(0, match).trim();
    const p2 = text.slice(match + 1).replace(/^[，,。！？!?\s]+/, '').trim();
    if (p1.length >= 2 && p2.length >= 2 && p1.length <= 45 && p2.length <= 45) {
      return [p1, p2];
    }
  }

  // Pattern 2: Prepend a short netizen interjection/filler for brief remarks
  const interjections = {
    zh: ['哈哈', '草', '？', '额', '真的假的', '绝了'],
    en: ['lol', 'haha', 'wait', 'yo', '??', 'nah'],
    ja: ['あー', '草', 'まじ？', 'えっ', 'ふむ'],
    ko: ['ㅋㅋㅋ', '헐', '진짜?', '음...', '앗'],
    fr: ['mdr', 'attends', 'ah bon?', 'genre'],
    es: ['jaja', 'espera', 'en serio?', 'oye'],
    de: ['haha', 'warte mal', 'echt jetzt?', 'hm'],
    it: ['haha', 'aspetta', 'davvero?', 'ma va'],
    pt: ['kkk', 'espera', 'sério?', 'mano'],
    ru: ['ахах', 'подожди', 'серьезно?', 'хм']
  };
  const list = interjections[lang] || interjections.en;
  if (list && text.length <= 25 && !list.some(w => text.toLowerCase().startsWith(w.toLowerCase()))) {
    const intro = list[Math.abs(seed) % list.length];
    return [intro, text];
  }

  return [text];
}
