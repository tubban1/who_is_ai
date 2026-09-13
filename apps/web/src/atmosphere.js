export function chooseTimeOfDay(random = Math.random) {
  return random() < .5 ? 'day' : 'night';
}

export function heartbeat(time) {
  const phase = time % 2.6;
  return Math.exp(-(((phase - .24) / .13) ** 2)) + .65 * Math.exp(-(((phase - .58) / .16) ** 2));
}

export const ATMOSPHERES = {
  day: { sky: '#9ecde5', fog: '#c1dbe3', fogNear: 170, fogFar: 650, exposure: 1.05, environment: .6 },
  night: { sky: '#07121f', fog: '#102536', fogNear: 160, fogFar: 650, exposure: .92, environment: .22 },
};

const labels = {
  zh: ['白天', '夜晚', '切换昼夜 · 每次进入随机'],
  en: ['Day', 'Night', 'Switch day/night · Random on entry'],
  ja: ['昼', '夜', '昼夜切替 · 入場時ランダム'],
  de: ['Tag', 'Nacht', 'Tag/Nacht wechseln · Zufällig beim Eintritt'],
  fr: ['Jour', 'Nuit', 'Changer jour/nuit · Aléatoire à l’entrée'],
  es: ['Día', 'Noche', 'Cambiar día/noche · Aleatorio al entrar'],
};
export function atmosphereLabels(language) { return labels[language] || labels.en; }
