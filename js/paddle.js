/* ═══════════════════════════════════════════════════
   paddle.js — Paddle logic + controls
   ═══════════════════════════════════════════════════ */
const Paddle = (() => {
  const W        = 12;
  const MARGIN   = 16;
  const BASE_H   = 90;
  const SPEED    = 420;

  function create(side, color) {
    return { side: side, w: W, h: BASE_H, x: 0, y: 0,
             color: color, glowIntensity: 1, hitPulse: 0, vy: 0 };
  }

  function reset(paddle, cw, ch) {
    paddle.h = BASE_H;
    paddle.x = paddle.side === 'left' ? MARGIN : cw - MARGIN - W;
    paddle.y = ch / 2 - paddle.h / 2;
    paddle.glowIntensity = 1;
    paddle.hitPulse = 0;
  }

  function shrink(paddle) {
    paddle.h = Math.max(30, paddle.h - 10);
  }

  /* ── Input state ──────────────────────────────── */
  const keys = {};
  let touchStartY = null, touchCurrentY = null, touchIsLeft = false;

  function initInput(canvas) {
    // Clear old listeners by replacing with new ones via flags
    window._pongKeysInit = true;
    if (!window._pongKeyListeners) {
      window._pongKeyListeners = true;
      document.addEventListener('keydown', function(e) { keys[e.code] = true; });
      document.addEventListener('keyup',   function(e) { keys[e.code] = false; });
    }

    // Touch — re-attach each game to ensure correct canvas ref
    canvas.ontouchstart = function(e) {
      e.preventDefault();
      const t = e.touches[0];
      touchStartY   = t.clientY;
      touchCurrentY = t.clientY;
      touchIsLeft   = t.clientX < canvas.clientWidth / 2;
    };
    canvas.ontouchmove = function(e) {
      e.preventDefault();
      if (e.touches.length > 0) touchCurrentY = e.touches[0].clientY;
    };
    canvas.ontouchend = function() { touchStartY = null; touchCurrentY = null; };
  }

  function update(paddle, dt, ch, canvas) {
    let dy = 0;
    const scaleY = canvas ? canvas.height / canvas.clientHeight : 1;

    if (paddle.side === 'left') {
      if (keys['ArrowUp']   || keys['KeyW'] || keys['KeyZ']) dy -= SPEED * dt;
      if (keys['ArrowDown'] || keys['KeyS'])                 dy += SPEED * dt;
      if (touchIsLeft && touchStartY !== null && touchCurrentY !== null) {
        dy = (touchCurrentY - touchStartY) * scaleY;
        touchStartY = touchCurrentY;
      }
    } else {
      // Right paddle (2P local only — AI handles its own movement)
      if (keys['ArrowUp'])   dy -= SPEED * dt;
      if (keys['ArrowDown']) dy += SPEED * dt;
      if (!touchIsLeft && touchStartY !== null && touchCurrentY !== null) {
        dy = (touchCurrentY - touchStartY) * scaleY;
        touchStartY = touchCurrentY;
      }
    }

    paddle.y += dy;
    paddle.y  = Math.max(0, Math.min(ch - paddle.h, paddle.y));
    paddle.vy = dt > 0 ? dy / dt : 0;

    if (paddle.hitPulse > 0) paddle.hitPulse = Math.max(0, paddle.hitPulse - dt * 3);
    paddle.glowIntensity = 1 + paddle.hitPulse;
  }

  function onHit(paddle) { paddle.hitPulse = 1.5; }

  function checkBallCollision(paddle, bx, by, br) {
    return bx - br <= paddle.x + paddle.w &&
           bx + br >= paddle.x &&
           by        >= paddle.y &&
           by        <= paddle.y + paddle.h;
  }

  function draw(paddle, ctx) {
    Effects.drawGlowRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h,
                         paddle.color, paddle.glowIntensity);
  }

  return { create, reset, shrink, initInput, update, onHit, checkBallCollision, draw };
})();
