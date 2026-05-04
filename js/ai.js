/* ═══════════════════════════════════════════════════
   ai.js — AI opponent
   ═══════════════════════════════════════════════════ */
const AI = (() => {
  const CFG = {
    easy:   { missChance: 0.40, delay: 120, maxSpeed: 170 },
    medium: { missChance: 0.10, delay:  55, maxSpeed: 310 },
    hard:   { missChance: 0.00, delay:   8, maxSpeed: 480 },
  };

  let diff = 'medium';
  let targetY = 0, lastUpdate = 0, isMissing = false, missY = 0;

  function setDifficulty(d) { diff = d; }

  function predictY(bx, by, bvx, bvy, px, ch) {
    if (bvx <= 0) return by;
    let cx = bx, cy = by, cvy = bvy;
    const step = 1 / 120;
    for (let i = 0; i < 3000; i++) {
      cx += bvx * step;
      cy += cvy * step;
      if (cy <= 0)   { cy = 0;       cvy = Math.abs(cvy); }
      if (cy >= ch)  { cy = ch;      cvy = -Math.abs(cvy); }
      if (cx >= px)  return cy;
    }
    return cy;
  }

  function update(paddle, ball, dt, ch, now) {
    const cfg = CFG[diff] || CFG.medium;

    if (now - lastUpdate > cfg.delay) {
      lastUpdate = now;
      if (Math.random() < cfg.missChance) {
        isMissing = true;
        missY = Math.random() * ch;
      } else {
        isMissing = false;
        const { x: bx, y: by } = ball.getPos();
        const { vx: bvx, vy: bvy } = ball.getVel();
        const py = predictY(bx, by, bvx, bvy, paddle.x, ch);
        targetY = py - paddle.h / 2;
      }
    }

    const goal   = isMissing ? missY : targetY + paddle.h / 2;
    const center = paddle.y + paddle.h / 2;
    const dist   = goal - center;
    const move   = Math.sign(dist) * Math.min(Math.abs(dist), cfg.maxSpeed * dt);

    paddle.y += move;
    paddle.y  = Math.max(0, Math.min(ch - paddle.h, paddle.y));
    if (paddle.hitPulse > 0) paddle.hitPulse = Math.max(0, paddle.hitPulse - dt * 3);
    paddle.glowIntensity = 1 + paddle.hitPulse;
  }

  return { setDifficulty, update };
})();
