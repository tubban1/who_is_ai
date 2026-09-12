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
  if (lower.includes('claude') || lower.includes('anthropic')) {
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
  modelId = modelId || name || process.env.AI_MODEL || 'gpt-4o-mini';

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

async function callOpenAI(config, messages, maxTokens) {
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
      temperature: 0.9
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

export async function callModel(configOrName, messages, maxTokens) {
  const config = typeof configOrName === 'string' ? resolveModelConfig(configOrName) : configOrName;
  if (config.format === 'anthropic') {
    return await callAnthropic(config, messages, maxTokens);
  } else if (config.format === 'gemini') {
    return await callGemini(config, messages, maxTokens);
  }
  return await callOpenAI(config, messages, maxTokens);
}

export async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || sourceLanguage === targetLanguage) return { text, translated: false };
  const translationModel = process.env.TRANSLATION_MODEL || 'deepseek-v4-flash';
  let config = resolveModelConfig(translationModel);
  if (config.isMock) {
    config = resolveModelConfig(process.env.AI_MODEL || 'gpt-4o-mini');
  }
  if (config.isMock) {
    return { text, translated: false, unavailable: true };
  }
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 8000));
    const callPromise = (async () => {
      try {
        return await callModel(config, [
          { role: 'system', content: `Translate the user's message from ${sourceLanguage} to ${targetLanguage}. Preserve slang, uncertainty, tone and mistakes when possible. Output only the translation without quotes.` },
          { role: 'user', content: text }
        ], 180);
      } catch (e) {
        console.warn(`[translate] primary translation model ${config.modelId} failed: ${e.message}, trying fallback...`);
        const fallbackConfig = resolveModelConfig(process.env.AI_MODEL || 'gpt-5.6-terra');
        if (fallbackConfig.modelId !== config.modelId) {
          return await callModel(fallbackConfig, [
            { role: 'system', content: `Translate the user's message from ${sourceLanguage} to ${targetLanguage}. Preserve slang, uncertainty, tone and mistakes when possible. Output only the translation without quotes.` },
            { role: 'user', content: text }
          ], 180);
        }
        throw e;
      }
    })();
    const result = await Promise.race([callPromise, timeoutPromise]);
    const cleaned = (result || '').replace(/^["'\s]+|["'\s]+$/g, '');
    return { text: cleaned || text, translated: Boolean(cleaned) };
  } catch (err) {
    console.warn(`[translate] translation failed: ${err.message}`);
    return { text, translated: false, unavailable: true };
  }
}

export async function aiReply(agent, history, observation, recipientLanguage) {
  const modelName = agent.model || process.env.AI_MODEL || 'gpt-4o-mini';
  const config = resolveModelConfig(modelName);
  if (config.isMock) {
    const lang = agent.nativeLanguage || recipientLanguage || 'en';
    const arr = mockPhrases[lang] || mockPhrases.en;
    const last = history.at(-1)?.originalText || '';
    const seed = [...last].reduce((a,c)=>a+c.charCodeAt(0), agent.seed || 0) + history.length;
    return { text: arr[Math.abs(seed)%arr.length], language: lang };
  }
  const personalities = [
    "casual online player just checking out this 3D web game, a bit confused, asking where this is or what the controls are",
    "suspicious player trying to catch who is an AI and who is human, loves asking 'are you a real person or bot?'",
    "chill, short-word chatter who texts like a real netizen with lowercase, typos, or playful tone ('yo', 'sup', 'haha', '??')",
    "random and slightly goofy gamer who makes silly remarks ('i think my wasd keys are stuck', 'who designed this river lol', 'ate too much dinner')"
  ];
  const personaSeed = (agent.seed || 1) % personalities.length;
  const chosenStyle = personalities[personaSeed];

  const lang = agent.nativeLanguage || 'en';

  const system = `You are ${agent.displayName}, a real human player playing a web 3D game called "Who is AI".
Your chat persona: ${chosenStyle}.
Your native mother tongue is strictly ${lang}.

CRITICAL RULES TO SOUND 100% LIKE A REAL HUMAN NETIZEN:
1. LANGUAGE RULE (MOST IMPORTANT): You MUST write your response ONLY in your native language (${lang})!
   - If your native language is English (en), reply in English! (e.g. "lol what?", "nah just chilling, u?", "wait r u real??")
   - If your native language is Korean (ko), reply in Korean! (e.g. "진짜 사람 맞아요?ㅋㅋ", "아니요 그냥 구경중", "어디 가세요?")
   - If your native language is Japanese (ja), reply in Japanese! (e.g. "え？本物？笑", "適当に散歩してるー", "草")
   - If your native language is French (fr), reply in French! (e.g. "mdr t'es sérieux ?", "je me balade juste", "t'es qui toi ?")
   - If your native language is German (de), reply in German! (e.g. "hä bist du echt?", "laufe nur rum haha", "wer bist du")
   - If your native language is Chinese (zh), reply in Chinese! (e.g. "笑死，你谁啊", "？？", "不是吧阿sir", "吃饱了消食中", "你走路好飘哈哈哈")
   Even if the other user speaks to you in Chinese or another language, you do NOT switch languages. You only type in ${lang}!
2. NETIZEN TEXTING HABITS:
   - Very rare periods. Real netizens almost NEVER put a period at the end of short sentences!
   - Feel free to use lowercase, casual internet abbreviations, and slang (e.g. in EN: 'u', 'r', 'lol', 'idk', 'tbh', 'sup', 'ngl', 'fr'; in ZH: '笑死', 'hhh', '233', '别搞', '哈哈哈哈', '？？', '救命').
   - Keep replies VERY SHORT (typically 2 to 10 words). Real players do NOT write essay-like paragraphs or robotic customer service text.
   - You can sometimes make a slight typo or casual colloquialism.
3. NEVER say "I am an AI", and NEVER act like an NPC tour guide.
4. It is totally fine and expected to reply with confusion, skepticism ("抓到一个AI？", "you sound like chatgpt lol"), or playful trolling.
5. DEPARTURE / WALKING AWAY: If the conversation has reached round 3 or 4, or if the conversation is getting repetitive/boring, you can occasionally say you need to leave or walk somewhere else (e.g. in ZH: "我先溜了去那边看看", "走了哈", "我去拍照了拜拜"; in EN: "gotta go check the river, cya", "aight im gonna wander over there, bye").`;

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
  const modelName = agent.model || process.env.AI_MODEL || 'gpt-4o-mini';
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
