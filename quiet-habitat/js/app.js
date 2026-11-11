/* 害羞動物園 — UI, persistence, and classroom flow. */
(function (global) {
  const QH = (global.QH = global.QH || {});
  const STORE = "quiet-habitat-v1";
  const GOAL = { silent: 18, independent: 38, partner: 62 };

  const defaultCollection = () => {
    const c = {};
    QH.THEME_ORDER.forEach((id) => { c[id] = []; });
    return c;
  };

  function loadState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { saved = null; }
    const base = {
      lang: "zh-HK",
      theme: "savanna",
      volumeGoal: GOAL.independent,
      goalPreset: "independent",
      pace: "normal",
      customMinutes: 4,
      loudBehavior: "flee",
      calibration: null,
      collection: defaultCollection(),
    };
    if (!saved || typeof saved !== "object") return base;
    const next = Object.assign(base, saved);
    next.collection = Object.assign(defaultCollection(), saved.collection || {});
    if (!QH.THEMES[next.theme]) next.theme = "savanna";
    if (!["zh-HK", "en"].includes(next.lang)) next.lang = "zh-HK";
    return next;
  }

  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(QH.state)); } catch (e) { /* ignore quota */ }
  }

  QH.state = loadState();
  QH.audio.setCalibration(QH.state.calibration);

  QH.markSpotted = function (themeId, animalId) {
    const list = QH.state.collection[themeId] || (QH.state.collection[themeId] = []);
    if (!list.includes(animalId)) {
      list.push(animalId);
      saveState();
      if (document.getElementById("collection-backdrop").classList.contains("is-open")) {
        renderCollection();
      }
    }
  };

  /* ---------- i18n ---------- */
  function applyI18n() {
    const lang = QH.state.lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-HK";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = QH.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", QH.t(el.getAttribute("data-i18n-aria")));
    });
    document.getElementById("lang-zh").setAttribute("aria-pressed", String(lang !== "en"));
    document.getElementById("lang-en").setAttribute("aria-pressed", String(lang === "en"));
    document.querySelectorAll("#settings-lang .chip").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
    document.getElementById("meter").title = QH.t("goalTick");
    document.getElementById("meter-tick").setAttribute("aria-label", QH.t("goalTick"));
    renderThemeGrid();
    if (document.getElementById("collection-backdrop").classList.contains("is-open")) renderCollection();
    syncSettingsUI();
    const fsOn = !!document.fullscreenElement;
    const fsLabel = QH.t(fsOn ? "exitFullscreen" : "enterFullscreen");
    document.getElementById("menu-fs").textContent = fsLabel;
    document.getElementById("fs-btn").setAttribute("aria-label", fsLabel);
    const st = document.getElementById("status-text");
    if (st && !st.textContent) st.textContent = QH.t("statusListening");
  }

  function setLang(lang) {
    QH.state.lang = lang;
    saveState();
    applyI18n();
  }

  /* ---------- Theme cards ---------- */
  function themeCard(id, selected) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-pressed", String(id === selected));
    btn.dataset.theme = id;
    const icon = (QH.icons[id] && QH.icons[id]()) || "";
    btn.innerHTML =
      `<span class="theme-icon">${icon}</span>` +
      `<span><h3>${QH.t("theme_" + id)}</h3><p>${QH.t("theme_" + id + "_line")}</p></span>`;
    btn.addEventListener("click", () => selectTheme(id, true));
    return btn;
  }

  function renderThemeGrid() {
    const selected = QH.state.theme;
    ["theme-grid", "theme-grid-session"].forEach((gid) => {
      const root = document.getElementById(gid);
      if (!root) return;
      root.innerHTML = "";
      QH.THEME_ORDER.forEach((id) => root.appendChild(themeCard(id, selected)));
    });
  }

  function selectTheme(id, paint) {
    if (!QH.THEMES[id]) return;
    QH.state.theme = id;
    saveState();
    renderThemeGrid();
    if (paint && !QH.engine.session.active) QH.paintTheme(id);
    if (paint && QH.engine.session.active) {
      QH.engine.changeTheme(id);
      closeModal("themes-session");
    }
  }

  /* ---------- Modals ---------- */
  function openModal(name) {
    closeAllModals();
    const el = document.getElementById(name + "-backdrop");
    if (!el) return;
    el.hidden = false;
    el.classList.add("is-open");
    if (name === "collection") renderCollection();
    if (name === "settings") syncSettingsUI();
    if (name === "calibrate") resetCalUI();
    QH.engine.session.pausedForModal = name === "calibrate";
  }

  function closeModal(name) {
    const el = document.getElementById(name + "-backdrop");
    if (!el) return;
    el.classList.remove("is-open");
    el.hidden = true;
    if (name === "calibrate") QH.engine.session.pausedForModal = false;
  }

  function closeAllModals() {
    document.querySelectorAll(".backdrop").forEach((el) => {
      el.classList.remove("is-open");
      el.hidden = true;
    });
    QH.engine.session.pausedForModal = false;
  }

  /* ---------- Settings ---------- */
  function syncSettingsUI() {
    const st = QH.state;
    document.querySelectorAll("#settings-goal .chip, #hud-goals .chip").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-goal") === st.goalPreset));
    });
    document.querySelectorAll("[data-pace]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-pace") === st.pace));
    });
    document.getElementById("custom-pace-field").hidden = st.pace !== "custom";
    document.getElementById("custom-minutes").value = st.customMinutes;
    document.querySelectorAll("[data-behavior]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-behavior") === st.loudBehavior));
    });
    const tick = document.getElementById("meter-tick");
    tick.style.left = st.volumeGoal + "%";
    tick.setAttribute("aria-valuenow", String(Math.round(st.volumeGoal)));
  }

  function setGoalPreset(name) {
    if (!GOAL[name]) return;
    QH.state.goalPreset = name;
    QH.state.volumeGoal = GOAL[name];
    saveState();
    syncSettingsUI();
  }

  function setGoalValue(v) {
    QH.state.volumeGoal = clamp(v, 8, 90);
    const near = Object.keys(GOAL).find((k) => Math.abs(GOAL[k] - QH.state.volumeGoal) < 2);
    QH.state.goalPreset = near || "custom";
    saveState();
    syncSettingsUI();
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  /* ---------- Collection ---------- */
  let collectionTheme = null;

  function renderCollection() {
    const tid = collectionTheme || QH.state.theme;
    collectionTheme = tid;
    const tabs = document.getElementById("collection-tabs");
    tabs.innerHTML = "";
    QH.THEME_ORDER.forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", String(id === tid));
      b.textContent = QH.t("theme_" + id);
      b.addEventListener("click", () => { collectionTheme = id; renderCollection(); });
      tabs.appendChild(b);
    });
    const roster = QH.THEMES[tid].animals;
    const seen = new Set(QH.state.collection[tid] || []);
    document.getElementById("collection-meta").textContent =
      QH.t("spotted") + " " + seen.size + " / " + roster.length;
    const grid = document.getElementById("collection-grid");
    grid.innerHTML = "";
    if (seen.size === 0) {
      const empty = document.createElement("p");
      empty.className = "lead";
      empty.style.gridColumn = "1 / -1";
      empty.textContent = QH.t("emptyCollection");
      grid.appendChild(empty);
    }
    roster.forEach((a) => {
      const card = document.createElement("div");
      const spotted = seen.has(a.id);
      card.className = "collection-card" + (spotted ? "" : " is-unseen");
      const art = (QH.art[a.id] && QH.art[a.id]()) || "";
      card.innerHTML =
        `<div class="art">${art}</div>` +
        `<div class="name">${spotted ? QH.t("animal_" + a.id) : "？"}</div>` +
        (a.rare ? `<div class="badge">${QH.t("rare")}</div>` : "");
      grid.appendChild(card);
    });
  }

  /* ---------- Calibration ---------- */
  let calTimer = 0;

  function resetCalUI() {
    window.clearInterval(calTimer);
    document.getElementById("cal-intro").hidden = false;
    document.getElementById("cal-intro").textContent = QH.t("calIntro");
    document.getElementById("cal-status").hidden = true;
    document.getElementById("cal-actions").hidden = false;
    document.getElementById("btn-cal-start").disabled = false;
  }

  function average(arr) {
    if (!arr.length) return -50;
    return arr.reduce((s, n) => s + n, 0) / arr.length;
  }

  async function runCalibration() {
    const status = document.getElementById("cal-status");
    const intro = document.getElementById("cal-intro");
    const actions = document.getElementById("cal-actions");
    try {
      if (QH.audio.mode !== "mic") await QH.audio.startMic();
    } catch (err) {
      intro.textContent = QH.t("calNeedMic");
      return;
    }
    intro.hidden = true;
    actions.hidden = true;
    status.hidden = false;
    QH.engine.session.pausedForModal = true;

    const collect = (seconds, labelKey) =>
      new Promise((resolve) => {
        const samples = [];
        let left = seconds;
        const tick = () => {
          status.textContent = QH.t(labelKey) + "  " + QH.t("secondsLeft", { n: left });
          samples.push(QH.audio.collectDbSample());
        };
        tick();
        calTimer = window.setInterval(() => {
          left -= 1;
          if (left <= 0) {
            window.clearInterval(calTimer);
            samples.push(QH.audio.collectDbSample());
            resolve(samples);
          } else tick();
        }, 1000);
      });

    const silence = await collect(5, "calSilence");
    const talk = await collect(5, "calTalk");
    let silenceDb = average(silence);
    let talkDb = average(talk);
    if (talkDb < silenceDb + 4) talkDb = silenceDb + 8;
    QH.state.calibration = { silenceDb, talkDb };
    QH.audio.setCalibration(QH.state.calibration);
    saveState();
    status.textContent = QH.t("calDone");
    actions.hidden = false;
    document.getElementById("btn-cal-start").textContent = QH.t("done");
    document.getElementById("btn-cal-start").disabled = false;
    QH.engine.session.pausedForModal = false;
  }

  /* ---------- Fullscreen ---------- */
  function isFs() { return !!document.fullscreenElement; }

  function updateFsButtons() {
    const label = QH.t(isFs() ? "exitFullscreen" : "enterFullscreen");
    const btn = document.getElementById("menu-fs");
    if (btn) btn.textContent = label;
    document.getElementById("fs-btn").setAttribute("aria-label", label);
  }

  async function toggleFullscreen() {
    try {
      if (isFs()) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (e) { /* browsers may deny; the layout still works */ }
    updateFsButtons();
  }

  /* ---------- Session start ---------- */
  function showSessionChrome(demo) {
    document.getElementById("home").classList.add("is-hidden");
    document.getElementById("session-ui").classList.add("is-on");
    document.getElementById("demo-bar").classList.toggle("is-on", !!demo);
    if (demo) setDemoButtons("quiet");
  }

  function endSession() {
    closeAllModals();
    QH.engine.stop(false);
    QH.audio.stopMic();
    QH.audio.raw.mode = "idle";
    document.getElementById("home").classList.remove("is-hidden");
    document.getElementById("session-ui").classList.remove("is-on");
    document.getElementById("demo-bar").classList.remove("is-on");
    QH.paintTheme(QH.state.theme);
    if (isFs()) document.exitFullscreen().catch(() => {});
  }

  async function beginSession(forceDemo) {
    const startBtn = document.getElementById("btn-start");
    startBtn.disabled = true;
    startBtn.textContent = QH.t("starting");
    closeAllModals();
    QH.paintTheme(QH.state.theme);
    if (forceDemo) {
      QH.audio.startDemo(8);
      showSessionChrome(true);
      QH.engine.start(QH.state.theme);
      toggleFullscreen();
      startBtn.disabled = false;
      startBtn.textContent = QH.t("start");
      return;
    }
    try {
      await QH.audio.startMic();
      showSessionChrome(false);
      QH.engine.start(QH.state.theme);
      toggleFullscreen();
    } catch (err) {
      openModal("mic");
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = QH.t("start");
    }
  }

  function setDemoButtons(level) {
    document.querySelectorAll("#demo-bar button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-level") === level));
    });
    const goal = QH.state.volumeGoal;
    const map = { quiet: Math.max(4, goal * 0.35), mid: goal + 6, loud: Math.min(96, goal + 36) };
    QH.audio.setDemoLevel(map[level] || 8);
    if (QH.audio.mode !== "demo") QH.audio.startDemo(map[level] || 8);
  }

  /* ---------- Meter drag ---------- */
  function bindMeter() {
    const track = document.getElementById("meter-track");
    const tick = document.getElementById("meter-tick");
    const meter = document.getElementById("meter");
    let dragging = false;
    let moved = false;

    function posToGoal(clientX) {
      const rect = track.getBoundingClientRect();
      const t = (clientX - rect.left) / rect.width;
      return clamp(t * 100, 8, 90);
    }

    let pointerId = null;
    function onMove(ev) {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      const x = ev.clientX;
      moved = true;
      setGoalValue(posToGoal(x));
    }
    function onUp(ev) {
      if (pointerId != null && ev && ev.pointerId !== pointerId) return;
      const target = ev && ev.target;
      if (pointerId != null && target && target.releasePointerCapture) {
        try { target.releasePointerCapture(pointerId); } catch (e) {}
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dragging = false;
      pointerId = null;
    }
    function startDrag(ev, alreadyMoved) {
      ev.preventDefault();
      ev.stopPropagation();
      dragging = true;
      moved = alreadyMoved;
      pointerId = ev.pointerId;
      try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
      setGoalValue(posToGoal(ev.clientX));
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }

    tick.addEventListener("pointerdown", (ev) => startDrag(ev, false));
    track.addEventListener("pointerdown", (ev) => {
      if (ev.target === tick) return;
      startDrag(ev, true);
    });
    meter.addEventListener("click", (ev) => {
      if (moved) { moved = false; ev.preventDefault(); return; }
      if (ev.target === tick || ev.target === track || ev.target.id === "meter-fill") return;
      openModal("menu");
    });
    tick.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") { setGoalValue(QH.state.volumeGoal - 2); ev.preventDefault(); }
      if (ev.key === "ArrowRight") { setGoalValue(QH.state.volumeGoal + 2); ev.preventDefault(); }
    });
  }

  /* ---------- Events ---------- */
  function bind() {
    document.addEventListener("contextmenu", (ev) => ev.preventDefault());
    document.addEventListener("gesturestart", (ev) => ev.preventDefault());
    document.getElementById("lang-zh").addEventListener("click", () => setLang("zh-HK"));
    document.getElementById("lang-en").addEventListener("click", () => setLang("en"));
    document.getElementById("btn-start").addEventListener("click", () => beginSession(false));
    document.getElementById("btn-how").addEventListener("click", () => openModal("how"));
    document.getElementById("btn-collection").addEventListener("click", () => openModal("collection"));
    document.getElementById("btn-settings").addEventListener("click", () => openModal("settings"));
    document.getElementById("gear-btn").addEventListener("click", () => openModal("menu"));
    document.getElementById("fs-btn").addEventListener("click", toggleFullscreen);
    document.getElementById("menu-fs").addEventListener("click", () => { closeModal("menu"); toggleFullscreen(); });
    document.getElementById("menu-end").addEventListener("click", endSession);

    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
    });
    document.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.getAttribute("data-open")));
    });
    document.querySelectorAll(".backdrop").forEach((bd) => {
      bd.addEventListener("click", (ev) => { if (ev.target === bd) closeAllModals(); });
    });

    document.querySelectorAll("#settings-lang .chip").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
    document.querySelectorAll("#settings-goal .chip, #hud-goals .chip").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setGoalPreset(btn.getAttribute("data-goal"));
      });
    });
    document.querySelectorAll("[data-pace]").forEach((btn) => {
      btn.addEventListener("click", () => {
        QH.state.pace = btn.getAttribute("data-pace");
        saveState();
        syncSettingsUI();
      });
    });
    document.getElementById("custom-minutes").addEventListener("change", (ev) => {
      QH.state.customMinutes = clamp(Number(ev.target.value) || 4, 0.1, 30);
      QH.state.pace = "custom";
      saveState();
      syncSettingsUI();
    });
    document.querySelectorAll("[data-behavior]").forEach((btn) => {
      btn.addEventListener("click", () => {
        QH.state.loudBehavior = btn.getAttribute("data-behavior");
        saveState();
        syncSettingsUI();
      });
    });

    document.getElementById("btn-cal-start").addEventListener("click", () => {
      if (document.getElementById("cal-status").textContent === QH.t("calDone")) {
        closeModal("calibrate");
        resetCalUI();
        return;
      }
      runCalibration();
    });

    document.getElementById("btn-demo").addEventListener("click", () => {
      closeModal("mic");
      beginSession(true);
    });
    document.getElementById("btn-mic-retry").addEventListener("click", () => {
      closeModal("mic");
      beginSession(false);
    });

    document.querySelectorAll("#demo-bar button").forEach((btn) => {
      btn.addEventListener("click", () => setDemoButtons(btn.getAttribute("data-level")));
    });

    document.getElementById("btn-reset-collection").addEventListener("click", () => {
      const tid = collectionTheme || QH.state.theme;
      const ok = confirm(QH.t("resetCollectionConfirm", { theme: QH.t("theme_" + tid) }));
      if (!ok) return;
      QH.state.collection[tid] = [];
      saveState();
      renderCollection();
    });

    bindMeter();

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (document.querySelector(".backdrop.is-open")) { closeAllModals(); ev.preventDefault(); return; }
        if (isFs()) { document.exitFullscreen().catch(() => {}); ev.preventDefault(); }
        return;
      }
      if (!QH.engine.session.active) return;
      if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
      if (QH.audio.mode === "demo") {
        if (ev.key === "1") setDemoButtons("quiet");
        if (ev.key === "2") setDemoButtons("mid");
        if (ev.key === "3") setDemoButtons("loud");
      }
    });

    document.addEventListener("fullscreenchange", updateFsButtons);
  }

  /* ---------- Boot ---------- */
  function boot() {
    bind();
    applyI18n();
    QH.paintTheme(QH.state.theme);
    QH.engine.ensureLoop();
    const tick = document.getElementById("meter-tick");
    tick.style.left = QH.state.volumeGoal + "%";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
