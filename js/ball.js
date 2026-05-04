/* ═══════════════════════════════════════════════════
   ball.js — Ball physics
   ═══════════════════════════════════════════════════ */
const Ball = (() => {
  const RADIUS = 7;
  const BASE_SPEED = 280;
  const MAX_SPEED = 680;
  const ACCEL = 1.05;

  let x, y, vx, vy, speed;
  let glowPulse = 0;
  let isFrozen = false;

  function reset(cw, ch, direction) {
    direction = direction || 1;
    x = cw / 2;
    y = ch / 2;
    speed = BASE_SPEED;
    isFrozen = false;
    glowPulse = 0;
    const angle = (20 + Math.random() * 30) * (Math.PI / 180);
    const vert  = Math.random() < 0.5 ? 1 : -1;
    vx = direction * Math.cos(angle) * speed;
    vy = vert * Math.sin(angle) * speed;
    Effects.clearTrail();
  }

  function freeze()   { isFrozen = true;  }
  function unfreeze() { isFrozen = false; }

  function accelerate() {
    speed = Math.min(speed * ACCEL, MAX_SPEED);
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }
    glowPulse = 1;
    if (speed >= MAX_SPEED * 0.8) Audio.accelerate();
  }

  /* Returns 'right' if ball exits left wall (right scores),
             'left'  if ball exits right wall (left scores),
             null    otherwise */
  function update(dt, cw, ch) {
    if (isFrozen) return null;

    x += vx * dt;
    y += vy * dt;

    if (glowPulse > 0) glowPulse = Math.max(0, glowPulse - dt * 3);

    // Top / bottom walls
    if (y - RADIUS <= 0)  { y = RADIUS;       vy =  Math.abs(vy); Audio.wallHit(); Effects.spawnParticles(x, RADIUS,      '#ffffff', 4); }
    if (y + RADIUS >= ch) { y = ch - RADIUS;  vy = -Math.abs(vy); Audio.wallHit(); Effects.spawnParticles(x, ch - RADIUS, '#ffffff', 4); }

    Effects.addTrailPoint(x, y);

    if (x - RADIUS < 0)  return 'right'; // left wall  → right player scores
    if (x + RADIUS > cw) return 'left';  // right wall → left  player scores
    return null;
  }

  function collidePaddle(paddle, side) {
    const relative  = ((y - paddle.y) / paddle.h) * 2 - 1; // -1 to 1
    const maxAngle  = 65 * (Math.PI / 180);
    const angle     = relative * maxAngle;
    const dir       = side === 'left' ? 1 : -1;

    vx = dir * Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;

    // Push ball clear of paddle
    if (side === 'left') x = paddle.x + paddle.w + RADIUS + 1;
    else                 x = paddle.x - RADIUS - 1;

    accelerate();
    Effects.shake(4);
    Effects.spawnParticles(x, y, paddle.color, 8);
    glowPulse = 1.5;
    if (side === 'left') Audio.paddleHitLeft();
    else                 Audio.paddleHitRight();
  }

  function draw(ctx, color) {
    Effects.drawTrail(ctx, color);   // uses stored trail points
    Effects.drawGlowBall(ctx, x, y, RADIUS, color, 1 + glowPulse * 0.8);
  }

  function getRadius()    { return RADIUS; }
  function getPos()       { return { x: x, y: y }; }
  function getVel()       { return { vx: vx, vy: vy }; }
  function getSpeed()     { return speed; }
  function getGlowPulse() { return glowPulse; }

  return {
    reset, freeze, unfreeze, update, collidePaddle, draw,
    getRadius, getPos, getVel, getSpeed, getGlowPulse,
  };
})();
