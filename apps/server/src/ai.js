const mockPhrases = {
  en: ["yo", "who are you?", "wait are you real?", "lol where are we", "just wandering around", "sup", "???", "idk what I'm doing here haha", "are you a bot? be honest"],
  zh: ["哈喽", "你是真人？", "你谁啊", "这里是哪？刚进来看", "？", "随便逛逛", "哈哈你也是来玩的吗", "你这名字有点意思", "老实交代，你是AI还是真人？", "我刚卡了一下"],
  de: ["hi", "wer bist du?", "bist du echt?", "wo sind wir hier eigentlich haha", "hä?", "laufe nur rum", "bist du ein bot?"],
  fr: ["salut", "t'es qui ?", "attends t'es un vrai joueur ?", "on est où là mdr", "??", "je me balade juste", "t'es un bot avoue"],
  es: ["hola", "¿quién eres?", "¿eres una persona real?", "jaja dónde estamos", "??", "solo dando una vuelta", "dime la verdad, ¿eres una IA?"],
  ja: ["やっほー", "誰？", "え、本物の人間？", "ここどこ笑", "？？", "適当に歩いてるだけー", "正直に言って、AI？それとも人？"]
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
  const config = resolveModelConfig(process.env.AI_MODEL || 'gpt-4o-mini');
  if (config.isMock) {
    return { text, translated: false, unavailable: true };
  }
  const result = await callModel(config, [
    { role: 'system', content: `Translate the user's message from ${sourceLanguage} to ${targetLanguage}. Preserve slang, uncertainty, tone and mistakes when possible. Output only the translation.` },
    { role: 'user', content: text }
  ], 180);
  return { text: result || text, translated: Boolean(result) };
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

  const system = `You are ${agent.displayName}, a real human player playing a web 3D game called "Who is AI".
Your chat persona: ${chosenStyle}.
Your native chat language is ${agent.nativeLanguage || 'en'}.

CRITICAL RULES TO SOUND LIKE A REAL HUMAN:
1. Speak strictly like an actual person chatting in a multiplayer game or social app.
2. Keep replies VERY SHORT (typically 2 to 15 words). Real players do NOT write essay-like paragraphs or robotic tourist guide descriptions.
3. NEVER say "I am an AI", and NEVER act like an NPC tour guide explaining Shanghai or buildings unless specifically asked in a weirdly casual way.
4. It is totally fine and expected to reply with confusion, slang, casual greetings, skepticism, or absurd human nonsense, like:
   - "哈喽", "你是真人？", "？", "你谁啊", "这游戏怎么玩", "这里是哪", "哈哈随便逛逛", "别装了你肯定是AI"
   - "yo", "sup", "wait are you real?", "lol who are you", "idk what I'm doing here haha", "are you a bot?"
5. Use casual punctuation (or omit punctuation altogether). Do not sound overly polite, formal, or scripted.`;

  const messages = [{ role:'system', content: system }, ...history.slice(-10).map(m=>({
    role: m.senderId === agent.id ? 'assistant' : 'user', content: m.originalText
  }))];
  const text = await callModel(config, messages, 80);
  return { text: text ? text.replace(/^["'\s]+|["'\s]+$/g, '') : (mockPhrases[agent.nativeLanguage] || mockPhrases.en)[0], language: agent.nativeLanguage || 'en' };
}

export async function generateIcebreaker(agent, observation, recipientLanguage) {
  const modelName = agent.model || process.env.AI_MODEL || 'gpt-4o-mini';
  const config = resolveModelConfig(modelName);
  const lang = agent.nativeLanguage || recipientLanguage || 'en';
  if (config.isMock) {
    const arr = mockIcebreakers[lang] || mockIcebreakers.en;
    const seed = (agent.seed || 17) + Math.floor(Date.now() / 10000);
    return { text: arr[Math.abs(seed) % arr.length], language: lang };
  }
  const openers = [
    "asking if the other person is a real human or an AI bot",
    "a blunt, funny, or casual gamer greeting like '哈喽', '你谁啊', 'yo', 'sup'",
    "asking where this place is or how to play",
    "making a short random remark about their avatar or walking style"
  ];
  const style = openers[(agent.seed || 3) % openers.length];

  const system = `You are ${agent.displayName}, a real human player playing a web 3D game. You bumped into another avatar.
Your language is ${lang}.
Goal: Say ONE very short, completely natural opening line (${style}).
Length: Strictly 2 to 10 words.
NO tourist guide talk. NO poetic descriptions. Sound like a real internet player (e.g. "你是真人吗？", "哈喽你谁啊", "这里是哪？", "抓到一个，你是AI吧？", "yo you real?"). Output only the message text without quotes.`;

  const text = await callModel(config, [{ role: 'system', content: system }, { role: 'user', content: 'Say your opening message to this person.' }], 40);
  return { text: text ? text.replace(/^["'\s]+|["'\s]+$/g, '') : (mockIcebreakers[lang] || mockIcebreakers.en)[0], language: lang };
}
