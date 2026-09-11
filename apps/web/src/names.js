export const LANGUAGE_NAME_POOLS = {
  zh: [
    // 真实网名 / 流行社交ID
    '晴天小狗', '小橙子', '熬夜冠军', '奶茶半糖', '风吹麦浪', '橘猫不吃鱼', '落日飞车',
    '今天早睡了吗', '想去吹晚风', '海盐气泡水', '摸鱼艺术家', '芋泥波波', '失眠飞行',
    '可乐加冰', '银河漫游指南', '薄荷微凉', '秋刀鱼的滋味', '咖啡不加糖', '快乐小汉堡',
    // 现代自然人名 / 常见名
    '晨曦', '江晓风', '宋欣怡', '沐辰', '陆浩然', '林深见鹿', '晚风拂柳', '陈雨欣',
    '阿泽', '张宇轩', '李子墨', '安安', '若汐', '沈清秋', '顾北辰', '苏小言',
    '白露', '星河漫步', '清风徐来', '半夏微凉', '云舒', '楚天阔', '南风知我意',
    // 随性玩家风
    '路过的路人甲', '吃饱了再减', '我不是AI啊', '闪电汤圆', '外滩小散步', '咕咕咕',
    '今天吃什么', '别刀我我真是人', '夜猫子', '柠檬不酸', '西瓜汽水'
  ],
  en: [
    // Casual gamer / social handles
    'PixelDancer', 'SkyWalker', 'NeonRider', 'SleepyOwl', 'CoffeeFirst', 'Echo_99',
    'MidnightSnack', 'CyberSamurai', 'RainySunday', 'JustVibing', 'LostInCode',
    'TeaLover_42', 'Wanderlust_Z', 'BobaAddict', 'Stargazer_X', 'ChillPanda',
    'NotABot_Fr', 'VelvetThunder', 'ShadowKitten', 'Nova_Core', 'GlitchyPenguin',
    // Modern natural first names & gamer tags
    'Oliver', 'Charlotte', 'Liam', 'Emma Wright', 'Lucas_M', 'Chloe', 'Sammy',
    'Sophie_K', 'Daniel', 'Mia', 'Alex', 'James', 'Zoe', 'Ethan', 'Grace',
    'Noah', 'Harper', 'Benjamin', 'Luna', 'Leo', 'Ava Martinez', 'Mason Reed',
    'Jack_D', 'Riley', 'Evelyn', 'Aiden', 'Maya_S', 'Logan'
  ],
  ja: [
    '陽菜 (Hina)', '蓮 (Ren)', '葵 (Aoi)', '翔太 (Shota)', '結衣 (Yui)', 'さくら',
    '大和', 'ゆき', '海斗', 'ソラ', '美咲', '拓海', '悠真', 'ハルカ', 'リク', '楓 (Kaede)',
    'ねこまんま', 'ミント', 'ほのぼの', 'たこやき星人', '夜更かしペンギン', '抹茶ラテ',
    'おもち', 'そら豆', 'にゃんこ先生', '星空ドライブ'
  ],
  ko: [
    '민준 (Minjun)', '서연 (Seoyeon)', '도윤 (Doyun)', '지우 (Jiwoo)', '하준 (Hajun)',
    '서아 (Seoah)', '유준 (Yujun)', '채원 (Chaewon)', '지호 (Jiho)', '수아 (Sua)',
    '새벽감성', '붕어빵', '초코우유', '졸린곰', '산책중', '라떼한잔', '보라돌이', '별빛밤'
  ],
  fr: [
    'Élodie', 'Antoine Laurent', 'Camille', 'Juliette', 'Maxime', 'Chloé',
    'Lucas', 'Manon', 'Théo', 'Léa', 'Hugo', 'Clément', 'CaféNoir', 'PetitNuage',
    'LoupGris', 'PapillonBleu', 'BaguetteHero'
  ],
  de: [
    'Maximilian', 'Hannah Weber', 'Lukas Becker', 'Sophie Müller', 'Felix',
    'Emma', 'Leon', 'Mia', 'Paul', 'Marie', 'Jonas', 'Nachteule', 'KaffeePause',
    'SternenWanderer', 'Zimtschnecke'
  ],
  es: [
    'Mateo', 'Valentina', 'Alejandro Cruz', 'Sofía Navarro', 'Santiago',
    'Isabella', 'Matías', 'Camila', 'Sebastián', 'Lucía', 'Diego', 'SolYMar', 'Gatito',
    'CaféConLeche', 'ViajeroNocturno'
  ],
  it: [
    'Lorenzo', 'Giulia Conti', 'Leonardo', 'Sofia', 'Alessandro', 'Aurora', 'Francesco', 'Espresso', 'NotteMagica'
  ],
  pt: [
    'Beatriz', 'Tiago Silva', 'Rodrigo', 'Carolina', 'Gabriel', 'Mariana', 'Pipoca', 'Cafezinho', 'EstrelaGuia'
  ],
  ru: [
    'Дмитрий (Dmitry)', 'Анастасия (Nastya)', 'Александр (Alex)', 'Елена (Elena)', 'Иван (Ivan)', 'ЛунныйКот', 'Соня'
  ]
};

export function getRandomName(lang = 'zh') {
  const pool = LANGUAGE_NAME_POOLS[lang] || LANGUAGE_NAME_POOLS.zh;
  return pool[Math.floor(Math.random() * pool.length)];
}
