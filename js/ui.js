/* ═══════════════════════════════════════════════════
   ui.js — Menu, HUD, overlays, localStorage
   ═══════════════════════════════════════════════════ */
const UI = (() => {
  /* ── Storage ─────────────────────────────────────── */
  const STORAGE_KEY = 'neon_pong_v1';

  function loadSave() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }
  function writeSave(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  function getBestScore() {
    return loadSave().bestScore || null;
  }
  function saveBestScore(left, right) {
    const saved = loadSave();
    const prev = saved.bestScore;
    const newScore = { left, right };
    // Best = player's max winning score
    if (!prev || left > (prev.left || 0)) {
      saved.bestScore = newScore;
      writeSave(saved);
    }
  }
  function getStats() { return loadSave().stats || { wins: 0, losses: 0, played: 0 }; }
  function saveStats(won) {
    const saved = loadSave();
    const s = saved.stats || { wins: 0, losses: 0, played: 0 };
    s.played++;
    if (won) s.wins++; else s.losses++;
    saved.stats = s;
    writeSave(saved);
  }

  /* ── Theme ───────────────────────────────────────── */
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }
  function getSavedTheme() { return loadSave().theme || 'cyan-magenta'; }
  function saveTheme(theme) {
    const saved = loadSave(); saved.theme = theme; writeSave(saved);
  }

  /* ── Screen transitions ─────────────────────────── */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  /* ── Score display ─────────────────────────────── */
  function updateScore(left, right) {
    const el = document.getElementById('score-left');
    const er = document.getElementById('score-right');
    el.textContent = left;
    er.textContent = right;
  }

  function bumpScore(side) {
    const el = document.getElementById(side === 'left' ? 'score-left' : 'score-right');
    el.classList.remove('bump');
    void el.offsetWidth; // reflow
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 300);
  }

  /* ── Timer ─────────────────────────────────────── */
  function updateTimer(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${m}:${s}`;
  }

  /* ── Mode / diff tags ─────────────────────────── */
  function updateHudTags(mode, diff, is2p) {
    const modeNames = {
      classic: 'CLASSIC', quick: 'QUICK',
      survival: 'SURVIVAL', local2p: '2 JOUEURS', practice: 'PRACTICE',
    };
    document.getElementById('hud-mode').textContent = modeNames[mode] || mode.toUpperCase();
    if (is2p) {
      document.getElementById('hud-diff').textContent = 'P1 vs P2';
    } else if (mode === 'practice') {
      document.getElementById('hud-diff').textContent = 'ENTRAÎNEMENT';
    } else {
      document.getElementById('hud-diff').textContent = `vs IA • ${diff.toUpperCase()}`;
    }
  }

  /* ── Combo ─────────────────────────────────────── */
  function showCombo(count) {
    const el = document.getElementById('combo-display');
    if (count >= 4) {
      el.textContent = `COMBO ×${count}!`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }
  function hideCombo() {
    document.getElementById('combo-display').classList.add('hidden');
  }

  /* ── Status info ─────────────────────────────── */
  function setStatusInfo(text) {
    document.getElementById('status-info').textContent = text;
  }

  /* ── Pause overlay ──────────────────────────── */
  function showPause(show) {
    document.getElementById('pause-overlay').classList.toggle('hidden', !show);
  }

  /* ── End overlay ────────────────────────────── */
  function showEnd(winnerSide, scoreLeft, scoreRight, mode, duration, maxRally) {
    const overlay = document.getElementById('end-overlay');
    const title = document.getElementById('end-title');
    const scoreDisplay = document.getElementById('end-score-display');
    const stats = document.getElementById('end-stats');

    if (mode === 'survival') {
      title.textContent = 'GAME OVER';
      scoreDisplay.textContent = `${Math.floor(duration)}s`;
    } else if (mode === 'practice') {
      title.textContent = 'PAUSE';
      scoreDisplay.textContent = `↺`;
    } else {
      if (winnerSide === 'left') {
        title.textContent = 'VICTOIRE!';
        title.style.color = 'var(--p1)';
        title.style.textShadow = 'var(--glow1)';
      } else {
        title.textContent = 'DÉFAITE';
        title.style.color = 'var(--p2)';
        title.style.textShadow = 'var(--glow2)';
      }
      scoreDisplay.textContent = `${scoreLeft} — ${scoreRight}`;
    }

    const m = Math.floor(duration / 60), s = Math.floor(duration % 60);
    stats.innerHTML = `
      Durée : ${m}:${s.toString().padStart(2,'0')}<br>
      Plus long rally : ${maxRally} rebonds
    `;

    overlay.classList.remove('hidden');
  }

  function hideEnd() {
    document.getElementById('end-overlay').classList.add('hidden');
  }

  /* ── Menu best score ────────────────────────── */
  function refreshMenuBestScore() {
    const bs = getBestScore();
    const el = document.getElementById('menu-best-score');
    el.textContent = bs ? `${bs.left} — ${bs.right}` : '—';
  }

  /* ── Sound button ───────────────────────────── */
  function updateSoundBtn(muted) {
    document.getElementById('btn-sound').textContent = muted ? '🔇' : '🔊';
  }

  /* ── Difficulty section visibility ─────────── */
  function toggleDiffSection(show) {
    document.getElementById('difficulty-section').style.display = show ? '' : 'none';
  }

  return {
    loadSave, getBestScore, saveBestScore, saveStats, getStats,
    applyTheme, getSavedTheme, saveTheme,
    showScreen,
    updateScore, bumpScore,
    updateTimer,
    updateHudTags,
    showCombo, hideCombo,
    setStatusInfo,
    showPause, showEnd, hideEnd,
    refreshMenuBestScore,
    updateSoundBtn,
    toggleDiffSection,
  };
})();
