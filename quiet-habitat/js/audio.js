/* Microphone metering, calibration, and demo-mode volume. Nothing is recorded. */
(function (global) {
  const QH = (global.QH = global.QH || {});

  const audio = {
    mode: "idle", // idle | mic | demo
    ctx: null,
    source: null,
    analyser: null,
    stream: null,
    data: null,
    smooth: 0,
    fast: 0,
    rawDb: -80,
    demoLevel: 8,
    calibration: null,
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function rmsToDb(rms) {
    return 20 * Math.log10(Math.max(rms, 1e-7));
  }

  function dbToLevel(db) {
    const cal = audio.calibration;
    if (cal && Number.isFinite(cal.silenceDb) && Number.isFinite(cal.talkDb)) {
      const span = Math.max(cal.talkDb - cal.silenceDb, 4);
      return clamp(((db - cal.silenceDb) / span) * 38 + 12, 0, 100);
    }
    // Typical classroom laptop mic: silence around -55 to -45 dB, talk around -30 to -20.
    return clamp(((db + 55) / 40) * 100, 0, 100);
  }

  function readRms() {
    const analyser = audio.analyser;
    if (!analyser || !audio.data) return 0;
    analyser.getByteTimeDomainData(audio.data);
    let sum = 0;
    for (let i = 0; i < audio.data.length; i++) {
      const v = (audio.data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / audio.data.length);
  }

  function tickAudio() {
    if (audio.mode === "demo") {
      audio.smooth += (audio.demoLevel - audio.smooth) * 0.2;
      audio.fast += (audio.demoLevel - audio.fast) * 0.45;
      audio.rawDb = audio.demoLevel;
      return;
    }
    if (audio.mode !== "mic") {
      audio.smooth += (0 - audio.smooth) * 0.1;
      audio.fast += (0 - audio.fast) * 0.1;
      return;
    }
    const rms = readRms();
    const db = rmsToDb(rms);
    audio.rawDb = db;
    const level = dbToLevel(db);
    audio.smooth += (level - audio.smooth) * 0.22;
    audio.fast += (level - audio.fast) * 0.55;
  }

  async function startMic() {
    if (audio.mode === "mic" && audio.stream) return true;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    audio.ctx = ctx;
    audio.source = source;
    audio.analyser = analyser;
    audio.stream = stream;
    audio.data = new Uint8Array(analyser.fftSize);
    audio.mode = "mic";
    audio.smooth = 0;
    audio.fast = 0;
    return true;
  }

  function stopMic() {
    if (audio.stream) {
      audio.stream.getTracks().forEach((t) => t.stop());
    }
    if (audio.source) {
      try { audio.source.disconnect(); } catch (e) { /* ignore */ }
    }
    if (audio.ctx && audio.ctx.state !== "closed") {
      audio.ctx.close().catch(() => {});
    }
    audio.stream = null;
    audio.source = null;
    audio.analyser = null;
    audio.ctx = null;
    audio.data = null;
    if (audio.mode === "mic") audio.mode = "idle";
  }

  function startDemo(level) {
    stopMic();
    audio.mode = "demo";
    audio.demoLevel = level == null ? 8 : level;
  }

  function setDemoLevel(level) {
    audio.demoLevel = level;
  }

  function getLevels() {
    return {
      smooth: audio.smooth,
      fast: audio.fast,
      db: audio.rawDb,
      mode: audio.mode,
    };
  }

  function setCalibration(cal) {
    audio.calibration = cal;
  }

  function collectDbSample() {
    if (audio.mode !== "mic") return audio.rawDb;
    return rmsToDb(readRms());
  }

  QH.audio = {
    startMic,
    stopMic,
    startDemo,
    setDemoLevel,
    getLevels,
    tick: tickAudio,
    setCalibration,
    collectDbSample,
    get mode() { return audio.mode; },
    get raw() { return audio; },
  };
})(window);
