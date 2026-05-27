/* 오디오 시스템 — Web Audio API 기반 칩튠 BGM + SFX
   배틀: 빠르고 긴박한 로우비트 음악
   필드: 평화롭고 여유로운 로우비트 음악
   SFX: 공격, 승리, 수집, 조우
*/
window.AUDIO = (() => {
  let actx = null;
  let muted = false;
  let currentBGM = null;
  let lastBGMType = null;  // 음소거 전 재생 중이던 BGM 타입 기억
  let schedulerTimer = null;
  const SCHEDULE_AHEAD = 0.18;
  const LOOKAHEAD_MS = 30;

  // 음계 주파수 (Hz)
  const N = {
    C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00, B5:987.77,
    C6:1046.5, D6:1174.66, E6:1318.51,
    R:0
  };

  // ===== 배틀 BGM — 긴박하고 빠른 칩튠 (BPM 168, 8분음표) =====
  // 멜로디: Square wave / 베이스: Triangle wave
  const BATTLE_MEL = [
    N.E5, N.E5, N.R,  N.G5, N.E5, N.D5, N.C5, N.R,
    N.D5, N.D5, N.R,  N.F5, N.D5, N.C5, N.B4, N.R,
    N.C5, N.E5, N.G5, N.E5, N.C5, N.E5, N.G5, N.C6,
    N.B4, N.A4, N.G4, N.R,  N.G4, N.A4, N.B4, N.C5,
    N.E5, N.R,  N.E5, N.F5, N.G5, N.R,  N.G5, N.A5,
    N.G5, N.F5, N.E5, N.R,  N.D5, N.E5, N.F5, N.R,
    N.E5, N.D5, N.C5, N.D5, N.E5, N.R,  N.C5, N.R,
    N.G4, N.R,  N.A4, N.R,  N.B4, N.C5, N.D5, N.R,
  ];
  const BATTLE_BASS = [
    N.C3, N.R,  N.G3, N.R,  N.C3, N.R,  N.G3, N.R,
    N.G3, N.R,  N.D3, N.R,  N.G3, N.R,  N.D3, N.R,
    N.A3, N.R,  N.E3, N.R,  N.A3, N.R,  N.E3, N.R,
    N.F3, N.R,  N.C3, N.R,  N.G3, N.R,  N.G3, N.R,
    N.A3, N.R,  N.E3, N.R,  N.A3, N.R,  N.E3, N.R,
    N.F3, N.R,  N.C3, N.R,  N.G3, N.R,  N.D3, N.R,
    N.C3, N.R,  N.G3, N.R,  N.C3, N.R,  N.E3, N.R,
    N.F3, N.R,  N.G3, N.R,  N.C3, N.R,  N.G3, N.R,
  ];

  // 퍼커션 (하이햇 느낌) — 배틀에서
  const BATTLE_PERC = [
    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
    1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
  ];

  // ===== 필드 BGM — 평화롭고 느긋한 칩튠 (BPM 96, 4분음표) =====
  // 멜로디: Triangle wave / 베이스: Sine wave
  const FIELD_MEL = [
    N.G4, N.R,  N.A4, N.B4, N.C5, N.R,  N.B4, N.R,
    N.A4, N.G4, N.E4, N.R,  N.G4, N.R,  N.A4, N.R,
    N.D5, N.R,  N.C5, N.B4, N.C5, N.R,  N.A4, N.R,
    N.G4, N.E4, N.C4, N.R,  N.G4, N.R,  N.R,  N.R,
    N.C5, N.R,  N.E5, N.R,  N.G5, N.R,  N.E5, N.R,
    N.D5, N.R,  N.B4, N.R,  N.C5, N.R,  N.R,  N.R,
    N.E5, N.D5, N.C5, N.R,  N.B4, N.C5, N.D5, N.R,
    N.C5, N.R,  N.G4, N.R,  N.C5, N.R,  N.R,  N.R,
  ];
  const FIELD_BASS = [
    N.C3, N.R,  N.R,  N.G3, N.R,  N.R,  N.C3, N.R,
    N.F3, N.R,  N.R,  N.C3, N.R,  N.R,  N.A3, N.R,
    N.G3, N.R,  N.R,  N.D3, N.R,  N.R,  N.G3, N.R,
    N.A3, N.R,  N.R,  N.E3, N.R,  N.R,  N.C3, N.R,
    N.A3, N.R,  N.R,  N.E3, N.R,  N.R,  N.A3, N.R,
    N.G3, N.R,  N.R,  N.D3, N.R,  N.R,  N.G3, N.R,
    N.C3, N.R,  N.R,  N.G3, N.R,  N.R,  N.C3, N.R,
    N.F3, N.R,  N.R,  N.C3, N.R,  N.R,  N.G3, N.R,
  ];

  function getCtx() {
    if (!actx) {
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { return null; }
    }
    try { if (actx.state === 'suspended') actx.resume(); } catch(e) {}
    return actx;
  }

  // 단일 음표 재생 (정밀 스케줄링)
  function playTone(freq, start, dur, vol, type) {
    if (!freq || muted) return;
    const ac = getCtx();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.008);
      g.gain.setValueAtTime(vol, start + dur * 0.72);
      g.gain.linearRampToValueAtTime(0.001, start + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    } catch(e) {}
  }

  // 노이즈 버스트 (퍼커션)
  function playNoise(start, dur, vol) {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    try {
      const bufLen = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      g.gain.setValueAtTime(vol, start);
      g.gain.linearRampToValueAtTime(0.001, start + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(ac.destination);
      src.start(start);
      src.stop(start + dur + 0.01);
    } catch(e) {}
  }

  // === BGM 스케줄러 ===
  let bgm = null;

  function startBGM(type) {
    if (currentBGM === type) return;
    stopBGM();
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    currentBGM = type;
    const isBattle = (type === 'battle');
    bgm = {
      type,
      noteIdx: 0,
      nextTime: ac.currentTime + 0.05,
      bpm: isBattle ? 168 : 96,
      melody: isBattle ? BATTLE_MEL : FIELD_MEL,
      bass:   isBattle ? BATTLE_BASS : FIELD_BASS,
      perc:   isBattle ? BATTLE_PERC : null,
      melVol:  isBattle ? 0.055 : 0.038,
      bassVol: isBattle ? 0.038 : 0.026,
      percVol: isBattle ? 0.022 : 0,
      melType:  isBattle ? 'square'   : 'triangle',
      bassType: isBattle ? 'triangle' : 'sine',
    };
    scheduleBGM();
  }

  function scheduleBGM() {
    if (!bgm || muted) return;
    const ac = getCtx();
    if (!ac) return;
    const beatLen = (60 / bgm.bpm) * 0.5; // 8분음표
    while (bgm.nextTime < ac.currentTime + SCHEDULE_AHEAD) {
      const i = bgm.noteIdx % bgm.melody.length;
      const m = bgm.melody[i];
      const b = bgm.bass[i];
      if (m) playTone(m, bgm.nextTime, beatLen * 0.82, bgm.melVol, bgm.melType);
      if (b) playTone(b, bgm.nextTime, beatLen * 1.6,  bgm.bassVol, bgm.bassType);
      if (bgm.perc && bgm.perc[i % bgm.perc.length]) {
        playNoise(bgm.nextTime, beatLen * 0.08, bgm.percVol);
      }
      bgm.nextTime += beatLen;
      bgm.noteIdx++;
    }
    schedulerTimer = setTimeout(scheduleBGM, LOOKAHEAD_MS);
  }

  function stopBGM() {
    if (schedulerTimer) { clearTimeout(schedulerTimer); schedulerTimer = null; }
    currentBGM = null;
    bgm = null;
  }

  function playBattleBGM() { startBGM('battle'); }
  function playFieldBGM()  { startBGM('field');  }

  // === SFX ===
  function playAttackSFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    // 상승하는 빠른 아르페지오
    [N.E5, N.G5, N.B5, N.E6].forEach((f, i) =>
      playTone(f, t + i * 0.055, 0.11, 0.13, 'square'));
  }

  function playVictorySFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    // 상승하는 승리 팡파레
    [N.C5, N.E5, N.G5, N.E5, N.C6, N.G5, N.C6].forEach((f, i) =>
      playTone(f, t + i * 0.11, 0.2, 0.1, 'square'));
  }

  function playCollectSFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [N.G4, N.C5, N.E5, N.G5].forEach((f, i) =>
      playTone(f, t + i * 0.065, 0.1, 0.09, 'triangle'));
  }

  function playEncounterSFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [N.A4, N.A4, N.A5].forEach((f, i) =>
      playTone(f, t + i * 0.09, 0.1, 0.11, 'square'));
  }

  function playGetPokemonSFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) =>
      playTone(f, t + i * 0.09, 0.18, 0.11, 'square'));
  }

  function playWrongSFX() {
    if (muted) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [N.A4, N.G4, N.E4].forEach((f, i) =>
      playTone(f, t + i * 0.08, 0.12, 0.09, 'square'));
  }

  // === 토글 ===
  function toggle() {
    muted = !muted;
    if (muted) {
      lastBGMType = currentBGM; // stopBGM() 이전에 저장 (stopBGM이 currentBGM을 null로 초기화함)
      stopBGM();
    } else {
      // 음소거 해제: 마지막으로 재생 중이던 BGM 재시작
      if (lastBGMType) startBGM(lastBGMType);
    }
    return muted;
  }

  function isMuted() { return muted; }
  function getCurrent() { return currentBGM; }

  // 첫 사용자 인터랙션 시 AudioContext 사전 unlock
  // (브라우저 Autoplay 정책: 클릭/터치/키 이전에는 AudioContext가 suspended)
  function unlockOnInteraction() {
    const ac = getCtx();
    if (ac && ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
  }
  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt =>
    document.addEventListener(evt, unlockOnInteraction, { once: true, capture: true })
  );

  // 페이지 포커스/블러 처리
  document.addEventListener('visibilitychange', () => {
    const ac = getCtx();
    if (!ac) return;
    if (document.hidden) {
      try { ac.suspend(); } catch(e) {}
    } else {
      try { ac.resume(); if (bgm) scheduleBGM(); } catch(e) {}
    }
  });

  return {
    playBattleBGM, playFieldBGM, stopBGM,
    playAttackSFX, playVictorySFX, playCollectSFX,
    playEncounterSFX, playGetPokemonSFX, playWrongSFX,
    toggle, isMuted, getCurrent
  };
})();
