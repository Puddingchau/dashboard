/* Session loop: quiet-time arrivals, spike filtering, overlays, and leaving. */
(function (global) {
  const QH = (global.QH = global.QH || {});

  const PACE_MS = {
    relaxed: 8 * 60 * 1000,
    normal: 5 * 60 * 1000,
    lively: 2.5 * 60 * 1000,
    preview: 12 * 1000,
  };
  const FIRST_MIN = 10 * 1000;
  const FIRST_MAX = 20 * 1000;
  const PREVIEW_FIRST = 8 * 1000;
  const GRACE_SLIGHT = 6000;
  const GRACE_LOUD = 1000;
  const CLEAR_MS = 3000;
  const FLEE_EVERY = 5000;
  const MAX_ON_SCREEN = 16;

  const session = {
    active: false,
    themeId: "savanna",
    quietMs: 0,
    nextAt: 0,
    spawned: 0,
    overMs: 0,
    loud: false,
    clearing: false,
    clearAt: 0,
    fleeAt: 0,
    lastTs: 0,
    raf: 0,
    creatures: [],
    pausedForModal: false,
  };

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function intervalMs() {
    const st = QH.state;
    if (st.pace === "custom") return Math.max(0.15, Number(st.customMinutes) || 4) * 60 * 1000;
    if (st.pace === "preview") return rand(8000, 15000);
    return PACE_MS[st.pace] || PACE_MS.normal;
  }

  function firstDelay() {
    return QH.state.pace === "preview" ? PREVIEW_FIRST : rand(FIRST_MIN, FIRST_MAX);
  }

  function zonePos(def) {
    let y, scale;
    const zone = def.zone || "ground";
    if (zone === "sky") {
      y = rand(8, 32);
      scale = 0.55 + (y / 40) * 0.25;
    } else if (zone === "water") {
      y = rand(30, 68);
      scale = 0.62 + (y / 100) * 0.5;
    } else if (zone === "mid") {
      y = rand(44, 64);
      scale = 0.72 + (y / 100) * 0.35;
    } else {
      y = rand(58, 82);
      scale = 0.82 + ((y - 58) / 24) * 0.4;
    }
    let x = rand(8, 88);
    // Keep the top-center HUD reasonably clear.
    if (y < 18 && x > 30 && x < 70) x = Math.random() < 0.5 ? rand(6, 26) : rand(74, 92);
    return { x, y, scale };
  }

  function overlaps(x, y, wPct) {
    return session.creatures.some((c) => {
      if (c.leaving) return false;
      return Math.abs(c.x - x) < wPct * 0.55 && Math.abs(c.y - y) < 10;
    });
  }

  function pickNext() {
    const theme = QH.THEMES[session.themeId];
    const roster = theme.animals;
    const counts = {};
    session.creatures.forEach((c) => {
      if (!c.leaving) counts[c.id] = (counts[c.id] || 0) + 1;
    });
    const seen = new Set(QH.state.collection[session.themeId] || []);
    const available = (rare) =>
      roster.filter((a) => (rare ? a.rare : !a.rare) && (counts[a.id] || 0) < (a.max || 2));
    const unseenCommon = available(false).filter((a) => !seen.has(a.id));
    const commons = available(false);
    const rares = available(true);

    if (session.spawned >= 3 && rares.length && Math.random() < 0.07) return pick(rares);
    if (unseenCommon.length) return pick(unseenCommon);
    if (commons.length) return pick(commons);
    if (rares.length && Math.random() < 0.12) return pick(rares);
    return null;
  }

  function spawnOne() {
    if (session.creatures.filter((c) => !c.leaving).length >= MAX_ON_SCREEN) return false;
    const def = pickNext();
    if (!def) return false;
    const draw = QH.art[def.id];
    if (!draw) return false;

    let pos = zonePos(def);
    const width = def.size * pos.scale;
    const wPct = (width / window.innerWidth) * 100;
    for (let i = 0; i < 8; i++) {
      if (!overlaps(pos.x, pos.y, wPct)) break;
      pos = zonePos(def);
    }

    const el = document.createElement("div");
    el.className = "creature";
    const enter = def.enter || "side";
    let from = "from-fade";
    let flip = false;
    if (enter === "side") {
      from = pos.x < 50 ? "from-left" : "from-right";
      flip = from === "from-right";
    } else if (enter === "top") from = "from-top";
    else if (enter === "bottom") from = "from-bottom";
    else from = "from-fade";
    el.classList.add("is-entering", from);

    const height = width * 0.88;
    el.style.left = pos.x + "%";
    el.style.top = pos.y + "%";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.marginLeft = -width / 2 + "px";
    el.style.marginTop = -height * 0.75 + "px";
    el.style.zIndex = String(20 + Math.round(pos.y));

    const inner = document.createElement("div");
    inner.className = "creature-inner";
    if (flip) inner.style.transform = "scaleX(-1)";
    inner.innerHTML = draw();
    el.appendChild(inner);
    document.getElementById("creatures").appendChild(el);

    const rec = {
      id: def.id,
      def,
      el,
      inner,
      x: pos.x,
      y: pos.y,
      flip,
      leaving: false,
      wanderAt: performance.now() + rand(4000, 9000),
    };
    session.creatures.push(rec);
    session.spawned += 1;
    QH.markSpotted(session.themeId, def.id);

    window.setTimeout(() => {
      if (rec.leaving) return;
      el.classList.remove("is-entering", from);
      el.classList.add("is-idle", def.idle || "bob");
    }, 1100);
    return true;
  }

  function fleeOne(rec) {
    if (!rec || rec.leaving) return;
    rec.leaving = true;
    const el = rec.el;
    el.classList.remove("is-idle", "bob", "sway", "swim", "float", "flap", "is-entering");
    const theme = QH.THEMES[session.themeId];
    const useFade = (theme && theme.flee === "fade") || rec.def.zone === "sky" && theme && theme.id === "space";
    if (useFade) {
      el.classList.add("is-fading");
    } else {
      el.classList.add("is-fleeing");
      const zone = rec.def.zone;
      let tx = 0, ty = 0;
      if (zone === "sky") {
        ty = -70;
        tx = rec.x < 50 ? -30 : 30;
      } else if (rec.x < 50) tx = -120;
      else tx = 120;
      el.style.transform = `translate(${tx}vw, ${ty}vh)`;
    }
    window.setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      session.creatures = session.creatures.filter((c) => c !== rec);
    }, 1900);
  }

  function fleeSome(n) {
    const live = session.creatures.filter((c) => !c.leaving);
    for (let i = 0; i < n && live.length; i++) {
      const idx = Math.floor(Math.random() * live.length);
      fleeOne(live.splice(idx, 1)[0]);
    }
  }

  function wander(now) {
    if (session.loud) return;
    session.creatures.forEach((c) => {
      if (c.leaving || now < c.wanderAt) return;
      if (c.def.zone === "sky" || QH.THEMES[session.themeId].id === "space") {
        c.x = clamp(c.x + rand(-6, 6), 8, 92);
        c.y = clamp(c.y + rand(-4, 4), 6, 80);
      } else {
        c.x = clamp(c.x + rand(-7, 7), 6, 94);
      }
      c.el.style.transition = "left 4.5s linear, top 4.5s linear";
      c.el.style.left = c.x + "%";
      c.el.style.top = c.y + "%";
      c.wanderAt = now + rand(5000, 11000);
    });
  }

  function setLoud(on, behavior) {
    const scene = document.getElementById("scene");
    if (on) {
      session.loud = true;
      session.clearing = false;
      scene.classList.add("is-loud");
      scene.classList.remove("is-clearing");
      if (behavior === "flee") {
        fleeSome(1);
        session.fleeAt = performance.now() + FLEE_EVERY;
      } else {
        session.creatures.forEach((c) => c.el.classList.add("is-frozen"));
      }
    } else {
      session.loud = false;
      session.clearing = true;
      session.clearAt = performance.now() + CLEAR_MS;
      scene.classList.remove("is-loud");
      scene.classList.add("is-clearing");
      session.creatures.forEach((c) => c.el.classList.remove("is-frozen"));
    }
  }

  function statusFor(level, goal, over, liveCount, canSpawn) {
    if (session.loud) {
      return QH.state.loudBehavior === "pause" ? "statusPaused" : "statusTooLoud";
    }
    if (over) return "statusBitLoud";
    if (!canSpawn && liveCount > 0) return "statusFull";
    if (session.spawned === 0) return "statusSoon";
    return "statusArriving";
  }

  function updateHud(level, goal, statusKey, kind) {
    const fill = document.getElementById("meter-fill");
    const tick = document.getElementById("meter-tick");
    const status = document.getElementById("meter-status");
    const text = document.getElementById("status-text");
    fill.style.width = clamp(level, 0, 100) + "%";
    tick.style.left = clamp(goal, 8, 90) + "%";
    tick.setAttribute("aria-valuenow", String(Math.round(goal)));
    fill.classList.remove("is-warn", "is-loud");
    status.classList.remove("is-warn", "is-loud");
    if (kind === "loud") { fill.classList.add("is-loud"); status.classList.add("is-loud"); }
    else if (kind === "warn") { fill.classList.add("is-warn"); status.classList.add("is-warn"); }
    text.textContent = QH.t(statusKey);
  }

  function loop(ts) {
    session.raf = requestAnimationFrame(loop);
    if (!session.lastTs) session.lastTs = ts;
    const dt = Math.min(100, ts - session.lastTs);
    session.lastTs = ts;

    QH.audio.tick();
    const levels = QH.audio.getLevels();
    const goal = QH.state.volumeGoal;
    const level = levels.smooth;
    const fast = levels.fast;
    const much = fast > goal + 22 || fast > goal * 1.7 + 8;
    const over = level > goal + 1.2;

    if (!session.active || session.pausedForModal) {
      updateHud(level, goal, session.active ? "statusListening" : "statusListening", over ? "warn" : "good");
      return;
    }

    if (session.clearing && ts >= session.clearAt) {
      session.clearing = false;
      document.getElementById("scene").classList.remove("is-clearing");
    }

    if (session.loud) {
      if (!over && fast <= goal + 0.5) {
        setLoud(false, QH.state.loudBehavior);
        session.overMs = 0;
      } else if (QH.state.loudBehavior === "flee" && ts >= session.fleeAt) {
        fleeSome(2 + Math.floor(Math.random() * 2));
        session.fleeAt = ts + FLEE_EVERY;
      }
    } else if (over) {
      session.overMs += dt;
      const need = much ? GRACE_LOUD : GRACE_SLIGHT;
      if (session.overMs >= need) {
        setLoud(true, QH.state.loudBehavior);
        session.overMs = 0;
      }
    } else {
      session.overMs = 0;
      session.quietMs += dt;
      if (session.quietMs >= session.nextAt) {
        const ok = spawnOne();
        session.nextAt = session.quietMs + intervalMs();
        if (!ok) session.nextAt = session.quietMs + Math.min(intervalMs(), 20000);
      }
    }

    wander(ts);

    const live = session.creatures.filter((c) => !c.leaving).length;
    const canSpawn = !!pickNext() && live < MAX_ON_SCREEN;
    const kind = session.loud ? "loud" : over ? "warn" : "good";
    const key = statusFor(level, goal, over && !session.loud, live, canSpawn);
    updateHud(level, goal, key, kind);
  }

  function start(themeId) {
    stop(false);
    session.active = true;
    session.themeId = themeId || QH.state.theme;
    session.quietMs = 0;
    session.nextAt = firstDelay();
    session.spawned = 0;
    session.overMs = 0;
    session.loud = false;
    session.clearing = false;
    session.lastTs = 0;
    session.creatures = [];
    document.getElementById("creatures").innerHTML = "";
    document.getElementById("scene").classList.remove("is-loud", "is-clearing");
    QH.paintTheme(session.themeId);
    if (!session.raf) session.raf = requestAnimationFrame(loop);
  }

  function stop(stopLoop) {
    session.active = false;
    session.loud = false;
    session.creatures.forEach((c) => {
      if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el);
    });
    session.creatures = [];
    const scene = document.getElementById("scene");
    if (scene) scene.classList.remove("is-loud", "is-clearing");
    const box = document.getElementById("creatures");
    if (box) box.innerHTML = "";
    if (stopLoop && session.raf) {
      cancelAnimationFrame(session.raf);
      session.raf = 0;
    }
  }

  function changeTheme(id) {
    session.themeId = id;
    session.creatures.forEach((c) => {
      if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el);
    });
    session.creatures = [];
    session.spawned = 0;
    session.quietMs = 0;
    session.nextAt = firstDelay();
    session.overMs = 0;
    session.loud = false;
    session.clearing = false;
    document.getElementById("scene").classList.remove("is-loud", "is-clearing");
    QH.paintTheme(id);
  }

  function ensureLoop() {
    if (!session.raf) session.raf = requestAnimationFrame(loop);
  }

  QH.engine = {
    start,
    stop,
    changeTheme,
    ensureLoop,
    session,
    updateHud,
    spawnOne,
    PACE_MS,
  };
})(window);
