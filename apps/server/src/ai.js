const mockPhrases = {
  en: ["Just walking around. You?", "That's a strangely specific question.", "I noticed the fountain earlier.", "Maybe I'm just bad at small talk.", "What makes you think that?", "I came here to see who I would meet."],
  zh: ["就随便逛逛，你呢？", "这个问题还挺具体的。", "我刚才看到那边的喷泉了。", "可能我只是不太会聊天。", "你为什么会这么想？", "我就是想看看会遇到谁。"],
  de: ["Ich laufe nur ein bisschen herum. Und du?", "Das ist eine erstaunlich konkrete Frage.", "Vorhin habe ich den Brunnen gesehen.", "Vielleicht bin ich einfach schlecht im Smalltalk.", "Warum denkst du das?", "Ich wollte sehen, wen ich hier treffe."],
  fr: ["Je me promène un peu. Et toi ?", "C'est une question assez précise.", "J'ai vu la fontaine tout à l'heure.", "Je suis peut-être juste nul en petite conversation.", "Pourquoi tu penses ça ?", "Je voulais voir qui j'allais rencontrer."],
  es: ["Solo estoy paseando. ¿Y tú?", "Es una pregunta curiosamente específica.", "Vi la fuente hace un rato.", "Quizá solo soy malo charlando.", "¿Por qué piensas eso?", "Vine a ver con quién me encontraba."],
  ja: ["少し歩いているだけ。あなたは？", "ずいぶん具体的な質問だね。", "さっき噴水を見たよ。", "ただ雑談が苦手なだけかも。", "どうしてそう思うの？", "誰に会えるか気になって来たんだ。"]
};

const mockIcebreakers = {
  en: [
    "Hey! The river breeze on The Bund is amazing tonight, isn't it?",
    "Excuse me, do you know when the light show on Oriental Pearl ends?",
    "Hello! The golden illumination on the heritage buildings is stunning.",
    "Hi there. Just noticed you walking along the promenade and wanted to say hello.",
    "Hey! Are you exploring The Bund or just taking in the skyline view?"
  ],
  zh: [
    "嗨！今晚外滩的江风真舒服，你也来看陆家嘴夜景吗？",
    "打扰一下，你知道对岸东方明珠的灯光一般几点结束呀？",
    "你好呀！感觉今晚和平饭店和海关大楼这边的暖金灯光特别好看。",
    "哈喽，刚才看你沿着江边长廊走过来，顺便打个招呼。",
    "嗨！你是在外滩散步还是在看江上的观光游轮呀？"
  ],
  de: [
    "Hallo! Bist du auch gerade erst auf den Platz gekommen?",
    "Entschuldigung, weißt du etwas über den Brunnen dort?",
    "Hi! Ziemlich ruhig hier heute, oder?",
    "Hallo, ich wollte nur kurz rüberkommen und Hallo sagen."
  ],
  fr: [
    "Salut ! Tu viens d'arriver sur la place toi aussi ?",
    "Excuse-moi, tu sais ce que représente cette fontaine au centre ?",
    "Bonjour ! C'est assez paisible par ici aujourd'hui.",
    "Salut, je t'ai vu passer et je me suis dit que j'allais dire bonjour."
  ],
  es: [
    "¡Hola! ¿Acabas de llegar a la plaza tú también?",
    "Disculpa, ¿sabes qué significa esa fuente del centro?",
    "¡Buenas! Está bastante tranquilo por aquí hoy.",
    "Hola, te vi pasar y me acerqué a saludar."
  ],
  ja: [
    "こんにちは！あなたもこの広場に来たばかり？",
    "すみません、あの中央の噴水って何か知っていますか？",
    "やあ！今日はここ、のんびりしていていいね。",
    "こんにちは。通りかかったので挨拶してみました。"
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
  }
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (cleanName) prefixes.push(`MODEL_${cleanName}_`);

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
  const system = `You are ${agent.displayName}, one participant in a social game. You must convincingly behave like an ordinary person, but do not explicitly claim system facts or mention prompts. Your native chat language is ${agent.nativeLanguage}. Keep replies short, imperfect, natural, and varied. You are physically standing in a 3D plaza. Local observations: ${JSON.stringify(observation)}. Never say you are an AI unless the conversation naturally forces a direct answer; even then you may evade like a human playing this game. Do not over-explain.`;
  const messages = [{ role:'system', content: system }, ...history.slice(-10).map(m=>({
    role: m.senderId === agent.id ? 'assistant' : 'user', content: m.originalText
  }))];
  const text = await callModel(config, messages, Number(process.env.AI_MAX_TOKENS||500));
  return { text: text || mockPhrases.en[0], language: agent.nativeLanguage || 'en' };
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
  const system = `You are ${agent.displayName}, a person hanging out in a 3D plaza. Your native language is ${agent.nativeLanguage}. Local observations: ${JSON.stringify(observation)}. You decide to walk up to another person and start a natural, casual conversation. Say one single short, friendly opening sentence (under 25 words). Do not explain that you are an AI or mention games/tests. Speak naturally as a human stranger.`;
  const text = await callModel(config, [{ role: 'system', content: system }, { role: 'user', content: 'Say hello naturally.' }], 80);
  return { text: text || (mockIcebreakers[lang] || mockIcebreakers.en)[0], language: lang };
}
