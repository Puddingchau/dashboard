/* Session loop: quiet-time arrivals, natural wandering, spike filtering, overlays, and leaving. */
(function (global) {
  const QH = (global.QH = global.QH || {});

  const PACE_MS = {
    relaxed: 2 * 60 * 1000,
    normal: 45 * 1000,
    lively: 20 * 1000,
    preview: 7 * 1000,
  };
  const FIRST_MIN = 5 * 1000;
  const FIRST_MAX = 10 * 1000;
  const PREVIEW_FIRST = 4 * 1000;
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
    durationMs: 0,
    chosenMs: 0,
    remainingMs: 0,
    timedOut: false,
    timerPaused: false,
  };

  const view = { w: 0, h: 0 };
  const hudCache = { pct: 20, at: 0 };
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PROFILES = {
    swim:    { speed: 6.2, accel: 4.2, turn: 0.95, pauseChance: 0.16, pause: [0.9, 2.2], leg: [3.4, 6.6], curve: 0.22, bob: 0.22 },
    glide:   { speed: 5.2, accel: 3.0, turn: 0.72, pauseChance: 0.1, pause: [0.7, 1.8], leg: [4.0, 7.2], curve: 0.28, bob: 0.18 },
    pulse:   { speed: 3.8, accel: 5.5, turn: 1.25, pauseChance: 0.38, pause: [0.7, 1.8], leg: [1.5, 2.8], curve: 0.5, bob: 0.4 },
    drift:   { speed: 2.3, accel: 1.15, turn: 0.42, pauseChance: 0.22, pause: [1.4, 3.2], leg: [4.2, 8.0], curve: 0.36, bob: 0.7 },
    float:   { speed: 3.0, accel: 1.5, turn: 0.55, pauseChance: 0.12, pause: [0.8, 2.0], leg: [3.2, 6.5], curve: 0.48, bob: 0.85 },
    fly:     { speed: 7.2, accel: 4.6, turn: 0.85, pauseChance: 0.08, pause: [0.4, 1.2], leg: [2.6, 5.2], curve: 0.62, bob: 0.55 },
    flutter: { speed: 5.6, accel: 6.2, turn: 1.7, pauseChance: 0.14, pause: [0.3, 1.0], leg: [1.3, 2.6], curve: 0.95, bob: 1.05 },
    walk:    { speed: 4.0, accel: 5.4, turn: 2.1, pauseChance: 0.3, pause: [1.1, 2.8], leg: [2.4, 4.8], curve: 0.06, bob: 0.04 },
    scuttle: { speed: 4.8, accel: 7.5, turn: 2.8, pauseChance: 0.36, pause: [0.45, 1.4], leg: [0.7, 1.6], curve: 0.12, bob: 0 },
    creep:   { speed: 1.45, accel: 1.3, turn: 0.75, pauseChance: 0.4, pause: [1.4, 3.2], leg: [2.2, 4.2], curve: 0.1, bob: 0.04 },
    amble:   { speed: 2.7, accel: 3.2, turn: 1.2, pauseChance: 0.32, pause: [1.3, 2.8], leg: [2.4, 4.6], curve: 0.12, bob: 0.08 },
    perch:   { speed: 1.15, accel: 1.8, turn: 1.1, pauseChance: 0.58, pause: [2.2, 4.6], leg: [1.2, 2.4], curve: 0.08, bob: 0.12 },
    hop:     { speed: 4.6, accel: 12, turn: 2.2, pauseChance: 0.5, pause: [0.55, 1.6], leg: [0.45, 0.85], curve: 0.08, bob: 0.05 },
    still:   { speed: 0.35, accel: 0.4, turn: 0.3, pauseChance: 0.72, pause: [2.8, 5.5], leg: [2.0, 4.0], curve: 0.04, bob: 0.03 },
  };

  const KIND_BY_ID = {
    crab: "scuttle", starfish: "creep", seahorse: "drift", octopus: "pulse",
    eel: "swim", stingray: "glide", turtle: "swim", sloth: "perch",
    owl: "perch", hatowl: "perch", woodpecker: "perch", spider: "creep",
    python: "creep", pumpkin: "still", jack: "still", scarecrow: "still",
    ghost: "float", butterfly: "flutter", satellite: "drift", station: "drift",
    saturn: "drift", moon: "drift", galaxy: "drift", blackhole: "drift",
    pulsar: "drift", cluster: "drift", nebula: "drift", probe: "drift",
    comet: "fly", rocket: "fly", astronaut: "float", alien: "float",
    rover: "walk", dartfrog: "hop", rabbit: "hop", arctichare: "hop",
  };

  const SPEED_TWEAK = {
    gazelle: 1.5, rabbit: 1.35, squirrel: 1.28, chipmunk: 1.22,
    reefshark: 1.28, hammerhead: 1.22, whaleshark: 0.72, bowhead: 0.7,
    elephant: 0.66, giraffe: 0.74, sauropod: 0.6, turtle: 0.72,
    sloth: 0.55, comet: 1.4, rocket: 1.18, narwhal: 0.82, manta: 0.88,
    beluga: 0.84, meerkat: 0.9, hippo: 0.7, trex: 0.85,
  };

  const NO_FACE = new Set([
    "starfish", "pumpkin", "jack", "scarecrow", "satellite", "station",
    "saturn", "moon", "galaxy", "blackhole", "pulsar", "cluster", "nebula", "probe",
  ]);
  const LEAN_FACE = new Set(["crab"]);

  const BOUND_DEFAULT = {
    sky: [4, 96, 8, 34],
    water: [4, 96, 28, 68],
    mid: [5, 95, 44, 68],
    ground: [3, 97, 64, 86],
  };
  const BOUND_TABLE = {
    reef: {
      water: [3, 97, 16, 64],
      ground: [4, 96, 74, 90],
      mid: [5, 95, 50, 70],
      sky: [5, 95, 8, 28],
    },
    arctic: {
      water: [3, 97, 52, 67],
      ground: [4, 96, 70, 88],
      mid: [5, 95, 60, 78],
      sky: [4, 96, 8, 32],
    },
    space: {
      sky: [4, 96, 8, 78],
      mid: [6, 94, 62, 88],
      ground: [6, 94, 64, 88],
      water: [6, 94, 30, 70],
    },
    savanna: {
      ground: [3, 97, 64, 86],
      mid: [4, 96, 50, 70],
      sky: [4, 96, 8, 30],
      water: [6, 94, 56, 72],
    },
    forest: {
      ground: [3, 97, 68, 88],
      mid: [6, 90, 34, 58],
      sky: [4, 96, 8, 30],
      water: [8, 92, 60, 74],
    },
    jungle: {
      ground: [4, 96, 68, 88],
      mid: [8, 88, 32, 60],
      sky: [4, 96, 8, 30],
      water: [8, 92, 60, 74],
    },
    prehistoric: {
      ground: [3, 97, 64, 86],
      mid: [5, 95, 48, 70],
      sky: [3, 97, 8, 34],
      water: [6, 94, 58, 74],
    },
    pumpkin: {
      ground: [4, 96, 66, 88],
      mid: [6, 94, 40, 66],
      sky: [4, 96, 8, 36],
      water: [8, 92, 60, 74],
    },
  };

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function wrapAngle(a) {
    const t = Math.PI * 2;
    while (a > Math.PI) a -= t;
    while (a < -Math.PI) a += t;
    return a;
  }
  function reducedMotion() { return !!(motionQuery && motionQuery.matches); }

  function measureView() {
    const scene = document.getElementById("scene");
    if (!scene) return;
    const r = scene.getBoundingClientRect();
    view.w = r.width || window.innerWidth;
    view.h = r.height || window.innerHeight;
    hudCache.at = 0;
  }

  function hudBottomPct() {
    const now = performance.now();
    if (now - hudCache.at < 400 && hudCache.at) return hudCache.pct;
    const hud = document.getElementById("hud");
    const scene = document.getElementById("scene");
    if (!hud || !scene || !view.h) return hudCache.pct;
    const hb = hud.getBoundingClientRect().bottom;
    const top = scene.getBoundingClientRect().top;
    hudCache.pct = clamp(((hb - top) / view.h) * 100 + 1.2, 8, 62);
    hudCache.at = now;
    return hudCache.pct;
  }

  window.addEventListener("resize", measureView);

  function intervalMs() {
    const st = QH.state;
    if (st.pace === "custom") return Math.max(0.15, Number(st.customMinutes) || 4) * 60 * 1000;
    if (st.pace === "preview") return rand(6000, 8000);
    return PACE_MS[st.pace] || PACE_MS.normal;
  }

  function firstDelay() {
    return QH.state.pace === "preview" ? PREVIEW_FIRST : rand(FIRST_MIN, FIRST_MAX);
  }

  function kindFor(def) {
    if (KIND_BY_ID[def.id]) return KIND_BY_ID[def.id];
    const zone = def.zone || "ground";
    const idle = def.idle || "bob";
    if (zone === "water" || idle === "swim") return "swim";
    if (zone === "sky" && idle === "flap") return "fly";
    if (zone === "sky") return idle === "float" ? "float" : "fly";
    if (zone === "mid") return "amble";
    return "walk";
  }

  function facingFor(id) {
    if (NO_FACE.has(id)) return "none";
    if (LEAN_FACE.has(id)) return "lean";
    return "flip";
  }

  function boundsFor(def) {
    const zone = (def && def.zone) || "ground";
    const theme = BOUND_TABLE[session.themeId] || {};
    const spec = theme[zone] || BOUND_DEFAULT[zone] || BOUND_DEFAULT.ground;
    const b = { x0: spec[0], x1: spec[1], y0: spec[2], y1: spec[3] };
    if (session.themeId === "reef" && def && (def.id === "stingray" || def.id === "eel" || def.id === "octopus")) {
      b.y0 = Math.max(b.y0, 46);
      b.y1 = Math.min(73, Math.max(b.y1, 70));
    }
    return b;
  }

  function zonePos(def) {
    const b = boundsFor(def);
    let x = rand(b.x0 + 2, b.x1 - 2);
    let y = rand(b.y0 + 1, b.y1 - 1);
    const hud = hudBottomPct();
    if (y < hud && x > 18 && x < 82) {
      if (b.y1 > hud + 4) y = rand(Math.max(b.y0, hud + 2), b.y1 - 1);
      else x = Math.random() < 0.5 ? rand(b.x0 + 1, 14) : rand(86, b.x1 - 1);
    }
    const zone = def.zone || "ground";
    let scale;
    if (zone === "sky") scale = 0.55 + (y / 40) * 0.25;
    else if (zone === "water") scale = 0.62 + (y / 100) * 0.5;
    else if (zone === "mid") scale = 0.72 + (y / 100) * 0.35;
    else scale = 0.82 + clamp((y - 58) / 24, 0, 1) * 0.4;
    return { x, y, scale };
  }

  function overlaps(x, y, wPct) {
    return session.creatures.some((c) => {
      if (c.leaving) return false;
      return Math.abs(c.x - x) < wPct * 0.55 && Math.abs(c.y - y) < 10;
    });
  }

  function pickWaypoint(c, b) {
    const k = c.kind;
    const groundish = k === "walk" || k === "scuttle" || k === "creep" || k === "hop" || k === "still" || k === "amble";
    const forward = Math.cos(c.heading) >= 0 ? 1 : -1;
    const use = Math.random() < (groundish ? 0.7 : 0.78) ? forward : -forward;
    const step = k === "scuttle" ? rand(7, 16)
      : k === "still" ? rand(2, 6)
      : k === "creep" ? rand(4, 11)
      : k === "hop" ? rand(8, 16)
      : groundish ? rand(14, 30)
      : rand(18, 40);
    let x = clamp(c.x + use * step, b.x0 + 1, b.x1 - 1);
    const ySpan = b.y1 - b.y0;
    const yStep = groundish ? ySpan * (k === "amble" ? 0.32 : 0.16) : rand(8, 14);
    let y = clamp(c.y + (groundish ? rand(-yStep, yStep) : rand(-yStep, yStep)), b.y0 + 0.6, b.y1 - 0.6);
    if (Math.hypot(x - c.x, y - c.y) < 4) {
      x = clamp(c.x - use * Math.max(step, 12), b.x0 + 1, b.x1 - 1);
    }
    return { x, y };
  }

  function beginLeg(c, ts) {
    const wp = pickWaypoint(c, boundsFor(c.def));
    c.tx = wp.x;
    c.ty = wp.y;
    c.mode = "cruise";
    const leg = c.profile.leg;
    c.modeUntil = ts + rand(leg[0], leg[1]) * 1000;
    c.legT = 0;
  }

  function beginPause(c, ts) {
    c.mode = "pause";
    const p = c.profile.pause;
    c.modeUntil = ts + rand(p[0], p[1]) * 1000;
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

  function place(c) {
    const w = view.w || window.innerWidth;
    const h = view.h || window.innerHeight;
    const px = (c.x / 100) * w - c.width / 2;
    const py = (c.y / 100) * h - c.height * 0.75 - ((c.hopLift || 0) / 100) * h;
    c.el.style.transform = "translate3d(" + px.toFixed(1) + "px," + py.toFixed(1) + "px,0)";
    const bucket = 20 + Math.round(c.y);
    if (c.zBucket !== bucket) {
      c.zBucket = bucket;
      c.el.style.zIndex = String(bucket);
    }
  }

  function updateFacing(c, dt) {
    if (c.facing === "none") {
      const drift = (c.kind === "float" || c.kind === "drift") ? Math.sin(c.wobble) * 5 : 0;
      c.bank += (drift - c.bank) * Math.min(1, dt * 2.5);
      c.faceEl.style.transform = "rotate(" + c.bank.toFixed(2) + "deg)";
      return;
    }
    const vx = Math.cos(c.heading);
    let desired = c.faceDir || 1;
    if (c.speed > 0.4 && vx > 0.18) desired = 1;
    else if (c.speed > 0.4 && vx < -0.18) desired = -1;

    if (c.facing === "lean") {
      const lean = desired * clamp(c.speed / Math.max(0.3, c.cruise), 0, 1) * 14;
      c.bank += (lean - c.bank) * Math.min(1, dt * 5);
      c.faceDir = desired;
      c.faceEl.style.transform = "rotate(" + c.bank.toFixed(2) + "deg)";
      return;
    }

    if (!c.turning && desired !== c.faceDir && c.speed > 0.4) {
      c.turning = true;
      c.turnFrom = c.faceDir || 1;
      c.turnT = 0;
      c.faceDir = desired;
    }
    if (c.turning) {
      c.turnT += dt;
      const u = Math.min(1, c.turnT / 0.36);
      const squash = Math.cos(u * Math.PI);
      c.faceScale = squash * c.turnFrom;
      c.bank = Math.sin(u * Math.PI) * 8 * c.turnFrom;
      if (u >= 1) {
        c.turning = false;
        c.faceScale = c.faceDir;
        c.bank = 0;
      }
    } else {
      let bankTarget = 0;
      if (c.kind === "walk" || c.kind === "amble" || c.kind === "hop" || c.kind === "scuttle") {
        const tempo = c.kind === "scuttle" ? 14 : c.kind === "hop" ? 11 : 8;
        bankTarget = Math.sin(c.wobble * tempo) * 3.4 * clamp(c.speed / Math.max(0.35, c.cruise), 0, 1);
      } else {
        bankTarget = clamp(-Math.sin(c.heading) * 12, -10, 10) * clamp(c.speed / Math.max(0.4, c.cruise), 0, 1);
      }
      c.bank += (bankTarget - c.bank) * Math.min(1, dt * 4);
      c.faceScale = c.faceDir || 1;
    }
    c.faceEl.style.transform = "scaleX(" + c.faceScale.toFixed(3) + ") rotate(" + c.bank.toFixed(2) + "deg)";
  }

  function syncGait(c) {
    if (reducedMotion() || c.leaving) return;
    const moving = c.speed > 0.5 && c.mode !== "pause";
    let dur = "";
    if (c.kind === "scuttle") dur = moving ? "0.36s" : "1.7s";
    else if (c.kind === "hop") dur = moving ? "0.34s" : "1.8s";
    else if (c.kind === "walk" || c.kind === "amble") dur = moving ? "0.7s" : "3.2s";
    else if (c.kind === "fly" || c.kind === "flutter") dur = moving ? "0.85s" : "2.6s";
    else if (c.kind === "swim" || c.kind === "glide" || c.kind === "pulse") dur = moving ? "2.1s" : "4.8s";
    if (c.gaitDur !== dur) {
      c.gaitDur = dur;
      c.inner.style.animationDuration = dur;
    }
  }

  function contain(c) {
    const b = boundsFor(c.def);
    let vx = Math.cos(c.heading);
    let vy = Math.sin(c.heading);
    let hit = false;
    if (c.x < b.x0) { c.x = b.x0; vx = Math.abs(vx) || 0.4; hit = true; }
    else if (c.x > b.x1) { c.x = b.x1; vx = -Math.abs(vx) || -0.4; hit = true; }
    if (c.y < b.y0) { c.y = b.y0; vy = Math.abs(vy) || 0.3; hit = true; }
    else if (c.y > b.y1) { c.y = b.y1; vy = -Math.abs(vy) || -0.3; hit = true; }
    if (hit) {
      c.heading = Math.atan2(vy, vx);
      if (c.mode === "cruise") beginLeg(c, performance.now());
    }
    const hud = hudBottomPct();
    if (c.y < hud && c.x > 17 && c.x < 83) {
      if (b.y1 > hud + 2) {
        c.y = Math.min(b.y1 - 0.4, Math.max(c.y, hud));
        if (Math.sin(c.heading) < 0.2) c.heading = Math.atan2(0.45, Math.cos(c.heading) || 0.2);
      } else {
        const dir = c.x < 50 ? -1 : 1;
        c.x = clamp(c.x + dir * 0.8, b.x0, b.x1);
        if (c.x > 16 && c.x < 84) c.x = dir < 0 ? Math.min(c.x, 15) : Math.max(c.x, 85);
      }
    }
  }

  function separate(list) {
    const w = view.w || 1;
    const h = view.h || 1;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (a.def.zone !== b.def.zone) continue;
        const pdx = ((a.x - b.x) / 100) * w;
        const pdy = ((a.y - b.y) / 100) * h;
        const d = Math.hypot(pdx, pdy) || 0.001;
        const minD = Math.min((a.width + b.width) * 0.55, w * 0.16);
        if (d >= minD) continue;
        const push = (minD - d) * 0.18;
        const nx = pdx / d;
        const ny = pdy / d;
        a.x += (nx * push / w) * 100;
        a.y += (ny * push / h) * 100;
        b.x -= (nx * push / w) * 100;
        b.y -= (ny * push / h) * 100;
      }
    }
  }

  function dropCreature(rec) {
    if (rec.el && rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);
    const i = session.creatures.indexOf(rec);
    if (i >= 0) session.creatures.splice(i, 1);
  }

  function advance(c, dt, ts) {
    const frozen = c.el.classList.contains("is-frozen");
    if (frozen && !c.leaving) {
      c.speed = 0;
      c.hopLift = 0;
      return;
    }

    if (c.leaving) {
      c.fleeAge += dt;
      if (c.fleeAge < 0.18) {
        c.speed = Math.max(0, c.speed * (1 - dt * 4.5));
      } else {
        const cap = c.fleeFade ? 9 : 34;
        const accel = c.fleeFade ? 5.5 : 18;
        c.speed = Math.min(cap, c.speed + accel * dt);
      }
      let targetH = c.fleeUp ? (-Math.PI / 2 + c.fleeDir * 0.5) : (c.fleeDir > 0 ? 0 : Math.PI);
      targetH += Math.sin(c.fleeAge * 2.1) * (c.fleeFade ? 0.2 : 0.32);
      const diff = wrapAngle(targetH - c.heading);
      c.heading = wrapAngle(c.heading + clamp(diff, -2.4 * dt, 2.4 * dt));
      c.x += Math.cos(c.heading) * c.speed * dt;
      c.y += Math.sin(c.heading) * c.speed * dt;
      if (!c.fleeFade) {
        const fade = c.fleeAge < 0.85 ? 1 : clamp(1 - (c.fleeAge - 0.85) / 1.15, 0, 1);
        c.el.style.opacity = String(fade);
      }
      const off = c.x < -12 || c.x > 112 || c.y < -16 || c.y > 110;
      const done = c.fleeFade ? c.fleeAge > 1.85 : (c.fleeAge > 0.55 && (off || c.fleeAge > 2.6));
      if (done) dropCreature(c);
      return;
    }

    if (c.mode === "pause") {
      if (ts >= c.modeUntil) beginLeg(c, ts);
    } else if (c.mode === "cruise") {
      const dist = Math.hypot(c.tx - c.x, c.ty - c.y);
      if (dist < 3 || ts >= c.modeUntil) {
        if (Math.random() < c.profile.pauseChance) beginPause(c, ts);
        else beginLeg(c, ts);
      }
    } else {
      beginLeg(c, ts);
    }

    c.legT += dt;
    c.wobble += dt * c.wobbleRate;

    let desired = Math.atan2(c.ty - c.y, c.tx - c.x);
    if (c.mode !== "pause") desired += Math.sin(c.wobble) * c.profile.curve;
    const turn = wrapAngle(desired - c.heading);
    const maxTurn = c.profile.turn * dt * (c.mode === "pause" ? 0.35 : 1);
    c.heading = wrapAngle(c.heading + clamp(turn, -maxTurn, maxTurn));

    let target = c.mode === "pause" ? 0 : c.cruise;
    if (reducedMotion()) target *= 0.12;
    if (session.loud) target *= 0.32;
    if (c.mode === "cruise") {
      const dist = Math.hypot(c.tx - c.x, c.ty - c.y);
      if (dist < 9) target *= clamp(dist / 9, 0.18, 1);
      const ramp = clamp(c.legT / 0.65, 0, 1);
      target *= 0.3 + 0.7 * (ramp * ramp * (3 - 2 * ramp));
    }
    if (c.kind === "scuttle" && c.mode === "cruise") {
      target *= 0.3 + 0.7 * Math.abs(Math.sin(c.wobble * 3.1));
    }
    if (c.kind === "hop" && c.mode === "cruise") {
      const u = (c.legT % 0.52) / 0.52;
      const arc = Math.sin(Math.min(1, u) * Math.PI);
      target *= 0.15 + arc;
      c.hopLift = arc * 3.1;
    } else if (c.kind === "pulse" && c.mode === "cruise") {
      const u = (c.legT % 1.7) / 1.7;
      const jet = u < 0.28 ? Math.sin((u / 0.28) * Math.PI) : 0;
      target *= 0.22 + jet;
      c.hopLift = jet * 1.3;
    } else if (c.kind === "flutter") {
      c.hopLift = Math.sin(c.wobble * 2.2) * 1.05;
    } else {
      c.hopLift += (0 - c.hopLift) * Math.min(1, dt * 4);
    }

    const rate = c.profile.accel * dt;
    if (c.speed < target) c.speed = Math.min(target, c.speed + rate);
    else c.speed = Math.max(target, c.speed - rate * 1.35);

    let vx = Math.cos(c.heading) * c.speed;
    let vy = Math.sin(c.heading) * c.speed;
    const grounded = c.kind === "walk" || c.kind === "scuttle" || c.kind === "creep" || c.kind === "still" || c.kind === "hop";
    if (grounded) vy *= 0.26;
    else {
      vy += Math.cos(c.wobble * 1.25) * c.profile.bob * Math.max(c.speed, 0.4) * 0.12;
      vx += Math.sin(c.wobble * 0.65) * c.profile.bob * Math.max(c.speed, 0.3) * 0.05;
    }
    c.x += vx * dt;
    c.y += vy * dt;
  }

  function stepCreatures(dtMs, ts) {
    if (!session.creatures.length) return;
    if (!view.w) measureView();
    const dt = Math.min(0.05, Math.max(0, dtMs) / 1000);
    const list = session.creatures.slice();
    for (let i = 0; i < list.length; i++) advance(list[i], dt, ts);
    const live = [];
    for (let i = 0; i < session.creatures.length; i++) {
      const c = session.creatures[i];
      if (!c.leaving && !c.el.classList.contains("is-frozen")) live.push(c);
    }
    separate(live);
    for (let i = 0; i < session.creatures.length; i++) {
      const c = session.creatures[i];
      if (!c.leaving && !c.el.classList.contains("is-frozen")) contain(c);
      updateFacing(c, dt);
      syncGait(c);
      place(c);
    }
  }

  function spawnOne() {
    if (session.timedOut) return false;
    if (session.creatures.filter((c) => !c.leaving).length >= MAX_ON_SCREEN) return false;
    const def = pickNext();
    if (!def) return false;
    const draw = QH.art[def.id];
    if (!draw) return false;

    let pos = zonePos(def);
    const width = def.size * pos.scale;
    const wPct = (width / (view.w || window.innerWidth)) * 100;
    for (let i = 0; i < 8; i++) {
      if (!overlaps(pos.x, pos.y, wPct)) break;
      pos = zonePos(def);
    }

    const el = document.createElement("div");
    el.className = "creature is-idle";
    const enterKind = def.enter || "side";
    let from = "from-fade";
    let flip = false;
    if (enterKind === "side") {
      from = pos.x < 50 ? "from-left" : "from-right";
      flip = from === "from-right";
    } else if (enterKind === "top") from = "from-top";
    else if (enterKind === "bottom") from = "from-bottom";

    const height = width * 0.88;
    el.style.width = width + "px";
    el.style.height = height + "px";

    const enter = document.createElement("div");
    enter.className = "creature-enter is-entering " + from;
    const face = document.createElement("div");
    face.className = "creature-face";
    const inner = document.createElement("div");
    inner.className = "creature-inner " + (def.idle || "bob");
    inner.innerHTML = draw();
    face.appendChild(inner);
    enter.appendChild(face);
    el.appendChild(enter);
    document.getElementById("creatures").appendChild(el);

    const kind = kindFor(def);
    const profile = PROFILES[kind] || PROFILES.walk;
    const facing = facingFor(def.id);
    const faceDir = flip ? -1 : 1;
    const sizeScale = clamp(140 / (def.size || 140), 0.55, 1.25);
    const now = performance.now();
    const rec = {
      id: def.id,
      def,
      el,
      inner,
      faceEl: face,
      enterEl: enter,
      x: pos.x,
      y: pos.y,
      width,
      height,
      kind,
      profile,
      facing,
      faceDir,
      faceScale: facing === "flip" ? faceDir : 1,
      heading: faceDir > 0 ? rand(-0.3, 0.3) : Math.PI + rand(-0.3, 0.3),
      speed: 0,
      cruise: profile.speed * sizeScale * (SPEED_TWEAK[def.id] || 1) * rand(0.88, 1.12) * (reducedMotion() ? 0.15 : 1),
      mode: "pause",
      modeUntil: now + rand(650, 1100),
      tx: pos.x,
      ty: pos.y,
      legT: 0,
      wobble: rand(0, Math.PI * 2),
      wobbleRate: rand(0.75, 1.25),
      bank: 0,
      turning: false,
      turnT: 0,
      turnFrom: faceDir,
      hopLift: 0,
      leaving: false,
      fleeAge: 0,
      gaitDur: "",
      zBucket: -1,
    };
    session.creatures.push(rec);
    session.spawned += 1;
    QH.markSpotted(session.themeId, def.id);
    updateFacing(rec, 0.016);
    place(rec);

    window.setTimeout(() => {
      if (!rec.enterEl) return;
      rec.enterEl.classList.remove("is-entering", "from-left", "from-right", "from-top", "from-bottom", "from-fade");
    }, 1100);
    return true;
  }

  function fleeOne(rec) {
    if (!rec || rec.leaving) return;
    rec.leaving = true;
    rec.fleeAge = 0;
    rec.mode = "flee";
    const theme = QH.THEMES[session.themeId];
    rec.fleeFade = !!(theme && theme.flee === "fade");
    const outward = rec.x < 50 ? -1 : 1;
    const travel = Math.cos(rec.heading) >= 0 ? 1 : -1;
    rec.fleeDir = Math.abs(Math.cos(rec.heading)) > 0.25 ? travel : outward;
    rec.fleeUp = rec.def.zone === "sky" || rec.kind === "fly" || rec.kind === "flutter" || rec.kind === "float";
    rec.el.classList.remove("is-idle");
    rec.el.classList.add(rec.fleeFade ? "is-fading" : "is-fleeing");
  }

  function fleeSome(n) {
    const live = session.creatures.filter((c) => !c.leaving);
    for (let i = 0; i < n && live.length; i++) {
      const idx = Math.floor(Math.random() * live.length);
      fleeOne(live.splice(idx, 1)[0]);
    }
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
    if (session.timedOut) return "statusTimesUp";
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

  function durationMsFromState() {
    const st = QH.state || {};
    const mode = st.durationMode || "15";
    if (mode === "unlimited") return 0;
    if (mode === "custom") {
      const n = Number(st.customSessionMinutes);
      return Math.max(1, Math.min(180, isFinite(n) && n > 0 ? n : 15)) * 60 * 1000;
    }
    const n = Number(mode);
    return (isFinite(n) && n > 0 ? n : 15) * 60 * 1000;
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (h > 0) return h + ":" + pad(m) + ":" + pad(s);
    return pad(m) + ":" + pad(s);
  }

  function syncTimerUI() {
    const pill = document.getElementById("timer-pill");
    const digits = document.getElementById("timer-digits");
    if (!pill || !digits) return;
    const timed = session.active && session.durationMs > 0;
    pill.hidden = !timed;
    pill.classList.toggle("is-on", timed);
    const resetBtn = document.getElementById("btn-reset-time");
    if (resetBtn) resetBtn.disabled = !timed;
    if (!timed) {
      pill.classList.remove("is-warn", "is-urgent");
      return;
    }
    digits.textContent = formatTime(session.remainingMs);
    const sec = session.remainingMs / 1000;
    pill.classList.toggle("is-urgent", session.timedOut || sec <= 10);
    pill.classList.toggle("is-warn", !session.timedOut && sec > 10 && sec <= 60);
    const addBtn = document.getElementById("menu-add5");
    if (addBtn) addBtn.hidden = !timed;
  }

  function onTimesUp() {
    session.timedOut = true;
    session.remainingMs = 0;
    syncTimerUI();
    if (typeof QH.onTimesUp === "function") QH.onTimesUp(session.spawned);
  }

  function addMinutes(mins) {
    const extra = Math.max(1, Number(mins) || 5) * 60 * 1000;
    if (session.durationMs <= 0) {
      session.durationMs = extra;
    } else {
      session.durationMs += extra;
    }
    session.remainingMs = (session.remainingMs || 0) + extra;
    const wasOut = session.timedOut;
    session.timedOut = false;
    if (wasOut) {
      session.nextAt = session.quietMs + Math.min(intervalMs(), 4000);
    }
    syncTimerUI();
  }

  function resetTime() {
    if (!session.active || !(session.chosenMs > 0)) return false;
    const wasOut = session.timedOut;
    session.durationMs = session.chosenMs;
    session.remainingMs = session.chosenMs;
    session.timedOut = false;
    if (wasOut) session.nextAt = session.quietMs + Math.min(intervalMs(), 4000);
    syncTimerUI();
    return true;
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

    if (session.active && session.durationMs > 0 && !session.timedOut && !session.timerPaused) {
      session.remainingMs -= dt;
      if (session.remainingMs <= 0) onTimesUp();
      else syncTimerUI();
    } else if (session.active) {
      syncTimerUI();
    }

    if (!session.active || session.pausedForModal) {
      updateHud(level, goal, session.active ? (session.timedOut ? "statusTimesUp" : "statusListening") : "statusListening", over ? "warn" : "good");
      return;
    }

    if (session.timedOut) {
      stepCreatures(dt, ts);
      updateHud(level, goal, "statusTimesUp", session.loud ? "loud" : over ? "warn" : "good");
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

    stepCreatures(dt, ts);

    const live = session.creatures.filter((c) => !c.leaving).length;
    const canSpawn = !!pickNext() && live < MAX_ON_SCREEN;
    const kind = session.loud ? "loud" : over ? "warn" : "good";
    const key = statusFor(level, goal, over && !session.loud, live, canSpawn);
    updateHud(level, goal, key, kind);
  }

  function start(themeId) {
    stop(false);
    measureView();
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
    session.chosenMs = durationMsFromState();
    session.durationMs = session.chosenMs;
    session.remainingMs = session.chosenMs;
    session.timedOut = false;
    session.timerPaused = false;
    document.getElementById("creatures").innerHTML = "";
    document.getElementById("scene").classList.remove("is-loud", "is-clearing");
    QH.paintTheme(session.themeId);
    syncTimerUI();
    if (!session.raf) session.raf = requestAnimationFrame(loop);
  }

  function stop(stopLoop) {
    session.active = false;
    session.loud = false;
    session.timedOut = false;
    session.durationMs = 0;
    session.chosenMs = 0;
    session.remainingMs = 0;
    session.timerPaused = false;
    syncTimerUI();
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
    formatTime,
    syncTimerUI,
    addMinutes,
    resetTime,
    durationMsFromState,
  };
})(window);
