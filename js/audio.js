/* ═══════════════════════════════════════════════════
   audio.js — Web Audio API synthetic sounds
   ═══════════════════════════════════════════════════ */
const Audio = (() => {
  let ctx = null, muted = false, musicGain = null, musicNodes = [];
  let musicPlaying = false;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* ── Generic synth hit ────────────────────────── */
  function hit(freq, type = 'square', duration = 0.08, vol = 0.18) {
    if (muted || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /* ── Public sounds ────────────────────────────── */
  function paddleHitLeft()  { hit(440, 'square', 0.07, 0.15); }
  function paddleHitRight() { hit(220, 'sawtooth', 0.07, 0.15); }

  function wallHit() { hit(330, 'triangle', 0.05, 0.1); }

  function pointScored(winner) {
    if (muted || !ctx) return;
    const notes = winner === 'left' ? [523, 659, 784] : [392, 330, 262];
    notes.forEach((f, i) => {
      setTimeout(() => hit(f, 'sine', 0.15, 0.2), i * 80);
    });
  }

  function accelerate() {
    if (muted || !ctx) return;
    hit(800, 'sawtooth', 0.04, 0.1);
  }

  function victory() {
    if (muted || !ctx) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => hit(f, 'sine', 0.2, 0.25), i * 100);
    });
  }

  function defeat() {
    if (muted || !ctx) return;
    [262, 220, 196, 165].forEach((f, i) => {
      setTimeout(() => hit(f, 'sawtooth', 0.25, 0.2), i * 120);
    });
  }

  function comboSound(count) {
    if (muted || !ctx) return;
    const f = 300 + count * 30;
    hit(Math.min(f, 800), 'square', 0.1, 0.18);
  }

  /* ── Synthwave background music ───────────────── */
  function startMusic() {
    if (musicPlaying || muted || !ctx) return;
    musicPlaying = true;
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.06, ctx.currentTime);
    musicGain.connect(ctx.destination);

    const bpm = 120, beat = 60 / bpm;
    const sequence = [
      // bass line: note, octave, beats
      [0, 2, 1], [0, 2, 1], [7, 1, 1], [7, 1, 1],
      [5, 2, 1], [5, 2, 1], [3, 2, 1], [3, 2, 1],
    ];
    const notes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94];

    let t = ctx.currentTime + 0.1;
    const loop = () => {
      if (!musicPlaying) return;
      sequence.forEach(([n, oct, dur]) => {
        if (!musicPlaying) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(musicGain);
        osc.type = 'sawtooth';
        const freq = notes[n] * Math.pow(2, oct - 1);
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + beat * dur * 0.85);
        osc.start(t);
        osc.stop(t + beat * dur);
        t += beat * dur;
      });
      // schedule next loop
      const loopDuration = sequence.reduce((acc, [,, d]) => acc + d, 0) * beat * 1000;
      setTimeout(loop, Math.max(0, (t - ctx.currentTime) * 1000 - 200));
    };
    loop();

    // Add pad chord
    const padFreqs = [130.81, 164.81, 196.00, 261.63];
    padFreqs.forEach(f => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(musicGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start(ctx.currentTime);
      musicNodes.push(osc, g);
    });
  }

  function stopMusic() {
    musicPlaying = false;
    musicNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){} });
    musicNodes = [];
    if (musicGain) { try { musicGain.disconnect(); } catch(e){} musicGain = null; }
  }

  function intensifyMusic(intensity) {
    // 0..1
    if (!musicGain) return;
    const target = 0.06 + intensity * 0.08;
    musicGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1);
  }

  function toggleMute() {
    muted = !muted;
    if (muted) stopMusic();
    else if (musicPlaying === false) startMusic();
    return muted;
  }
  function isMuted() { return muted; }

  return {
    init, resume,
    paddleHitLeft, paddleHitRight, wallHit, pointScored,
    accelerate, victory, defeat, comboSound,
    startMusic, stopMusic, intensifyMusic,
    toggleMute, isMuted,
  };
})();
