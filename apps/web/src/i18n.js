/**
 * WHO IS AI? - Multi-language Internationalization Dictionary
 * Supports: zh (Chinese), en (English), ja (Japanese), de (German), fr (French), es (Spanish)
 */

export const LANGS = [
  ['zh', '中文 (Chinese)'],
  ['en', 'English'],
  ['ja', '日本語 (Japanese)'],
  ['de', 'Deutsch (German)'],
  ['fr', 'Français (French)'],
  ['es', 'Español (Spanish)']
];

export const TRANSLATIONS = {
  zh: {
    // Landing
    globalTuringTest: '全球社交图灵测试',
    tagline: '漫步外滩，偶遇陌生人。五轮对话，识别真人还是AI。',
    ruleCorrect: '判断正确 +1',
    ruleWrong: '判断错误 −1',
    ruleNotSure: '不确定 0',
    nicknameLabel: '玩家昵称',
    nicknamePlaceholder: '访客-{id}',
    myLanguageLabel: '界面与对话语言',
    enterWorld: '进入世界',
    uuidNotice: '您的匿名通行证保存在本地浏览器中，下次进入将保留您的积分与战绩。',

    // HUD Top & Controls
    liveWorld: '外滩实景世界',
    scoreLabel: '积分',
        globalLeaderboardBtn: '🏆 全球榜单',
    audioBgmToggle: 'MIDI 音乐',
    audioOn: '开',
    audioOff: '关',
    controlMove: '移动',
    controlRun: '奔跑',
    controlTalk: '对话',
    talkTo: '与 {name} 对话',
    areTheyHuman: '对方是真人还是AI？',
    youAvatar: '你 (You)',
    youMap: '您',

    // Conversation Panel
    strangerHidden: '陌生人 · 身份隐藏',
    knownParticipant: '已评判参与者 · 自由畅聊',
    roundMeter: '对话轮次',
    alreadyJudgedBanner: '已完成评判 · 自由畅聊（不计分）',
    emptyChat: '自然地开启交谈吧。问问周边的风景、他们的一天，或任何能展现对方思维方式的话题。',
    showTranslation: '查看翻译',
    showOriginal: '查看原文',
    translationUnavailable: '本地测试模式未启用在线翻译 · 显示原文',
    theyWere: '对方真实身份是',
    humanVerdict: '真人 (HUMAN)',
    aiVerdict: '人工智能 (AI)',
    notSureVerdict: '不确定 (NOT SURE)',
    guessHumanBtn: '真人',
    guessAiBtn: 'AI',
    guessNotSureBtn: '不确定',
    youGuessed: '你的最终判断是 {guess}。',
    pointDelta: '{delta} 分',
    keepWalking: '继续漫步',
    composerPlaceholder: '输入消息…',
    composerRoundsLocked: '已满五轮对话 — 请做出你的最终评判',
    sendBtn: '发送',
    yourVerdictTitle: '你的最终判断',
    passiveNoteTesting: '对方正在测试你。自然回复即可 — 由对方判断你的身份。',
    passiveNoteCasual: '你已对该参与者完成过评判。尽情自由交流吧！',

    // Leaderboard
    leaderboardEyebrow: '全球排行',
    aiBenchmarkEyebrow: 'AI 基准',
    leaderboardTitle: '玩家天梯榜',
    aiLeaderboardTitle: 'AI 模型拟真榜',
    tabPlayers: '🏆 玩家天梯',
    tabImpostors: '🎭 伪装大师',
    tabModels: '🤖 AI 模型',
    colRank: '#',
    colPlayer: '玩家',
    colScore: '积分',
    colAccuracy: '正确率',
    noPlayers: '暂无排名的玩家。快去做出你的第一次判断吧！',
    leaderFootRule: '判断正确 +1 · 错误 −1 · 不确定 0',
        leaderFootTie: '平分时判定率优先，防止一直选择“不确定”占据榜首。',
    impostorEyebrow: '伪装统计',
    impostorLeaderboardTitle: '伪装大师榜',
    impostorSubhead: '谁最擅长假扮 AI 骗过其他人类侦探？',
    colDeceptionRate: '欺骗率',
    colDeceivedCount: '成功骗过/受测',
    badgeImpostor: '🎭 算力级戏精',
    noImpostors: '暂无伪装数据。快去接受其他玩家的测试并假扮 AI 吧！',
    impostorFootNote: '欺骗率统计：当你作为人类被其他人测试时，对方误判为“AI”或陷入“不确定”的综合比例。',
    modelSubhead: '哪个大语言模型最难被识破？',
    colModel: '模型名称',
    colUndetected: '人类误判率',
    colPlays: '遭遇局数',
    badgeUndetected: '👑 最逼真',
    noModels: '未配置 AI 模型。',
    modelFootNote: '误判率 = 人类误判为真人的次数 ÷ 总遭遇次数',

    // Minimap
    minimapTitle: '上海外滩 · 陆家嘴实景地图',
    mapCollapse: '收起小地图',
    mapExpand: '展开小地图',
    catAll: '全部',
    catPudong: '陆家嘴',
    catBund: '外滩建筑',
    catBoat: '游船航道',
    zonePudong: '浦东 · 陆家嘴金融城',
    zoneRiver: '黄浦江主航道 (124m) 🚢',
    zonePromenade: '外滩滨江长廊 (观景台)',
    locPromenade: '📍 外滩滨江长廊',
    locHistoric: '📍 中山东一路历史街区',
    distMeters: '距离您约 {dist} 米',
    tagPudong: '陆家嘴金融城',
    tagBoat: '浦江水上游船',
    tagBund: '外滩万国建筑群'
  },

  en: {
    // Landing
    globalTuringTest: 'GLOBAL SOCIAL TURING TEST',
    tagline: 'Walk. Meet a stranger. Talk for five rounds. Decide.',
    ruleCorrect: 'Correct +1',
    ruleWrong: 'Wrong −1',
    ruleNotSure: 'Not sure 0',
    nicknameLabel: 'Nickname',
    nicknamePlaceholder: 'Guest-{id}',
    myLanguageLabel: 'UI & Chat Language',
    enterWorld: 'ENTER THE WORLD',
    uuidNotice: 'Your anonymous UUID stays in this browser, so your score returns next time.',

    // HUD Top & Controls
    liveWorld: 'LIVE WORLD',
    scoreLabel: 'SCORE',
    globalLeaderboardBtn: '🏆 Global',
    controlMove: 'Move',
    controlRun: 'Run',
    controlTalk: 'Talk',
    talkTo: 'TALK TO {name}',
    areTheyHuman: 'Are they human?',
    youAvatar: 'You',
    youMap: 'You',

    // Conversation Panel
    strangerHidden: 'STRANGER · identity hidden',
    knownParticipant: 'KNOWN PARTICIPANT · Free chat',
    roundMeter: 'ROUND',
    alreadyJudgedBanner: 'Already judged · Free chat (No points)',
    emptyChat: 'Start naturally. Ask about the world, their day, or anything that might reveal how they think.',
    showTranslation: 'Show translation',
    showOriginal: 'Show original',
    translationUnavailable: 'Translation unavailable in mock mode · original shown',
    theyWere: 'THEY WERE',
    humanVerdict: 'HUMAN',
    aiVerdict: 'AI',
    notSureVerdict: 'NOT SURE',
    guessHumanBtn: 'HUMAN',
    guessAiBtn: 'AI',
    guessNotSureBtn: 'NOT SURE',
    youGuessed: 'You guessed {guess}.',
    pointDelta: '{delta} point',
    keepWalking: 'KEEP WALKING',
    composerPlaceholder: 'Say something…',
    composerRoundsLocked: 'Five rounds reached — make your guess',
    sendBtn: 'Send',
    yourVerdictTitle: 'YOUR VERDICT',
    passiveNoteTesting: 'Someone is testing you. Reply naturally — they will decide who you are.',
    passiveNoteCasual: 'You already evaluated this participant. Enjoy casual chatting!',

    // Leaderboard
    leaderboardEyebrow: 'GLOBAL',
    aiBenchmarkEyebrow: 'AI BENCHMARK',
    leaderboardTitle: 'Leaderboard',
    aiLeaderboardTitle: 'AI Model Leaderboard',
    tabPlayers: '🏆 Players',
    tabModels: '🤖 AI Models',
    colRank: '#',
    colPlayer: 'Player',
    colScore: 'Score',
    colAccuracy: 'Accuracy',
    noPlayers: 'No ranked players yet. Make the first guess.',
    leaderFootRule: 'Correct +1 · Wrong −1 · Not sure 0',
    leaderFootTie: 'Decision rate breaks ties so always choosing “Not sure” does not dominate.',
    modelSubhead: 'Which AI is hardest to detect?',
    colModel: 'Model',
    colUndetected: 'Hardest to Detect',
    colPlays: 'Plays',
    badgeUndetected: '👑 Undetected',
    noModels: 'No AI models configured.',
    modelFootNote: 'Accuracy = Human ratings ÷ Total encounters',

    // Minimap
    minimapTitle: 'The Bund & Lujiazui Live Map',
    mapCollapse: 'Collapse Map',
    mapExpand: 'Expand Map',
    catAll: 'All',
    catPudong: 'Lujiazui',
    catBund: 'The Bund',
    catBoat: 'Cruises',
    zonePudong: 'Pudong · Lujiazui Megacity',
    zoneRiver: 'Huangpu River Fairway (124m) 🚢',
    zonePromenade: 'The Bund Promenade (Observation Deck)',
    locPromenade: '📍 The Bund Promenade',
    locHistoric: '📍 Zhongshan Rd Heritage District',
    distMeters: 'Approx {dist}m from you',
    tagPudong: 'Lujiazui Skyline',
    tagBoat: 'Huangpu Cruise',
    tagBund: 'The Bund Heritage'
  },

  ja: {
    // Landing
    globalTuringTest: 'グローバルソーシャルチューリングテスト',
    tagline: '外灘を歩き、見知らぬ人に出会う。5ラウンド話し、見抜く。',
    ruleCorrect: '正解 +1',
    ruleWrong: '不正解 −1',
    ruleNotSure: '保留 0',
    nicknameLabel: 'ニックネーム',
    nicknamePlaceholder: 'ゲスト-{id}',
    myLanguageLabel: '言語設定',
    enterWorld: 'ワールドに入る',
    uuidNotice: '匿名のUUIDはブラウザに保存され、次回アクセス時もスコアが保持されます。',

    // HUD Top & Controls
    liveWorld: '外灘ライブワールド',
    scoreLabel: 'スコア',
    globalLeaderboardBtn: '🏆 ランキング',
    controlMove: '移動',
    controlRun: '走る',
    controlTalk: '話す',
    talkTo: '{name} と話す',
    areTheyHuman: '人間か、それともAIか？',
    youAvatar: 'あなた',
    youMap: 'あなた',

    // Conversation Panel
    strangerHidden: '見知らぬ人 · 正体不明',
    knownParticipant: '判定済み · フリートーク',
    roundMeter: 'ラウンド',
    alreadyJudgedBanner: '判定済み · フリートーク（ポイントなし）',
    emptyChat: '自然に会話を始めてみましょう。風景や日常など、思考が伝わる質問を。',
    showTranslation: '翻訳を表示',
    showOriginal: '原文を表示',
    translationUnavailable: 'モックモードのため翻訳は利用不可 · 原文表示',
    theyWere: '相手の正体は',
    humanVerdict: '人間 (HUMAN)',
    aiVerdict: '人工知能 (AI)',
    notSureVerdict: '保留 (NOT SURE)',
    guessHumanBtn: '人間',
    guessAiBtn: 'AI',
    guessNotSureBtn: '保留',
    youGuessed: 'あなたの最終判定は {guess} でした。',
    pointDelta: '{delta} ポイント',
    keepWalking: '探索を続ける',
    composerPlaceholder: 'メッセージを入力…',
    composerRoundsLocked: '5ラウンド終了 — 最終判定を行ってください',
    sendBtn: '送信',
    yourVerdictTitle: 'あなたの判定',
    passiveNoteTesting: '相手があなたをテストしています。自然に返信してください。',
    passiveNoteCasual: 'この相手は判定済みです。自由なチャットを楽しんでください！',

    // Leaderboard
    leaderboardEyebrow: '世界ランキング',
    aiBenchmarkEyebrow: 'AIベンチマーク',
    leaderboardTitle: 'プレイヤーランキング',
    aiLeaderboardTitle: 'AIモデル擬人化ランキング',
    tabPlayers: '🏆 プレイヤー',
    tabModels: '🤖 AIモデル',
    colRank: '#',
    colPlayer: 'プレイヤー',
    colScore: 'スコア',
    colAccuracy: '正解率',
    noPlayers: 'ランキングがまだありません。最初の判定を行いましょう！',
    leaderFootRule: '正解 +1 · 不正解 −1 · 保留 0',
    leaderFootTie: '同点時は判定率が高い方が上位になります。',
    modelSubhead: '最も人間らしいAIモデルはどれか？',
    colModel: 'モデル',
    colUndetected: '未看破率',
    colPlays: '対戦数',
    badgeUndetected: '👑 最高峰',
    noModels: 'AIモデルが設定されていません。',
    modelFootNote: '未看破率 = 人間と誤認された回数 ÷ 総遭遇数',

    // Minimap
    minimapTitle: '上海外灘 · 陸家嘴実景マップ',
    mapCollapse: 'マップを縮小',
    mapExpand: 'マップを展開',
    catAll: 'すべて',
    catPudong: '陸家嘴',
    catBund: '外灘建築',
    catBoat: '遊覧船',
    zonePudong: '浦東 · 陸家嘴金融街',
    zoneRiver: '黄浦江本流航路 (124m) 🚢',
    zonePromenade: '外灘プロムナード (展望デッキ)',
    locPromenade: '📍 外灘プロムナード',
    locHistoric: '📍 中山东一路歴史街区',
    distMeters: 'あなたから約 {dist}m',
    tagPudong: '陸家嘴超高層ビル群',
    tagBoat: '黄浦江遊覧船',
    tagBund: '外灘万国建築群'
  },

  de: {
    // Landing
    globalTuringTest: 'GLOBALER SOZIALER TURING-TEST',
    tagline: 'Spaziere am Bund. Triff Fremde. Sprich fünf Runden. Entscheide.',
    ruleCorrect: 'Richtig +1',
    ruleWrong: 'Falsch −1',
    ruleNotSure: 'Unsicher 0',
    nicknameLabel: 'Spitzname',
    nicknamePlaceholder: 'Gast-{id}',
    myLanguageLabel: 'Sprache',
    enterWorld: 'WELT BETRETEN',
    uuidNotice: 'Deine anonyme UUID bleibt gespeichert, damit dein Punktestand erhalten bleibt.',

    // HUD Top & Controls
    liveWorld: 'LIVE-WELT',
    scoreLabel: 'PUNKTE',
    globalLeaderboardBtn: '🏆 Rangliste',
    controlMove: 'Gehen',
    controlRun: 'Rennen',
    controlTalk: 'Reden',
    talkTo: 'MIT {name} SPRECHEN',
    areTheyHuman: 'Mensch oder KI?',
    youAvatar: 'Du',
    youMap: 'Du',

    // Conversation Panel
    strangerHidden: 'FREMDER · Identität verborgen',
    knownParticipant: 'BEKANNTER TEILNEHMER · Freier Chat',
    roundMeter: 'RUNDE',
    alreadyJudgedBanner: 'Bereits bewertet · Freier Chat (Keine Punkte)',
    emptyChat: 'Beginne ganz natürlich. Frage nach der Umgebung, ihrem Tag oder Gedanken.',
    showTranslation: 'Übersetzung',
    showOriginal: 'Original',
    translationUnavailable: 'Übersetzung im Mock-Modus nicht verfügbar',
    theyWere: 'SIE WAREN',
    humanVerdict: 'MENSCH',
    aiVerdict: 'KI',
    notSureVerdict: 'NICHT SICHER',
    guessHumanBtn: 'MENSCH',
    guessAiBtn: 'KI',
    guessNotSureBtn: 'NICHT SICHER',
    youGuessed: 'Dein Urteil war {guess}.',
    pointDelta: '{delta} Punkt(e)',
    keepWalking: 'WEITERGEHEN',
    composerPlaceholder: 'Sag etwas…',
    composerRoundsLocked: 'Fünf Runden erreicht — triff deine Entscheidung',
    sendBtn: 'Senden',
    yourVerdictTitle: 'DEIN URTEIL',
    passiveNoteTesting: 'Jemand testet dich. Antworte natürlich.',
    passiveNoteCasual: 'Bereits bewertet. Genieße das Gespräch!',

    // Leaderboard
    leaderboardEyebrow: 'GLOBAL',
    aiBenchmarkEyebrow: 'KI-BENCHMARK',
    leaderboardTitle: 'Rangliste',
    aiLeaderboardTitle: 'KI-Modell-Rangliste',
    tabPlayers: '🏆 Spieler',
    tabModels: '🤖 KI-Modelle',
    colRank: '#',
    colPlayer: 'Spieler',
    colScore: 'Punkte',
    colAccuracy: 'Genauigkeit',
    noPlayers: 'Noch keine gewerteten Spieler.',
    leaderFootRule: 'Richtig +1 · Falsch −1 · Unsicher 0',
    leaderFootTie: 'Die Entscheidungsquote entscheidet bei Gleichstand.',
    modelSubhead: 'Welches KI-Modell ist am schwersten zu entlarven?',
    colModel: 'Modell',
    colUndetected: 'Täuschungsrate',
    colPlays: 'Spiele',
    badgeUndetected: '👑 Meister',
    noModels: 'Keine KI-Modelle konfiguriert.',
    modelFootNote: 'Genauigkeit = Menschliche Bewertungen ÷ Begegnungen',

    // Minimap
    minimapTitle: 'The Bund & Lujiazui Live-Karte',
    mapCollapse: 'Karte einklappen',
    mapExpand: 'Karte ausklappen',
    catAll: 'Alle',
    catPudong: 'Lujiazui',
    catBund: 'Der Bund',
    catBoat: 'Schiffe',
    zonePudong: 'Pudong · Lujiazui Finanzstadt',
    zoneRiver: 'Huangpu Hauptschifffahrtsweg (124m) 🚢',
    zonePromenade: 'Bund-Uferpromenade (Aussicht)',
    locPromenade: '📍 Bund-Uferpromenade',
    locHistoric: '📍 Historisches Zhongshan-Viertel',
    distMeters: 'Etwa {dist}m von dir entfernt',
    tagPudong: 'Lujiazui Skyline',
    tagBoat: 'Kreuzfahrtschiffe',
    tagBund: 'Historische Bauten'
  },

  fr: {
    // Landing
    globalTuringTest: 'TEST DE TURING SOCIAL MONDIAL',
    tagline: 'Promenez-vous sur le Bund. Rencontrez un inconnu. Cinq tours. Décidez.',
    ruleCorrect: 'Correct +1',
    ruleWrong: 'Faux −1',
    ruleNotSure: 'Incertain 0',
    nicknameLabel: 'Pseudo',
    nicknamePlaceholder: 'Invité-{id}',
    myLanguageLabel: 'Langue',
    enterWorld: 'ENTRER DANS LE MONDE',
    uuidNotice: 'Votre UUID anonyme est conservé sur ce navigateur.',

    // HUD Top & Controls
    liveWorld: 'MONDE EN DIRECT',
    scoreLabel: 'SCORE',
    globalLeaderboardBtn: '🏆 Classement',
    controlMove: 'Marcher',
    controlRun: 'Courir',
    controlTalk: 'Parler',
    talkTo: 'PARLER À {name}',
    areTheyHuman: 'Humain ou IA ?',
    youAvatar: 'Vous',
    youMap: 'Vous',

    // Conversation Panel
    strangerHidden: 'INCONNU · Identité cachée',
    knownParticipant: 'PARTICIPANT CONNU · Chat libre',
    roundMeter: 'TOUR',
    alreadyJudgedBanner: 'Déjà évalué · Chat libre (Pas de points)',
    emptyChat: 'Commencez naturellement. Parlez de la vue, de votre journée ou de vos pensées.',
    showTranslation: 'Traduction',
    showOriginal: 'Original',
    translationUnavailable: 'Traduction indisponible en mode mock',
    theyWere: 'IL S\'AGISSAIT DE',
    humanVerdict: 'HUMAIN',
    aiVerdict: 'IA',
    notSureVerdict: 'PAS SÛR',
    guessHumanBtn: 'HUMAIN',
    guessAiBtn: 'IA',
    guessNotSureBtn: 'PAS SÛR',
    youGuessed: 'Votre verdict était {guess}.',
    pointDelta: '{delta} point(s)',
    keepWalking: 'CONTINUER À MARCHER',
    composerPlaceholder: 'Dites quelque chose…',
    composerRoundsLocked: 'Cinq tours atteints — faites votre choix',
    sendBtn: 'Envoyer',
    yourVerdictTitle: 'VOTRE VERDICT',
    passiveNoteTesting: 'Quelqu\'un vous teste. Répondez naturellement.',
    passiveNoteCasual: 'Déjà évalué. Profitez de la discussion !',

    // Leaderboard
    leaderboardEyebrow: 'MONDIAL',
    aiBenchmarkEyebrow: 'BENCHMARK IA',
    leaderboardTitle: 'Classement des joueurs',
    aiLeaderboardTitle: 'Classement des modèles IA',
    tabPlayers: '🏆 Joueurs',
    tabModels: '🤖 Modèles IA',
    colRank: '#',
    colPlayer: 'Joueur',
    colScore: 'Score',
    colAccuracy: 'Précision',
    noPlayers: 'Aucun joueur classé pour le moment.',
    leaderFootRule: 'Correct +1 · Faux −1 · Incertain 0',
    leaderFootTie: 'Le taux de décision départage les égalités.',
    modelSubhead: 'Quelle IA est la plus difficile à détecter ?',
    colModel: 'Modèle',
    colUndetected: 'Taux indétecté',
    colPlays: 'Parties',
    badgeUndetected: '👑 Indétectable',
    noModels: 'Aucun modèle IA configuré.',
    modelFootNote: 'Précision = Avis humains ÷ Total des rencontres',

    // Minimap
    minimapTitle: 'Carte en direct du Bund et de Lujiazui',
    mapCollapse: 'Réduire',
    mapExpand: 'Agrandir',
    catAll: 'Tout',
    catPudong: 'Lujiazui',
    catBund: 'Le Bund',
    catBoat: 'Bateaux',
    zonePudong: 'Pudong · Cité financière',
    zoneRiver: 'Chenal du fleuve Huangpu (124m) 🚢',
    zonePromenade: 'Promenade du Bund (Belvédère)',
    locPromenade: '📍 Promenade du Bund',
    locHistoric: '📍 Quartier historique de Zhongshan',
    distMeters: 'À environ {dist}m de vous',
    tagPudong: 'Skyline de Lujiazui',
    tagBoat: 'Bateaux de croisière',
    tagBund: 'Monuments du Bund'
  },

  es: {
    // Landing
    globalTuringTest: 'TEST DE TURING SOCIAL GLOBAL',
    tagline: 'Camina por el Bund. Conoce a un extraño. Cinco rondas. Decide.',
    ruleCorrect: 'Correcto +1',
    ruleWrong: 'Falso −1',
    ruleNotSure: 'Inseguro 0',
    nicknameLabel: 'Apodo',
    nicknamePlaceholder: 'Invitado-{id}',
    myLanguageLabel: 'Idioma',
    enterWorld: 'ENTRAR AL MUNDO',
    uuidNotice: 'Tu UUID anónimo se conserva en este navegador.',

    // HUD Top & Controls
    liveWorld: 'MUNDO EN VIVO',
    scoreLabel: 'PUNTOS',
    globalLeaderboardBtn: '🏆 Clasificación',
    controlMove: 'Mover',
    controlRun: 'Correr',
    controlTalk: 'Hablar',
    talkTo: 'HABLAR CON {name}',
    areTheyHuman: '¿Humano o IA?',
    youAvatar: 'Tú',
    youMap: 'Tú',

    // Conversation Panel
    strangerHidden: 'EXTRAÑO · Identidad oculta',
    knownParticipant: 'PARTICIPANTE CONOCIDO · Chat libre',
    roundMeter: 'RONDA',
    alreadyJudgedBanner: 'Ya evaluado · Chat libre (Sin puntos)',
    emptyChat: 'Empieza con naturalidad. Pregunta sobre el paisaje, su día o sus pensamientos.',
    showTranslation: 'Traducción',
    showOriginal: 'Original',
    translationUnavailable: 'Traducción no disponible en modo mock',
    theyWere: 'REALMENTE ERAN',
    humanVerdict: 'HUMANO',
    aiVerdict: 'IA',
    notSureVerdict: 'NO ESTOY SEGURO',
    guessHumanBtn: 'HUMANO',
    guessAiBtn: 'IA',
    guessNotSureBtn: 'NO SEGURO',
    youGuessed: 'Tu veredicto fue {guess}.',
    pointDelta: '{delta} punto(s)',
    keepWalking: 'SEGUIR CAMINANDO',
    composerPlaceholder: 'Di algo…',
    composerRoundsLocked: 'Cinco rondas alcanzadas — haz tu veredicto',
    sendBtn: 'Enviar',
    yourVerdictTitle: 'TU VEREDICTO',
    passiveNoteTesting: 'Alguien te está evaluando. Responde con naturalidad.',
    passiveNoteCasual: 'Ya evaluado. ¡Disfruta la conversación!',

    // Leaderboard
    leaderboardEyebrow: 'GLOBAL',
    aiBenchmarkEyebrow: 'BENCHMARK DE IA',
    leaderboardTitle: 'Clasificación de jugadores',
    aiLeaderboardTitle: 'Clasificación de modelos de IA',
    tabPlayers: '🏆 Jugadores',
    tabModels: '🤖 Modelos IA',
    colRank: '#',
    colPlayer: 'Jugador',
    colScore: 'Puntos',
    colAccuracy: 'Precisión',
    noPlayers: 'Aún no hay jugadores clasificados.',
    leaderFootRule: 'Correcto +1 · Falso −1 · Inseguro 0',
    leaderFootTie: 'La tasa de decisión desempata las puntuaciones.',
    modelSubhead: '¿Qué modelo de IA es más difícil de detectar?',
    colModel: 'Modelo',
    colUndetected: 'Tasa no detectada',
    colPlays: 'Partidas',
    badgeUndetected: '👑 No detectado',
    noModels: 'No hay modelos de IA configurados.',
    modelFootNote: 'Precisión = Votos humanos ÷ Total de encuentros',

    // Minimap
    minimapTitle: 'Mapa en vivo del Bund y Lujiazui',
    mapCollapse: 'Plegar mapa',
    mapExpand: 'Desplegar mapa',
    catAll: 'Todo',
    catPudong: 'Lujiazui',
    catBund: 'El Bund',
    catBoat: 'Barcos',
    zonePudong: 'Pudong · Ciudad Financiera',
    zoneRiver: 'Canal del río Huangpu (124m) 🚢',
    zonePromenade: 'Paseo del Bund (Mirador)',
    locPromenade: '📍 Paseo del Bund',
    locHistoric: '📍 Distrito histórico de Zhongshan',
    distMeters: 'Aprox. a {dist}m de ti',
    tagPudong: 'Skyline de Lujiazui',
    tagBoat: 'Barcos turísticos',
    tagBund: 'Edificios del Bund'
  }
};

export function t(key, lang = 'zh', params = {}) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['zh'] || TRANSLATIONS['en'];
  let val = dict[key] ?? TRANSLATIONS['en']?.[key] ?? TRANSLATIONS['zh']?.[key] ?? key;
  if (typeof val === 'function') return val(params);
  if (typeof val === 'string') {
    for (const [k, v] of Object.entries(params)) {
      val = val.replaceAll(`{${k}}`, v);
    }
  }
  return val;
}

export const LANDMARK_LOCALIZATIONS = {
  pearl: {
    en: { name: 'Oriental Pearl Tower', short: 'Pearl Tower', desc: '468m tall landmark with iconic magenta-pink illuminated spheres and space cabin' },
    ja: { name: '東方明珠電視塔', short: '東方明珠', desc: '高さ468m、ピンクに輝く二重球体とスペースキャビンを持つ上海のシンボル' }
  },
  convention: {
    en: { name: 'Shanghai Int. Convention Center', short: 'Convention Ctr', desc: 'Waterfront landmark featuring iconic dual spherical glass globes and grand colonnade' },
    ja: { name: '上海国際会議中心', short: '国際会議中心', desc: '水辺に輝く二つのガラス球体と荘厳な列柱を持つ国際会議場' }
  },
  sh_tower: {
    en: { name: 'Shanghai Tower', short: 'Shanghai Tower', desc: "China's tallest skyscraper at 632m, featuring spiraling curved facade and emerald laser band" },
    ja: { name: '上海中心大厦', short: '上海中心', desc: '中国最高峰の632m。ねじれ上昇する流線美とエメラルドのレーザー光帯' }
  },
  swfc: {
    en: { name: 'Shanghai World Financial Center', short: 'SWFC', desc: '492m skyscraper with iconic trapezoidal skybridge aperture ("The Bottle Opener")' },
    ja: { name: '上海環球金融中心', short: '環球金融', desc: '高さ492m、最頂部に台形風洞の展望ブリッジを持つ「栓抜きビル」' }
  },
  jinmao: {
    en: { name: 'Jin Mao Tower', short: 'Jin Mao', desc: '420.5m landmark featuring 11-stage traditional pagoda eaves glowing with golden amber light' },
    ja: { name: '金茂大厦', short: '金茂大厦', desc: '高さ420.5m、伝統的な密檐宝塔の意匠を取り入れた琥珀色に輝く超高層ビル' }
  },
  aurora: {
    en: { name: 'Aurora Plaza', short: 'Aurora Plaza', desc: 'Golden curved facade with the world-famous giant "I ❤️ SH" red LED screen' },
    ja: { name: '震旦国際ビル', short: '震旦ビル', desc: '金色の湾曲ファサードと、世界的に有名な巨大「I ❤️ SH」LEDスクリーン' }
  },
  citi: {
    en: { name: 'Citigroup Tower', short: 'Citi Tower', desc: 'Blue glass facade with 10 horizontal cyan light bands, red umbrella logo, and golden crown' },
    ja: { name: 'シティグループタワー', short: 'シティタワー', desc: '青いガラスカーテンウォール、水平の光帯、赤のアーチロゴと金色の王冠' }
  },
  ifc: {
    en: { name: 'Shanghai IFC Twin Towers', short: 'IFC Towers', desc: 'Diamond-faceted crystal skyscraper twin towers designed by Cesar Pelli' },
    ja: { name: '上海国金中心 (IFC)', short: 'IFCツイン', desc: 'シーザー・ペリ設計によるダイヤモンドカットのクリスタルツインタワー' }
  },
  skybridge: {
    en: { name: 'Lujiazui Circular Skybridge', short: 'Skybridge', desc: 'Iconic elevated circular walkway beneath Oriental Pearl connecting Lujiazui hubs' },
    ja: { name: '陸家嘴円形歩道橋', short: '円形歩道橋', desc: '東方明珠の足元に広がる光の円形空中回廊。主要拠点を連結' }
  },
  flagship: {
    en: { name: 'Huangpu Luxury Flagship Cruise', short: 'Flagship Cruise', desc: 'Double-deck sightseeing cruise ship with illuminated waterline and panoramic windows' },
    ja: { name: '浦江豪華フラッグシップ遊覧船', short: '旗艦遊覧船', desc: '黄浦江の二階建てパノラマ遊覧船。全景ガラスと彩光の水位線' }
  },
  antique: {
    en: { name: 'Antique Dragon Boat Cruise', short: 'Dragon Boat', desc: 'Traditional imperial antique sightseeing boat with golden eaves and glowing red lanterns' },
    ja: { name: '古典ドラゴン屋形船', short: '古典画舫', desc: '伝統的な金色の屋根瓦と飛檐を備え、赤い提灯が灯る優美な遊覧船' }
  },
  catamaran: {
    en: { name: 'Modern High-Speed Catamaran', short: 'Catamaran', desc: 'High-speed catamaran cruise boat with aerodynamic lines and cyan wave glow' },
    ja: { name: '高速双胴クルーザー', short: '高速快艇', desc: '空力的なフォルムとシアンのネオンをまとった黄浦江の高速双胴船' }
  },
  ferry: {
    en: { name: 'Historic Shanghai Ferry', short: 'Public Ferry', desc: 'Iconic red and white public ferry carrying century-old memories of Huangpu river transport' },
    ja: { name: 'レトロ公共フェリー', short: '市フェリー', desc: '赤白ツートンのクラシックフェリー。百年の渡船の歴史を継承' }
  },
  pilot: {
    en: { name: 'Fairway Pilot & Patrol Boat', short: 'Patrol Boat', desc: 'Maritime fairway safety patrol boat with bright yellow beacon and blue-white hull' },
    ja: { name: '水上パイロット・警備艇', short: '警備艇', desc: '航路の安全を守るパイロットボート。黄色い回転灯と青白の警備カラー' }
  },
  peace: {
    en: { name: 'Peace Hotel (Fairmont)', short: 'Peace Hotel', desc: 'Iconic 1929 Gothic heritage building with 77m green copper pyramid roof, "No. 1 Mansion of Far East"' },
    ja: { name: '和平飯店 (フェアモント)', short: '和平飯店', desc: '1929年竣工のゴシック建築。77mの緑青ピラミッド屋根を持つ「極東随一の洋館」' }
  },
  customs: {
    en: { name: 'Customs House', short: 'Customs House', desc: '1927 Neoclassical Doric colonnade building with Big Ching clock tower ringing Westminster chimes' },
    ja: { name: '江海関大楼 (税関)', short: '税関時計台', desc: '1927年建造のドーリア式列柱建築。ウエストミンスターの鐘を響かせる巨大時計台' }
  },
  hsbc: {
    en: { name: 'HSBC Building', short: 'HSBC Building', desc: 'Neoclassical Ionic colonnade masterpiece crowned by a grand Roman copper dome' },
    ja: { name: 'HSBCビル (旧香港上海銀行)', short: 'HSBCビル', desc: 'イオニア式列柱が立ち並ぶ新古典主義の傑作。中央に巨大な青銅ドームを冠する' }
  },
  boc: {
    en: { name: 'Bank of China Building', short: 'Bank of China', desc: 'East-meets-West Art Deco building with green glazed tile eaves and traditional bracket decors' },
    ja: { name: '中国銀行ビル', short: '中国銀行', desc: '緑の瑠璃瓦と中国伝統の斗拱をアール・デコ様式と融合させた中西折衷の名建築' }
  },
  waibaidu: {
    en: { name: 'Waibaidu Bridge', short: 'Waibaidu Bridge', desc: 'Historic 1907 camelback steel truss bridge spanning Suzhou Creek at the north end of The Bund' },
    ja: { name: '外白渡橋', short: '外白渡橋', desc: '1907年開通、蘇州河口に架かる中国初の全鋼鉄製トラス橋。映画のロケ地としても名高い' }
  },
  heroes: {
    en: { name: "Monument to the People's Heroes", short: 'Heroes Monument', desc: '60m tall three-rifle granite monument in Huangpu Park at the confluence of rivers' },
    ja: { name: '人民英雄記念塔', short: '英雄記念塔', desc: '黄浦公園にそびえる高さ60mの三銃花崗岩モニュメント。蘇州河と黄浦江の合流点' }
  }
};

export function getLocalizedLandmark(baseLandmark, lang = 'zh') {
  if (lang === 'zh') return baseLandmark;
  const loc = LANDMARK_LOCALIZATIONS[baseLandmark.id]?.[lang] || LANDMARK_LOCALIZATIONS[baseLandmark.id]?.['en'];
  if (!loc) return baseLandmark;
  return {
    ...baseLandmark,
    name: loc.name || baseLandmark.name,
    short: loc.short || baseLandmark.short,
    desc: loc.desc || baseLandmark.desc
  };
}

