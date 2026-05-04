/* ═══════════════════════════════════════════════════
   effects.js — Particles, glow, trail, screen shake
   ═══════════════════════════════════════════════════ */
const Effects = (() => {
  let particles = [];
  let trailPoints = [];
  const MAX_TRAIL = 18;
  let shakeAmt = 0, shakeX = 0, shakeY = 0;

  /* ── Particles ──────────────────────────────────── */
  function spawnParticles(x, y, color, count) {
    count = count || 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.025 + Math.random() * 0.03,
        size: 2 + Math.random() * 3,
        color: color,
      });
    }
  }

  function spawnScoreParticles(x, y, color) {
    spawnParticles(x, y, color, 22);
  }

  function updateParticles(dt) {
    particles = particles.filter(function(p) { return p.life > 0; });
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= p.decay;
    }
  }

  function drawParticles(ctx) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── Ball trail ─────────────────────────────────── */
  function addTrailPoint(x, y) {
    trailPoints.push({ x: x, y: y });
    if (trailPoints.length > MAX_TRAIL) trailPoints.shift();
  }

  function clearTrail() { trailPoints = []; }

  /* drawTrail(ctx, color) — uses stored trail points */
  function drawTrail(ctx, color) {
    if (trailPoints.length < 2) return;
    for (let i = 1; i < trailPoints.length; i++) {
      const alpha = i / trailPoints.length;
      const prev = trailPoints[i - 1];
      const curr = trailPoints[i];
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.lineWidth = (i / trailPoints.length) * 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── Screen shake ───────────────────────────────── */
  function shake(amount) {
    shakeAmt = amount || 6;
  }

  function updateShake() {
    if (shakeAmt > 0.5) {
      shakeX = (Math.random() - 0.5) * shakeAmt * 2;
      shakeY = (Math.random() - 0.5) * shakeAmt * 2;
      shakeAmt *= 0.75;
    } else {
      shakeAmt = 0; shakeX = 0; shakeY = 0;
    }
  }

  function applyShake(ctx) {
    if (shakeAmt > 0) ctx.translate(shakeX, shakeY);
  }

  /* ── Background grid ────────────────────────────── */
  function drawGrid(ctx, w, h, gridColor) {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    const step = 50;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Center dashed line ─────────────────────────── */
  function drawCenterLine(ctx, w, h, color, t) {
    const pulse = 0.4 + 0.3 * Math.sin(t * 0.003);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ── Glow rect (paddles) ────────────────────────── */
  function drawGlowRect(ctx, x, y, w, h, color, glowIntensity) {
    glowIntensity = glowIntensity || 1;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.18 * glowIntensity;
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.globalAlpha = 1;
    ctx.fillRect(x, y, w, h);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(255,255,255,0.04)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  /* ── Glow circle (ball) ─────────────────────────── */
  function drawGlowBall(ctx, x, y, r, color, glowIntensity) {
    glowIntensity = glowIntensity || 1;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 25 * glowIntensity;
    ctx.globalAlpha = 0.15 * glowIntensity;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ── Score flash ────────────────────────────────── */
  function drawFlash(ctx, w, h, color, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.28;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  return {
    spawnParticles, spawnScoreParticles,
    updateParticles, drawParticles,
    addTrailPoint, clearTrail, drawTrail,
    shake, updateShake, applyShake,
    drawGrid, drawCenterLine,
    drawGlowRect, drawGlowBall, drawFlash,
  };
})();
