let ctx: AudioContext | null = null

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return }
  ctx = new AudioContext()
}

function getCtx(): AudioContext | null {
  if (!ctx) return null
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function osc(type: OscillatorType, freq: number, dur: number, gain = 0.3, delay = 0) {
  const c = getCtx(); if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(gain, c.currentTime + delay)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur)
  o.connect(g); g.connect(c.destination)
  o.start(c.currentTime + delay)
  o.stop(c.currentTime + delay + dur)
}

export function playClick(combo: number) {
  const freq = 180 + Math.min(combo, 20) * 28
  osc('square', freq, 0.07, 0.25)
}

export function playCapture() {
  const notes = [261, 329, 392, 523, 659, 784]
  notes.forEach((f, i) => osc('sine', f, 0.12, 0.4, i * 0.07))
}

export function playCityLost() {
  const notes = [784, 659, 523, 392]
  notes.forEach((f, i) => osc('sawtooth', f, 0.12, 0.3, i * 0.08))
}

export function playLevelUp() {
  const notes = [261,294,329,349,392,440,494,523,587,659]
  notes.forEach((f, i) => osc('sine', f, 0.1, 0.35, i * 0.06))
}

export function playAbility() {
  const c = getCtx(); if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(80, c.currentTime)
  o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.25)
  g.gain.setValueAtTime(0.3, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35)
  o.connect(g); g.connect(c.destination)
  o.start(); o.stop(c.currentTime + 0.35)
}

export function playComboBreak() {
  const notes = [392, 349, 311, 277]
  notes.forEach((f, i) => osc('sawtooth', f, 0.1, 0.2, i * 0.06))
}

export function playComboMilestone(tier: number) {
  const freqs = [440, 523, 659, 784]
  const f = freqs[Math.min(tier - 1, 3)]
  osc('square', f, 0.15, 0.4)
  osc('sine',   f * 2, 0.08, 0.2, 0.05)
}
