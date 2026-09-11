/**
 * WHO IS AI? - Web Audio Chiptune MIDI Engine & Sound Effects
 * 100% Zero-dependency, pure Web Audio API synthesizer.
 * Provides catchy retro synthwave / MIDI background music and interactive SFX.
 */

let ctx = null;
let masterGain = null;
let bgmGain = null;
let sfxGain = null;

let bgmRunning = false;
let bgmTimer = null;
let currentStep = 0;

// Catchy 8-bar synthwave / chiptune theme in A Minor / C Major (124 BPM)
// Notes to frequencies (Hz)
const NOTE = {
  REST: 0,
  A1: 55.00, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
  A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00, B5: 987.77, C6: 1046.50, D6: 1174.66, E6: 1318.51
};

// 32 16th-notes per section (4 bars = 64 16th-notes for full loop)
const BPM = 124;
const STEP_SEC = 60 / BPM / 4; // ~0.121s per 16th-note

// Bass progression: Am -> F -> C -> G
const BASS_LINE = [
  // Am
  NOTE.A2, NOTE.REST, NOTE.A2, NOTE.A2,  NOTE.C3, NOTE.REST, NOTE.A2, NOTE.REST,
  NOTE.A2, NOTE.REST, NOTE.A2, NOTE.E2,  NOTE.G2, NOTE.REST, NOTE.A2, NOTE.REST,
  // F
  NOTE.F2, NOTE.REST, NOTE.F2, NOTE.F2,  NOTE.A2, NOTE.REST, NOTE.F2, NOTE.REST,
  NOTE.F2, NOTE.REST, NOTE.F2, NOTE.C3,  NOTE.F2, NOTE.REST, NOTE.F2, NOTE.REST,
  // C
  NOTE.C3, NOTE.REST, NOTE.C3, NOTE.C3,  NOTE.E3, NOTE.REST, NOTE.C3, NOTE.REST,
  NOTE.C3, NOTE.REST, NOTE.C3, NOTE.G2,  NOTE.C3, NOTE.REST, NOTE.C3, NOTE.REST,
  // G
  NOTE.G2, NOTE.REST, NOTE.G2, NOTE.G2,  NOTE.B2, NOTE.REST, NOTE.G2, NOTE.REST,
  NOTE.E2, NOTE.REST, NOTE.E2, NOTE.G2,  NOTE.B2, NOTE.REST, NOTE.D3, NOTE.REST,
];

// Catchy Lead Hook
const LEAD_LINE = [
  // Bar 1 - Am (Catchy motif)
  NOTE.E5, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.E5, NOTE.REST,
  NOTE.A4, NOTE.REST, NOTE.REST, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.D5, NOTE.C5,
  // Bar 2 - F (Syncopated bounce)
  NOTE.D5, NOTE.REST, NOTE.A4, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.D5, NOTE.REST,
  NOTE.F5, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.D5, NOTE.C5, NOTE.A4, NOTE.REST,
  // Bar 3 - C (Bright peak)
  NOTE.G5, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.C5, NOTE.REST, NOTE.D5, NOTE.REST,
  NOTE.E5, NOTE.G5, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.D5, NOTE.C5, NOTE.REST,
  // Bar 4 - G (Turnaround resolution)
  NOTE.D5, NOTE.REST, NOTE.REST, NOTE.B4, NOTE.C5, NOTE.REST, NOTE.D5, NOTE.REST,
  NOTE.E5, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.B4, NOTE.REST, NOTE.G4, NOTE.REST,
];

// Shimmering Arp layer
const ARP_CHORDS = [
  [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.A4], // Am
  [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4], // F
  [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5], // C
  [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4], // G
];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, ctx.currentTime);
    masterGain.connect(ctx.destination);

    bgmGain = ctx.createGain();
    bgmGain.gain.setValueAtTime(0.26, ctx.currentTime);
    bgmGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.setValueAtTime(0.42, ctx.currentTime);
    sfxGain.connect(masterGain);
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// Generate an FM/Synth tone
function playSynthNote(freq, dur, type = "square", gain = 0.15, dest = bgmGain) {
  if (!ctx || freq <= 0) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "sawtooth" ? 1800 : 2800, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + dur);

  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);

  osc.start(now);
  osc.stop(now + dur + 0.05);
}

// Snappy retro drum hit (noise snare or pulse kick)
function playPercussion(type = "hat") {
  if (!ctx || !bgmGain) return;
  const now = ctx.currentTime;

  if (type === "kick") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g);
    g.connect(bgmGain);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === "snare") {
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(filter);
    filter.connect(g);
    g.connect(bgmGain);
    noise.start(now);
  } else if (type === "hat") {
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6500, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    noise.connect(filter);
    filter.connect(g);
    g.connect(bgmGain);
    noise.start(now);
  }
}

// Background music tick step
function tickBgm() {
  if (!bgmRunning || !ctx) return;
  const step = currentStep % 64;
  const bar = Math.floor(step / 16);
  const beat = Math.floor((step % 16) / 4);
  const sub = step % 4;

  // 1. Kick on beat 0 and 2 (4 on the floor / backbeat)
  if (beat === 0 && sub === 0) playPercussion("kick");
  if (beat === 2 && sub === 0) playPercussion("kick");

  // 2. Snare on beat 1 and 3
  if (beat === 1 && sub === 0) playPercussion("snare");
  if (beat === 3 && sub === 0) playPercussion("snare");

  // 3. Hi-hat on every 8th note
  if (sub === 0 || sub === 2) playPercussion("hat");

  // 4. Bass note
  const bassNote = BASS_LINE[step];
  if (bassNote) {
    playSynthNote(bassNote, STEP_SEC * 1.8, "sawtooth", 0.22, bgmGain);
  }

  // 5. Arp note (16th notes dancing across chord)
  const chord = ARP_CHORDS[bar];
  const arpNote = chord[step % 4];
  if (arpNote) {
    playSynthNote(arpNote, STEP_SEC * 1.2, "triangle", 0.12, bgmGain);
  }

  // 6. Lead melody
  const leadNote = LEAD_LINE[step];
  if (leadNote) {
    playSynthNote(leadNote, STEP_SEC * 2.2, "square", 0.18, bgmGain);
  }

  currentStep++;
}

export function startBgm() {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  if (bgmRunning) return;
  bgmRunning = true;
  if (bgmGain) bgmGain.gain.setValueAtTime(0.26, audioCtx.currentTime);
  if (!bgmTimer) {
    bgmTimer = setInterval(tickBgm, STEP_SEC * 1000);
  }
}

export function stopBgm() {
  bgmRunning = false;
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

export function isBgmActive() {
  return bgmRunning;
}

export function toggleBgm() {
  getAudioContext();
  if (bgmRunning) {
    stopBgm();
    localStorage.setItem("who-is-ai.bgm_enabled", "0");
    return false;
  } else {
    startBgm();
    localStorage.setItem("who-is-ai.bgm_enabled", "1");
    return true;
  }
}

export function getStoredBgmPreference() {
  if (typeof localStorage === "undefined") return true;
  const pref = localStorage.getItem("who-is-ai.bgm_enabled");
  return pref !== "0";
}

let lastFootstepTime = 0;

export function playSfx(type) {
  const audioCtx = getAudioContext();
  if (!audioCtx || !sfxGain) return;
  const now = audioCtx.currentTime;

  if (type === "step") {
    if (Date.now() - lastFootstepTime < 240) return;
    lastFootstepTime = Date.now();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(110 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.04);
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "encounter") {
    [NOTE.A5, NOTE.E6].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t = now + i * 0.06;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } else if (type === "send") {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(NOTE.A5, now);
    osc.frequency.exponentialRampToValueAtTime(NOTE.D6, now + 0.08);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  } else if (type === "victory") {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t = now + i * 0.11;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (i === 3 ? 0.7 : 0.3));
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(t);
      osc.stop(t + (i === 3 ? 0.75 : 0.32));
    });
  } else if (type === "defeat") {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(NOTE.D4, now);
    osc.frequency.exponentialRampToValueAtTime(NOTE.A1, now + 0.45);
    g.gain.setValueAtTime(0.26, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.48);
  } else if (type === "draw") {
    [NOTE.E4, NOTE.B4].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.42);
    });
  } else if (type === "click") {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}
