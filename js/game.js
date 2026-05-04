/* ═══════════════════════════════════════════════════
   game.js — Main loop + event wiring
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {

  /* ── Canvas ──────────────────────────────────────── */
  var canvas = document.getElementById('game-canvas');
  var ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    var hud = document.querySelector('.hud');
    var sb  = document.querySelector('.status-bar');
    canvas.width  = window.innerWidth;
    canvas.height = Math.max(200, window.innerHeight
                    - (hud ? hud.offsetHeight : 48)
                    - (sb  ? sb.offsetHeight  : 30));
  }
  resizeCanvas();
  window.addEventListener('resize', function() {
    resizeCanvas();
    if (paddleLeft && paddleRight) {
      Paddle.reset(paddleLeft,  canvas.width, canvas.height);
      Paddle.reset(paddleRight, canvas.width, canvas.height);
    }
  });

  /* ── Themes ──────────────────────────────────────── */
  var THEMES = {
    'cyan-magenta': { p1:'#00ffff', p2:'#ff006e', ball:'#ffffff', grid:'#1a2a3a', mid:'#00d4ff', bg:'#0a0e27' },
    'purple-green': { p1:'#9d4edd', p2:'#00ff88', ball:'#ffffff', grid:'#1a1a2a', mid:'#9d4edd', bg:'#0a0e27' },
    'blue-orange':  { p1:'#00aaff', p2:'#ff6600', ball:'#ffffff', grid:'#1a1f2a', mid:'#00aaff', bg:'#0a0e27' },
    'retro':        { p1:'#00ff00', p2:'#ffffff', ball:'#00ff00', grid:'#001400', mid:'#00ff00', bg:'#0a0e27' },
    'blanc':        { p1:'#1a1a2e', p2:'#e63946', ball:'#1a1a2e', grid:'#cccccc', mid:'#1a1a2e', bg:'#f0f0f0' },
  };
  var currentTheme = THEMES['cyan-magenta'];

  /* ── State ───────────────────────────────────────── */
  var MODES = { classic:11, quick:5, survival:999, local2p:11, practice:999 };
  var mode = 'classic', difficulty = 'medium';
  var gameRunning = false, paused = false;
  var scoreLeft = 0, scoreRight = 0;
  var elapsed = 0, lastTime = null;
  var flashAlpha = 0, flashColor = '#ffffff';
  var comboCount = 0, maxRally = 0, currentRally = 0;
  var survivalRound = 0, lastScorer = 1;
  var animId = null;
  var paddleLeft = null, paddleRight = null;

  /* ── Paddle helpers ──────────────────────────────── */
  function createPaddles() {
    paddleLeft  = Paddle.create('left',  currentTheme.p1);
    paddleRight = Paddle.create('right', currentTheme.p2);
    Paddle.reset(paddleLeft,  canvas.width, canvas.height);
    Paddle.reset(paddleRight, canvas.width, canvas.height);
  }

  function resetRound() {
    Ball.reset(canvas.width, canvas.height, lastScorer);
    currentRally = 0;
    if (gameRunning) {
      Ball.freeze();
      setTimeout(function() { if (gameRunning && !paused) Ball.unfreeze(); }, 800);
    }
  }

  /* ── Scoring ─────────────────────────────────────── */
  function addPoint(scorer) {
    if (scorer === 'left') {
      scoreLeft++;
      UI.bumpScore('left');
      flashColor = currentTheme.p1;
      Effects.spawnScoreParticles(60, canvas.height / 2, currentTheme.p1);
      Audio.pointScored('left');
    } else {
      scoreRight++;
      UI.bumpScore('right');
      flashColor = currentTheme.p2;
      Effects.spawnScoreParticles(canvas.width - 60, canvas.height / 2, currentTheme.p2);
      Audio.pointScored('right');
    }
    flashAlpha = 0.5;
    Effects.shake(8);
    UI.updateScore(scoreLeft, scoreRight);
    comboCount = 0;
    UI.hideCombo();
    maxRally = Math.max(maxRally, currentRally);
    lastScorer = scorer === 'left' ? 1 : -1;

    if (mode !== 'practice' && mode !== 'survival') UI.saveBestScore(scoreLeft, scoreRight);
    if (mode === 'survival' && scorer === 'right') {
      survivalRound++;
      if (survivalRound % 2 === 0) Paddle.shrink(paddleLeft);
    }

    var limit = MODES[mode];
    if (scoreLeft >= limit || scoreRight >= limit) { endGame(); return; }
    resetRound();
  }

  /* ── End game ────────────────────────────────────── */
  function endGame() {
    gameRunning = false;
    Audio.stopMusic();
    var winSide = scoreLeft >= MODES[mode] ? 'left' : 'right';
    if (winSide === 'left') Audio.victory(); else Audio.defeat();
    UI.saveStats(winSide === 'left');
    UI.showEnd(winSide, scoreLeft, scoreRight, mode, elapsed, maxRally);
  }

  /* ── Main loop ───────────────────────────────────── */
  function loop(ts) {
    if (!gameRunning) return;
    var dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (!paused) {
      elapsed += dt;
      UI.updateTimer(elapsed);

      // Ball
      var result = Ball.update(dt, canvas.width, canvas.height);
      if (result === 'right') { addPoint('right'); if (gameRunning) { animId = requestAnimationFrame(loop); } return; }
      if (result === 'left')  { addPoint('left');  if (gameRunning) { animId = requestAnimationFrame(loop); } return; }

      // Collisions
      var pos = Ball.getPos();
      var vel = Ball.getVel();
      var br  = Ball.getRadius();

      if (vel.vx < 0 && Paddle.checkBallCollision(paddleLeft, pos.x, pos.y, br)) {
        Ball.collidePaddle(paddleLeft, 'left');
        Paddle.onHit(paddleLeft);
        currentRally++; comboCount++;
        maxRally = Math.max(maxRally, currentRally);
        UI.showCombo(comboCount);
        if (comboCount >= 4) Audio.comboSound(comboCount);
      }
      if (vel.vx > 0 && Paddle.checkBallCollision(paddleRight, pos.x, pos.y, br)) {
        Ball.collidePaddle(paddleRight, 'right');
        Paddle.onHit(paddleRight);
        currentRally++; comboCount++;
        maxRally = Math.max(maxRally, currentRally);
        UI.showCombo(comboCount);
        if (comboCount >= 4) Audio.comboSound(comboCount);
      }

      // Paddles
      Paddle.update(paddleLeft, dt, canvas.height, canvas);
      if (mode === 'local2p') Paddle.update(paddleRight, dt, canvas.height, canvas);
      else if (mode !== 'practice') AI.update(paddleRight, Ball, dt, canvas.height, ts);

      // Effects
      Effects.updateParticles(dt);
      Effects.updateShake();
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 2.5);
      UI.setStatusInfo('🏓 ' + Math.round(Ball.getSpeed()) + ' px/s');
    }

    draw(ts);
    animId = requestAnimationFrame(loop);
  }

  /* ── Draw ────────────────────────────────────────── */
  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    Effects.applyShake(ctx);
    Effects.drawGrid(ctx, canvas.width, canvas.height, currentTheme.grid);
    Effects.drawCenterLine(ctx, canvas.width, canvas.height, currentTheme.mid, ts);
    Effects.drawParticles(ctx);
    Ball.draw(ctx, currentTheme.ball);
    Paddle.draw(paddleLeft, ctx);
    Paddle.draw(paddleRight, ctx);
    Effects.drawFlash(ctx, canvas.width, canvas.height, flashColor, flashAlpha);
    ctx.restore();
  }

  /* ── Start / Stop ────────────────────────────────── */
  function startGame(m, d) {
    if (animId) cancelAnimationFrame(animId);
    mode = m; difficulty = d;
    scoreLeft = 0; scoreRight = 0;
    elapsed = 0; lastTime = null;
    comboCount = 0; maxRally = 0; currentRally = 0;
    survivalRound = 0; flashAlpha = 0; lastScorer = 1;

    AI.setDifficulty(difficulty);
    resizeCanvas();
    createPaddles();
    Paddle.initInput(canvas);
    Ball.reset(canvas.width, canvas.height, 1);

    UI.updateScore(0, 0);
    UI.updateHudTags(mode, difficulty, mode === 'local2p');
    UI.hideEnd();
    UI.showPause(false);
    UI.showScreen('screen-game');

    Audio.init();
    Audio.resume();
    Audio.startMusic();

    gameRunning = true;
    paused = false;
    Ball.freeze();
    setTimeout(function() { if (gameRunning && !paused) Ball.unfreeze(); }, 1000);
    animId = requestAnimationFrame(loop);
  }

  function stopGame() {
    gameRunning = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    Audio.stopMusic();
  }

  /* ── Init ────────────────────────────────────────── */
  var savedTheme = UI.getSavedTheme();
  currentTheme = THEMES[savedTheme] || THEMES['cyan-magenta'];
  UI.applyTheme(savedTheme);
  document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.theme === savedTheme);
  });
  UI.refreshMenuBestScore();

  /* ── Menu wiring ─────────────────────────────────── */
  var selectedMode = 'classic', selectedDiff = 'medium';

  document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
      UI.toggleDiffSection(selectedMode !== 'local2p' && selectedMode !== 'practice');
    });
  });

  document.querySelectorAll('.diff-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.diff-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.theme-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var theme = btn.dataset.theme;
      currentTheme = THEMES[theme] || THEMES['cyan-magenta'];
      if (paddleLeft)  paddleLeft.color  = currentTheme.p1;
      if (paddleRight) paddleRight.color = currentTheme.p2;
      UI.applyTheme(theme);
      UI.saveTheme(theme);
    });
  });

  document.getElementById('btn-play').addEventListener('click', function() {
    Audio.init(); Audio.resume();
    startGame(selectedMode, selectedDiff);
  });

  document.getElementById('btn-sound').addEventListener('click', function() {
    var muted = Audio.toggleMute();
    UI.updateSoundBtn(muted);
    if (!muted && gameRunning) Audio.startMusic();
  });

  function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    UI.showPause(paused);
    if (!paused) { lastTime = null; animId = requestAnimationFrame(loop); }
  }

  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-resume').addEventListener('click', function() {
    paused = false; UI.showPause(false);
    lastTime = null; animId = requestAnimationFrame(loop);
  });
  document.getElementById('btn-restart').addEventListener('click', function() {
    stopGame(); startGame(mode, difficulty);
  });

  function goMenu() {
    stopGame(); UI.hideEnd(); UI.showPause(false);
    UI.showScreen('screen-menu'); UI.refreshMenuBestScore();
  }
  document.getElementById('btn-menu-from-pause').addEventListener('click', goMenu);
  document.getElementById('btn-menu-from-end').addEventListener('click', goMenu);
  document.getElementById('btn-play-again').addEventListener('click', function() {
    stopGame(); UI.hideEnd(); startGame(mode, difficulty);
  });

  document.addEventListener('keydown', function(e) {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (gameRunning) togglePause(); }
    if (e.code === 'KeyM') { var m = Audio.toggleMute(); UI.updateSoundBtn(m); }
    if (e.code === 'Enter' && document.getElementById('screen-menu').classList.contains('active')) {
      document.getElementById('btn-play').click();
    }
  });

}); // DOMContentLoaded
