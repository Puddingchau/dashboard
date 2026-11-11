/* Theme rosters and original layered habitats. */
(function (global) {
  const QH = (global.QH = global.QH || {});
  const { svg, c, e, r, p, g } = {
    get svg() { return QH._svg.svg; },
    get c() { return QH._svg.c; },
    get e() { return QH._svg.e; },
    get r() { return QH._svg.r; },
    get p() { return QH._svg.p; },
    get g() { return QH._svg.g; },
  };

  const scene = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;

  function animal(id, opts) {
    return Object.assign(
      {
        id,
        rare: false,
        zone: "ground",
        size: 150,
        idle: "bob",
        enter: "side",
        max: 2,
      },
      opts || {}
    );
  }

  const THEMES = {
    savanna: {
      id: "savanna",
      overlay: "haze",
      particles: "dust",
      animals: [
        animal("zebra", { size: 170 }),
        animal("giraffe", { size: 150, idle: "sway" }),
        animal("meerkat", { size: 90 }),
        animal("hippo", { size: 190, zone: "mid" }),
        animal("rhino", { size: 180 }),
        animal("gazelle", { size: 140 }),
        animal("ostrich", { size: 140, idle: "sway" }),
        animal("warthog", { size: 140 }),
        animal("flamingo", { size: 120, idle: "sway", zone: "mid" }),
        animal("crocodile", { size: 200, zone: "mid", idle: "sway" }),
        animal("buffalo", { size: 180 }),
        animal("baboon", { size: 120 }),
        animal("lion", { rare: true, size: 180, max: 1 }),
        animal("leopard", { rare: true, size: 170, max: 1 }),
        animal("elephant", { rare: true, size: 230, max: 1, idle: "sway" }),
      ],
    },
    reef: {
      id: "reef",
      overlay: "murk",
      particles: "bubbles",
      animals: [
        animal("clownfish", { zone: "water", size: 90, idle: "swim", enter: "side" }),
        animal("seahorse", { zone: "water", size: 80, idle: "bob", enter: "fade" }),
        animal("turtle", { zone: "water", size: 150, idle: "swim" }),
        animal("angelfish", { zone: "water", size: 90, idle: "swim" }),
        animal("starfish", { zone: "ground", size: 70, idle: "sway", enter: "fade" }),
        animal("crab", { zone: "ground", size: 90, idle: "bob" }),
        animal("stingray", { zone: "water", size: 180, idle: "swim" }),
        animal("octopus", { zone: "water", size: 140, idle: "bob", enter: "fade" }),
        animal("butterflyfish", { zone: "water", size: 90, idle: "swim" }),
        animal("tang", { zone: "water", size: 90, idle: "swim" }),
        animal("eel", { zone: "water", size: 180, idle: "swim" }),
        animal("reefshark", { zone: "water", size: 200, idle: "swim" }),
        animal("hammerhead", { rare: true, zone: "water", size: 220, idle: "swim", max: 1 }),
        animal("manta", { rare: true, zone: "water", size: 240, idle: "swim", max: 1 }),
        animal("whaleshark", { rare: true, zone: "water", size: 280, idle: "swim", max: 1 }),
      ],
    },
    space: {
      id: "space",
      overlay: "static",
      particles: "stars",
      flee: "fade",
      animals: [
        animal("satellite", { zone: "sky", size: 130, idle: "float", enter: "fade" }),
        animal("comet", { zone: "sky", size: 150, idle: "float", enter: "side" }),
        animal("astronaut", { zone: "sky", size: 110, idle: "float", enter: "fade" }),
        animal("station", { zone: "sky", size: 200, idle: "float", enter: "fade" }),
        animal("saturn", { zone: "sky", size: 150, idle: "float", enter: "fade" }),
        animal("rocket", { zone: "sky", size: 90, idle: "float", enter: "bottom" }),
        animal("rover", { zone: "mid", size: 120, idle: "bob", enter: "side" }),
        animal("alien", { zone: "sky", size: 100, idle: "float", enter: "fade" }),
        animal("probe", { zone: "sky", size: 110, idle: "float", enter: "fade" }),
        animal("moon", { zone: "sky", size: 120, idle: "float", enter: "fade" }),
        animal("cluster", { zone: "sky", size: 100, idle: "float", enter: "fade" }),
        animal("galaxy", { rare: true, zone: "sky", size: 180, idle: "float", enter: "fade", max: 1 }),
        animal("blackhole", { rare: true, zone: "sky", size: 170, idle: "float", enter: "fade", max: 1 }),
        animal("pulsar", { rare: true, zone: "sky", size: 140, idle: "float", enter: "fade", max: 1 }),
        animal("nebula", { zone: "sky", size: 150, idle: "float", enter: "fade", max: 1 }),
      ],
    },
    prehistoric: {
      id: "prehistoric",
      overlay: "mist",
      particles: "none",
      animals: [
        animal("triceratops", { size: 200 }),
        animal("raptor", { size: 150 }),
        animal("mammal", { size: 80 }),
        animal("lizard", { size: 110, idle: "sway" }),
        animal("featherraptor", { size: 150, idle: "sway" }),
        animal("ankylosaurus", { size: 190 }),
        animal("stegosaurus", { size: 200 }),
        animal("pteranodon", { zone: "sky", size: 180, idle: "flap", enter: "top" }),
        animal("parasaurolophus", { size: 180, idle: "sway" }),
        animal("archaeopteryx", { zone: "sky", size: 110, idle: "flap", enter: "side" }),
        animal("diplodocus_small", { size: 180, idle: "sway" }),
        animal("trex", { rare: true, size: 220, max: 1, idle: "sway" }),
        animal("quetzal", { rare: true, zone: "sky", size: 260, idle: "flap", enter: "top", max: 1 }),
        animal("sauropod", { rare: true, size: 280, max: 1, idle: "sway" }),
      ],
    },
    forest: {
      id: "forest",
      overlay: "fog",
      particles: "none",
      animals: [
        animal("squirrel", { size: 100 }),
        animal("fox", { size: 150 }),
        animal("deer", { size: 160, idle: "sway" }),
        animal("chipmunk", { size: 90 }),
        animal("robin", { zone: "sky", size: 80, idle: "flap", enter: "side" }),
        animal("hedgehog", { size: 100, enter: "fade" }),
        animal("raccoon", { size: 140 }),
        animal("rabbit", { size: 100 }),
        animal("owl", { zone: "sky", size: 100, idle: "sway", enter: "fade" }),
        animal("woodpecker", { zone: "mid", size: 90, idle: "bob", enter: "fade" }),
        animal("badger", { size: 140 }),
        animal("boar", { size: 160 }),
        animal("wolf", { rare: true, size: 170, max: 1 }),
        animal("bear", { rare: true, size: 190, max: 1 }),
        animal("moose", { rare: true, size: 220, max: 1, idle: "sway" }),
      ],
    },
    jungle: {
      id: "jungle",
      overlay: "rain",
      particles: "none",
      animals: [
        animal("sloth", { zone: "mid", size: 140, idle: "sway", enter: "fade" }),
        animal("toucan", { zone: "sky", size: 110, idle: "flap", enter: "side" }),
        animal("dartfrog", { size: 70, enter: "fade" }),
        animal("capuchin", { zone: "mid", size: 120, idle: "sway" }),
        animal("macaw", { zone: "sky", size: 110, idle: "flap", enter: "side" }),
        animal("orangutan", { zone: "mid", size: 160, idle: "sway" }),
        animal("tapir", { size: 180 }),
        animal("butterfly", { zone: "sky", size: 90, idle: "flap", enter: "fade" }),
        animal("python", { zone: "mid", size: 200, idle: "sway", enter: "fade" }),
        animal("chameleon", { zone: "mid", size: 120, idle: "sway", enter: "fade" }),
        animal("capybara", { size: 170 }),
        animal("hornbill", { zone: "sky", size: 120, idle: "flap" }),
        animal("jaguar", { rare: true, size: 180, max: 1 }),
        animal("gorilla", { rare: true, size: 180, max: 1, idle: "sway" }),
        animal("tiger", { rare: true, size: 190, max: 1 }),
      ],
    },
    arctic: {
      id: "arctic",
      overlay: "whiteout",
      particles: "snow",
      animals: [
        animal("seal", { zone: "mid", size: 140, idle: "bob" }),
        animal("lemming", { size: 70 }),
        animal("puffin", { zone: "sky", size: 90, idle: "flap", enter: "side" }),
        animal("arcticfox", { size: 140 }),
        animal("caribou", { size: 170, idle: "sway" }),
        animal("walrus", { zone: "mid", size: 180, idle: "bob" }),
        animal("beluga", { zone: "water", size: 200, idle: "swim" }),
        animal("snowyowl", { zone: "sky", size: 110, idle: "flap", enter: "side" }),
        animal("muskox", { size: 190, idle: "sway" }),
        animal("arctichare", { size: 100 }),
        animal("sealpup", { size: 110, idle: "bob", enter: "fade" }),
        animal("polarbear", { rare: true, size: 200, max: 1 }),
        animal("narwhal", { rare: true, zone: "water", size: 230, idle: "swim", max: 1 }),
        animal("bowhead", { rare: true, zone: "water", size: 280, idle: "swim", max: 1 }),
      ],
    },
    pumpkin: {
      id: "pumpkin",
      overlay: "gloom",
      particles: "leaves",
      animals: [
        animal("pumpkin", { size: 90, idle: "sway", enter: "fade" }),
        animal("jack", { size: 90, idle: "bob", enter: "fade" }),
        animal("scarecrow", { size: 140, idle: "sway", enter: "fade" }),
        animal("ghost", { zone: "sky", size: 110, idle: "float", enter: "fade" }),
        animal("blackcat", { size: 130 }),
        animal("bat", { zone: "sky", size: 120, idle: "flap", enter: "top" }),
        animal("crow", { zone: "sky", size: 90, idle: "flap", enter: "side" }),
        animal("mummy", { size: 130, idle: "sway" }),
        animal("hatowl", { zone: "mid", size: 100, idle: "sway", enter: "fade" }),
        animal("spider", { zone: "mid", size: 80, idle: "bob", enter: "fade" }),
        animal("franken", { size: 140, idle: "sway" }),
        animal("vampire", { rare: true, size: 140, max: 1, idle: "sway" }),
        animal("dragon", { rare: true, size: 160, max: 1, idle: "bob" }),
        animal("howlwolf", { rare: true, size: 170, max: 1 }),
      ],
    },
  };

  const ORDER = [
    "savanna",
    "reef",
    "space",
    "prehistoric",
    "forest",
    "jungle",
    "arctic",
    "pumpkin",
  ];

  /* ---------- Background painters ---------- */
  function acacia(x, y, s) {
    const t = `translate(${x} ${y}) scale(${s})`;
    return g(
      `<path d="M0 -2 l0 -96" stroke="#5a3a18" stroke-width="11" fill="none" stroke-linecap="round"/>` +
        `<path d="M0 -70 q-18 -28 -40 -36" stroke="#5a3a18" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M0 -62 q16 -22 34 -28" stroke="#5a3a18" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        p("M0 -88 q-86 -28 -98 22 q62 -12 98 -10 q52 6 100 16 q-12 -48 -100 -28z", "#5e8c32") +
        p("M-8 -104 q-48 -18 -54 10 q28 -2 54 0 q26 6 50 10 q-6 -24 -50 -20z", "#6ea03c") +
        p("M-20 -78 q-30 -8 -28 10 q16 -2 28 0 q14 4 26 6 q-2 -14 -26 -16z", "#7ab048"),
      `transform="${t}"`
    );
  }

  function grassTufts(y, color, count, gap) {
    let s = "";
    const n = count || 32;
    const g0 = gap || 52;
    for (let i = 0; i < n; i++) {
      const x = i * g0 + (i % 3) * 8 - 20;
      const h = 26 + (i % 6) * 9;
      s += p(`M${x} ${y} q7 -${h} 14 0 q6 -${Math.round(h * 0.72)} 12 0 q5 -${Math.round(h * 0.5)} 10 0`, color);
    }
    return s;
  }

  function stars(count, seed, yMax) {
    let s = "";
    let a = seed || 7;
    const ymax = yMax == null ? 800 : yMax;
    for (let i = 0; i < count; i++) {
      a = (a * 16807) % 2147483647;
      const x = a % 1600;
      a = (a * 16807) % 2147483647;
      const y = a % ymax;
      a = (a * 16807) % 2147483647;
      const r0 = 0.8 + (a % 28) / 12;
      const o = 0.35 + (a % 55) / 100;
      s += c(x, y, r0, `rgba(255,255,255,${o})`);
    }
    return s;
  }

  function bush(x, y, s, dark, mid, lite) {
    return g(
      e(0, 8, 36, 16, dark) + e(-22, 2, 20, 14, mid) + e(22, 2, 22, 14, mid) + e(0, -8, 18, 14, lite),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function seagrassBlade(x, y, h, color, lean) {
    const l = lean || 0;
    return `<path d="M${x} ${y} q${6 + l} -${h * 0.55} ${l} -${h} q${8 - l} ${h * 0.4} ${4 + l} ${h}" fill="${color}"/>`;
  }

  function seagrassCluster(x, y, scale) {
    const s = scale || 1;
    const h = (n) => Math.round(n * s);
    return (
      seagrassBlade(x - 16 * s, y, h(92), "#2e7a4a", -6) +
      seagrassBlade(x - 6 * s, y, h(118), "#3a8e58", -2) +
      seagrassBlade(x + 4 * s, y, h(104), "#2a7040", 3) +
      seagrassBlade(x + 14 * s, y, h(86), "#4aa068", 7) +
      seagrassBlade(x + 22 * s, y, h(70), "#357848", 10)
    );
  }

  function coralMound(x, y, s, color, lite) {
    return g(
      e(0, 8, 22, 16, color) +
        e(-16, 10, 12, 14, color) +
        e(16, 10, 13, 14, color) +
        e(0, -6, 12, 16, lite) +
        e(-10, 0, 8, 10, lite) +
        e(11, 2, 8, 10, color) +
        c(-8, -2, 2.2, "rgba(255,255,255,0.28)") +
        c(6, 4, 1.8, "rgba(255,255,255,0.22)"),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function coralTubes(x, y, s, color, lite) {
    const tube = (dx, h, w, col) =>
      `<path d="M${dx} 0 v-${h} a${w} ${w} 0 0 1 ${w * 2} 0 v${h}z" fill="${col}"/>`;
    return g(
      tube(-16, 46, 6, color) +
        tube(-2, 62, 7, lite) +
        tube(14, 40, 6, color) +
        tube(26, 28, 5, lite),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function coralBranch(x, y, s, color, lite) {
    return g(
      p("M0 0 q-6 -36 0 -52 q8 8 4 20 q16 -24 8 -40 q10 18 2 36 q14 -10 10 4 q-8 16 -16 20 q8 12 2 32z", color) +
        p("M2 -8 q-4 -24 2 -36 q6 8 2 16 q10 -16 6 -28 q8 14 0 26 q10 -6 8 4 q-6 12 -12 16z", lite),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function rock(x, y, rx, ry, col) {
    return e(x, y, rx, ry, col || "#d4c09a");
  }

  function distantFish(x, y, s, color, flip) {
    const body =
      e(0, 0, 16, 8, color) +
      p("M-16 0 l-10 -7 2 7 -2 7z", color) +
      p("M4 -8 l5 -7 3 8z", color) +
      c(8, -2, 1.6, "#1a2a40");
    const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
    return g(body, `transform="${t}" opacity="0.45"`);
  }

  function distantTurtle(x, y, s) {
    return g(
      e(0, 2, 16, 10, "#4a8a62") +
        e(0, 2, 11, 6, "#6aaa70") +
        e(16, -2, 6, 4.5, "#c8d49a") +
        e(-14, 4, 5, 3, "#c8d49a") +
        e(10, 10, 4, 2.5, "#c8d49a"),
      `transform="translate(${x} ${y}) scale(${s})" opacity="0.4"`
    );
  }

  function pine(x, y, s, dark, mid) {
    return g(
      r(-4, 70, 8, 22, 2, "#5a3a20") +
        p("M0 0 l-22 38 44 0z", dark) +
        p("M0 18 l-28 40 56 0z", mid) +
        p("M0 40 l-34 42 68 0z", dark),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function cycad(x, y, s) {
    return g(
      p("M0 0 q-28 -80 0 -92 q28 12 0 92", "#3e7a34") +
        p("M0 0 q28 -80 0 -92 q-28 12 0 92", "#4e8c40") +
        p("M0 0 q-12 -90 0 -100 q12 10 0 100", "#5a9a48") +
        p("M0 0 q-40 -50 -8 -54 q20 16 8 54", "#3e7a34") +
        p("M0 0 q40 -50 8 -54 q-20 16 -8 54", "#4e8c40") +
        r(-5, -8, 10, 28, 4, "#6a5a30"),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function iceFloe(x, y, s, flip) {
    return g(
      p("M0 30 l28 -44 40 8 24 -28 36 64z", "#f4f8fc") +
        p("M0 30 l128 0 -36 -28 -40 6 -24 -20z", "#d4e4f2") +
        p("M20 18 l20 -20 16 4 8 -10 22 26z", "#ffffff"),
      `transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"`
    );
  }

  function pumpkinDeco(x, y, s, tone) {
    const body = tone === "light" ? "#f0c878" : tone === "deep" ? "#d06020" : "#e87828";
    const rib = tone === "light" ? "#e0b060" : "#c85818";
    return g(
      e(0, 8, 16, 12, body) +
        e(-9, 8, 6, 11, rib) +
        e(9, 8, 6, 11, rib) +
        r(-3, -6, 6, 8, 2, "#4a8a30") +
        p("M2 -4 q10 -8 4 6z", "#3a7a28"),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  function cropLeaf(x, y, s) {
    return g(
      e(0, 6, 22, 12, "#3a7a30") +
        e(-14, 4, 12, 9, "#4a8e3c") +
        e(14, 4, 13, 9, "#2e6a28") +
        e(-4, -2, 10, 8, "#5aa048") +
        e(8, -1, 8, 7, "#3e8234"),
      `transform="translate(${x} ${y}) scale(${s})"`
    );
  }

  const painters = {
    savanna() {
      const far =
        c(1240, 168, 118, "#f8e8b0") +
        c(1240, 168, 88, "#fff6cc") +
        c(1240, 168, 54, "#fffce8") +
        p("M0 400 L200 290 380 380 580 240 780 360 1020 210 1240 340 1460 200 1600 300 1600 520 0 520z", "#e0b07a") +
        p("M0 460 L240 360 460 450 720 330 980 440 1260 310 1600 420 1600 580 0 580z", "#d49a62") +
        p("M0 510 L180 470 400 530 700 480 1100 540 1600 500 1600 620 0 620z", "#c88852");
      const mid =
        p("M0 540 C220 490 480 580 760 520 C1040 460 1280 560 1600 500 L1600 900 0 900z", "#d0cc62") +
        p("M0 620 C300 580 620 670 920 610 C1220 550 1420 650 1600 610 L1600 900 0 900z", "#c0bc52") +
        acacia(240, 630, 1.15) +
        acacia(520, 600, 0.55) +
        acacia(1120, 590, 0.92) +
        acacia(1420, 650, 0.68) +
        bush(700, 640, 1, "#6a8a30", "#7a9a38", "#8aaa40") +
        bush(980, 660, 0.8, "#6a8a30", "#7a9a38", "#8aaa40") +
        e(400, 700, 110, 28, "#7a9aaa") +
        e(400, 708, 80, 16, "#8ab0b8") +
        e(400, 716, 50, 8, "#9ac0c4");
      const near =
        p("M0 740 C240 710 520 790 820 750 C1120 710 1380 780 1600 740 L1600 900 0 900z", "#9aaa3a") +
        p("M0 820 C300 790 600 860 900 820 C1200 780 1400 850 1600 810 L1600 900 0 900z", "#8a9a30") +
        bush(160, 800, 0.7, "#5a7a28", "#6a8a30", "#7a9a38") +
        bush(880, 790, 0.55, "#5a7a28", "#6a8a30", "#7a9a38") +
        p("M1280 860 q8 -40 16 0 q8 -32 14 0", "#6a8a28") +
        p("M1320 850 q8 -48 16 0 q8 -30 12 0", "#7a9a30");
      const fg = grassTufts(900, "#5a7a24", 36, 48) + grassTufts(882, "#6a8a2c", 34, 50);
      return { far, mid, near, decor: "", fg };
    },

    reef() {
      const far =
        stars(110, 21, 620) +
        distantFish(240, 180, 0.9, "#4aa0c8", false) +
        distantFish(980, 140, 0.7, "#e8c050", true) +
        distantFish(1320, 260, 1.05, "#7ab0d8", false) +
        distantFish(560, 300, 0.6, "#f0a060", true) +
        distantTurtle(180, 360, 1.1) +
        distantFish(1500, 200, 0.8, "#c070a0", true) +
        g(
          e(0, 0, 28, 10, "#5a8aaa") + p("M-28 0 l-16 -6 4 6 -4 6z", "#5a8aaa") + p("M0 -10 l8 -16 4 14z", "#5a8aaa"),
          'transform="translate(720 220) scale(1.2)" opacity="0.32"'
        );
      const mid =
        seagrassCluster(80, 760, 0.55) +
        seagrassCluster(1500, 750, 0.5) +
        distantFish(400, 430, 0.85, "#f0d070", false) +
        distantFish(1100, 480, 0.75, "#3a9ad0", true);
      const near =
        p("M0 690 C180 650 360 720 560 680 C780 636 1000 720 1240 670 C1420 636 1540 680 1600 660 L1600 900 0 900z", "#e8d2a4") +
        p("M0 770 C260 740 520 820 800 770 C1080 720 1320 810 1600 760 L1600 900 0 900z", "#e0c48c") +
        p("M0 840 C300 820 700 880 1100 840 C1400 816 1520 860 1600 840 L1600 900 0 900z", "#d8ba7c") +
        // seagrass clusters along the sand
        seagrassCluster(70, 800, 0.95) +
        seagrassCluster(200, 820, 0.7) +
        seagrassCluster(430, 810, 0.85) +
        seagrassCluster(620, 835, 0.55) +
        seagrassCluster(860, 800, 0.9) +
        seagrassCluster(1080, 825, 0.7) +
        seagrassCluster(1280, 805, 1) +
        seagrassCluster(1480, 790, 0.8) +
        // coral gardens sitting on the sand
        coralMound(150, 830, 1.15, "#e890b4", "#f4b0cc") +
        coralMound(300, 850, 0.8, "#c080e0", "#d8a8f0") +
        coralTubes(250, 840, 0.9, "#3a9a68", "#5aba80") +
        coralBranch(480, 850, 1.05, "#c070d0", "#d898e8") +
        coralMound(540, 860, 0.7, "#f08070", "#f4a090") +
        coralTubes(740, 850, 0.75, "#2e8a6a", "#4aaa88") +
        coralMound(790, 855, 0.95, "#e890b4", "#f4b0cc") +
        coralBranch(980, 845, 0.85, "#d07098", "#e898b0") +
        coralMound(1040, 860, 0.7, "#c080e0", "#d8a8f0") +
        coralTubes(1180, 835, 1, "#3a9a68", "#5aba80") +
        coralMound(1360, 850, 1.1, "#f0a050", "#f8c070") +
        coralMound(1520, 840, 0.85, "#70c0c8", "#98d8dc") +
        coralBranch(1420, 855, 0.7, "#c080e0", "#d8a8f0") +
        // rocks and a little starfish decoration (not a character)
        rock(360, 870, 16, 8, "#d0b080") +
        rock(400, 876, 10, 6, "#c0a070") +
        rock(900, 880, 14, 7, "#d8b890") +
        rock(1220, 875, 18, 8, "#c8a878") +
        p("M680 872 l4 10 11 1 -8 7 3 11 -10 -6 -10 6 3-11 -8-7 11-1z", "#e07060");
      const fg =
        seagrassCluster(20, 900, 1.25) +
        seagrassCluster(110, 910, 0.9) +
        seagrassCluster(1480, 905, 1.15) +
        seagrassCluster(1580, 900, 0.95) +
        coralMound(40, 910, 0.7, "#e890b4", "#f4b0cc") +
        coralMound(1560, 915, 0.65, "#c080e0", "#d8a8f0");
      return { far, mid, near, decor: "", fg };
    },

    space() {
      const far =
        stars(140, 13, 900) +
        `<defs>
          <radialGradient id="neb1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(160,90,210,0.38)"/><stop offset="100%" stop-color="rgba(160,90,210,0)"/></radialGradient>
          <radialGradient id="neb2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(50,100,200,0.32)"/><stop offset="100%" stop-color="rgba(50,100,200,0)"/></radialGradient>
          <radialGradient id="neb3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(200,80,140,0.22)"/><stop offset="100%" stop-color="rgba(200,80,140,0)"/></radialGradient>
          <linearGradient id="mw" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0%" stop-color="rgba(200,210,255,0)"/><stop offset="40%" stop-color="rgba(200,210,255,0.16)"/><stop offset="100%" stop-color="rgba(200,210,255,0)"/></linearGradient>
        </defs>` +
        e(800, 420, 700, 80, "url(#mw)") +
        e(320, 210, 300, 170, "url(#neb1)") +
        e(1220, 640, 320, 180, "url(#neb2)") +
        e(940, 160, 240, 130, "url(#neb3)") +
        e(200, 700, 180, 90, "url(#neb1)");
      const mid =
        // distant soft planets (scenic, not the collectible saturn/moon)
        e(240, 140, 36, 36, "#c4a080") +
        e(228, 128, 36, 16, "#d4b498") +
        e(1380, 280, 22, 22, "#8aa0d0") +
        e(1480, 120, 8, 8, "#e8d0a0") +
        c(600, 80, 2.4, "#fff8d0") +
        c(900, 240, 2, "#fff") +
        c(1100, 80, 2.6, "#fff");
      return { far, mid, near: "", decor: "", fg: "" };
    },

    prehistoric() {
      const far =
        p("M0 340 L160 230 300 320 500 170 720 290 960 150 1180 270 1380 140 1600 240 1600 500 0 500z", "#9ab0b8") +
        p("M0 390 L200 290 420 380 640 240 880 360 1140 220 1400 330 1600 250 1600 520 0 520z", "#8aa0a8") +
        p("M0 450 L300 400 700 470 1100 390 1600 450 1600 560 0 560z", "#7a949c") +
        Array.from({ length: 36 }, (_, i) => {
          const x = i * 46 + 8;
          const h = 54 + (i % 5) * 22;
          return p(`M${x} 500 l12 -${h} 12 ${h}z`, i % 2 ? "#4e6e5c" : "#5a7a68");
        }).join("");
      const mid =
        p("M0 510 C400 470 760 560 1120 500 C1320 470 1480 520 1600 500 L1600 720 0 720z", "#8aaa72") +
        // wide pale lake with a small island
        e(920, 560, 300, 48, "#7aa0b0") +
        e(920, 568, 230, 30, "#8ab4c0") +
        e(920, 574, 140, 16, "#9cc4cc") +
        e(900, 558, 50, 14, "#8aaa72") +
        pine(260, 300, 1.15, "#2a4e32", "#346040") +
        pine(1260, 360, 0.85, "#2a4e32", "#346040") +
        pine(1480, 380, 0.55, "#2e5638", "#3a6844");
      const near =
        p("M0 670 C280 640 600 720 900 680 C1200 640 1400 710 1600 670 L1600 900 0 900z", "#8a9a58") +
        p("M0 780 C250 750 550 830 850 790 C1150 750 1400 820 1600 780 L1600 900 0 900z", "#7a8a48") +
        cycad(150, 820, 1) +
        cycad(330, 850, 0.65) +
        cycad(1180, 830, 0.8) +
        cycad(1460, 840, 1.05) +
        // scattered fern tufts
        p("M520 820 q-18 -50 0 -58 q18 8 0 58", "#4a7a38") +
        p("M520 820 q18 -50 0 -58 q-18 8 0 58", "#5a8a40") +
        p("M700 850 q-20 -56 0 -64 q20 10 0 64", "#4a7a38") +
        p("M700 850 q20 -56 0 -64 q-20 10 0 64", "#5a8a40") +
        p("M1020 840 q-16 -46 0 -54 q16 8 0 54", "#4a7a38") +
        p("M1020 840 q16 -46 0 -54 q-16 8 0 54", "#5a8a40") +
        // fallen log
        e(620, 860, 90, 18, "#7a4a24") +
        e(620, 856, 90, 8, "#8a5a30") +
        e(550, 860, 7, 9, "#5a3418") +
        e(690, 860, 6, 8, "#5a3418");
      const fg = grassTufts(900, "#546428", 34, 50) + grassTufts(884, "#657436", 30, 54);
      return { far, mid, near, decor: "", fg };
    },

    forest() {
      const far =
        p("M0 380 C200 320 420 400 700 340 C1000 280 1300 360 1600 310 L1600 600 0 600z", "#6a9a60") +
        Array.from({ length: 22 }, (_, i) => {
          const x = i * 78 + 10;
          const h = 90 + (i % 4) * 30;
          return p(`M${x} 540 l22 -${h} 22 ${h}z`, i % 2 ? "#2e6a38" : "#3a7a44");
        }).join("");
      const mid =
        p("M0 540 C300 500 600 590 900 540 C1200 490 1400 580 1600 530 L1600 900 0 900z", "#5a8a48") +
        r(150, 380, 26, 420, 8, "#7a4a24") +
        r(400, 330, 32, 480, 8, "#6a3e1e") +
        r(720, 400, 22, 400, 8, "#7a4a24") +
        r(980, 350, 30, 460, 8, "#6a3e1e") +
        r(1280, 310, 34, 500, 8, "#7a4a24") +
        r(1500, 380, 24, 420, 8, "#6a3e1e") +
        c(163, 280, 78, "#2e7a38") + c(120, 320, 60, "#3a8a44") + c(210, 320, 62, "#2a6a30") + c(163, 230, 52, "#34843c") +
        c(416, 230, 92, "#2e7a38") + c(360, 280, 70, "#3a8a44") + c(480, 280, 74, "#2a6a30") + c(416, 180, 58, "#34843c") +
        c(731, 300, 70, "#2e7a38") + c(690, 340, 54, "#3a8a44") + c(780, 340, 56, "#2a6a30") + c(731, 255, 48, "#34843c") +
        c(995, 250, 84, "#2e7a38") + c(950, 300, 64, "#3a8a44") + c(1045, 300, 66, "#2a6a30") + c(995, 200, 56, "#34843c") +
        c(1297, 200, 96, "#2e7a38") + c(1230, 250, 74, "#3a8a44") + c(1370, 250, 78, "#2a6a30") + c(1297, 150, 62, "#34843c") +
        c(1512, 280, 70, "#2e7a38") + c(1470, 320, 54, "#3a8a44") + c(1560, 320, 56, "#2a6a30");
      const near =
        p("M0 730 C300 690 700 780 1000 730 C1300 680 1500 760 1600 730 L1600 900 0 900z", "#4a7a38") +
        p("M0 820 C280 790 700 870 1100 820 C1400 780 1520 850 1600 830 L1600 900 0 900z", "#3e6a30") +
        // winding path
        p("M600 900 C640 840 700 820 760 780 C820 740 860 700 900 720 C940 740 980 800 1040 840 C1100 880 1160 900 1200 900", "none") +
        `<path d="M620 900 C700 820 780 760 880 730 C980 700 1040 780 1140 840 C1220 890 1320 900 1400 900" fill="none" stroke="#c8b888" stroke-width="48" stroke-linecap="round"/>` +
        // mushrooms
        e(260, 830, 18, 8, "#f0e0c8") + r(252, 810, 16, 22, 3, "#f0e0c8") + e(260, 808, 22, 12, "#e07060") +
        e(300, 850, 12, 6, "#f0e0c8") + r(294, 836, 12, 16, 3, "#f0e0c8") + e(300, 834, 16, 9, "#e0a040") +
        e(980, 850, 14, 6, "#f0e0c8") + r(974, 836, 12, 16, 3, "#f0e0c8") + e(980, 834, 16, 9, "#e07060") +
        // log
        e(520, 860, 100, 18, "#7a4a24") + e(520, 856, 100, 8, "#8a5a30") +
        e(440, 860, 6, 8, "#5a3418") + e(600, 860, 5, 7, "#5a3418") +
        // ferns
        p("M120 870 q-22 -54 0 -66 q22 12 0 66", "#3a7a38") +
        p("M120 870 q22 -54 0 -66 q-22 12 0 66", "#4a8a40") +
        p("M1480 880 q-26 -64 0 -76 q26 14 0 76", "#3a7a38") +
        p("M1480 880 q26 -64 0 -76 q-26 14 0 76", "#4a8a40") +
        p("M800 870 q-16 -40 0 -48 q16 8 0 48", "#3a7a38") +
        p("M800 870 q16 -40 0 -48 q-16 8 0 48", "#4a8a40");
      const fg = grassTufts(900, "#2a5224", 34, 50) + grassTufts(886, "#36682c", 30, 52);
      return { far, mid, near, decor: "", fg };
    },

    jungle() {
      const far =
        p("M0 340 C200 280 420 360 700 300 C1000 240 1300 320 1600 260 L1600 600 0 600z", "#6aaa40") +
        p("M0 420 C300 380 600 460 900 400 C1200 340 1400 430 1600 380 L1600 620 0 620z", "#4a8a30") +
        p("M0 500 C400 470 800 540 1200 490 C1400 470 1520 520 1600 500 L1600 640 0 640z", "#3a7a28");
      const mid =
        r(100, 160, 38, 640, 12, "#5a3a18") +
        r(460, 100, 44, 720, 12, "#4a3014") +
        r(860, 180, 34, 620, 12, "#5a3a18") +
        r(1180, 130, 40, 680, 12, "#4a3014") +
        r(1460, 80, 48, 740, 12, "#3e2810") +
        c(119, 90, 120, "#2e7a28") + c(50, 150, 95, "#3a8a30") + c(200, 150, 100, "#246820") + c(119, 20, 85, "#348028") +
        c(482, 20, 140, "#2a6a22") + c(390, 100, 108, "#348028") + c(590, 100, 114, "#1e5a1c") + c(482, -50, 96, "#3a8a30") +
        c(877, 80, 110, "#2e7a28") + c(800, 140, 88, "#3a8a30") + c(960, 140, 92, "#246820") + c(877, 10, 76, "#348028") +
        c(1200, 50, 120, "#2a6a22") + c(1110, 120, 96, "#348028") + c(1300, 110, 100, "#1e5a1c") + c(1200, -20, 84, "#3a8a30") +
        c(1484, 10, 136, "#2a6a22") + c(1390, 80, 104, "#348028") + c(1580, 70, 112, "#1e5a1c") + c(1484, -60, 92, "#3a8a30") +
        `<path d="M280 0 q24 90 -8 180 q-24 90 18 260 q16 70 -10 160" stroke="#2e6a24" stroke-width="7" fill="none"/>` +
        `<path d="M700 0 q-32 110 12 220 q22 100 -14 280" stroke="#2e6a24" stroke-width="6" fill="none"/>` +
        `<path d="M1040 0 q20 100 -10 200 q-18 90 14 250" stroke="#2e6a24" stroke-width="6" fill="none"/>` +
        `<path d="M1340 0 q-16 80 8 170 q18 90 -12 230" stroke="#2e6a24" stroke-width="5" fill="none"/>` +
        e(276, 200, 10, 6, "#3a8a30") + e(268, 320, 12, 7, "#2e6a24") +
        e(708, 180, 11, 6, "#3a8a30") + e(1046, 240, 10, 6, "#2e6a24");
      const near =
        p("M0 710 C300 670 700 760 1000 710 C1300 660 1500 740 1600 710 L1600 900 0 900z", "#3a7a28") +
        p("M0 820 C280 790 700 870 1100 820 C1400 780 1520 850 1600 830 L1600 900 0 900z", "#2e6a22") +
        e(240, 820, 28, 14, "#e05070") + e(240, 812, 18, 10, "#f07088") +
        e(320, 850, 16, 8, "#e8c040") +
        e(1080, 840, 26, 12, "#e0a040") + e(1080, 832, 16, 8, "#f0b850") +
        e(1280, 820, 22, 11, "#e05070") + e(1280, 812, 14, 8, "#f07088") +
        e(700, 860, 70, 16, "#4a8aba") + e(700, 866, 48, 8, "#5a9aca");
      const fg =
        p("M0 40 q90 30 50 160 q-20 40 -20 80 q40 20 10 120 q-30 40 -40 200 L0 900z", "#1a4a1c") +
        p("M0 200 q70 20 40 120 q-16 40 -20 90 q30 16 8 80", "#246424") +
        p("M1600 20 q-100 40 -54 170 q18 40 18 90 q-40 20 -12 130 q30 40 48 200 L1600 900z", "#1a4a1c") +
        p("M1600 220 q-80 20 -46 130 q16 40 20 90 q-28 16 -8 80", "#246424") +
        p("M-10 80 q60 10 40 70 q-40 10 -40 8z", "#2e7a28") +
        p("M1610 60 q-70 12 -46 80 q46 10 46 6z", "#2e7a28") +
        grassTufts(900, "#1a4216", 28, 58);
      return { far, mid, near, decor: "", fg };
    },

    arctic() {
      const far =
        stars(70, 44, 280) +
        // wavy aurora bands
        `<path d="M40 200 C200 140 320 230 500 160 C680 90 820 210 1000 140 C1180 70 1360 190 1600 130 L1600 260 C1400 300 1200 200 1000 250 C800 300 620 200 440 250 C260 300 120 210 0 260z" fill="rgba(80,230,190,0.38)"/>` +
        `<path d="M0 160 C180 110 340 200 540 130 C740 60 900 190 1120 120 C1320 60 1480 170 1600 120 L1600 200 C1420 240 1220 150 1020 200 C800 250 620 150 420 210 C240 260 80 170 0 210z" fill="rgba(140,255,220,0.28)"/>` +
        `<path d="M80 240 C260 200 400 280 600 220 C800 160 980 270 1180 210 C1360 160 1500 250 1600 230 L1600 300 C1400 330 1200 250 1000 300 C780 350 580 260 380 310 C200 350 60 280 0 300z" fill="rgba(90,200,230,0.2)"/>` +
        // snowy mountains with soft pink highlights
        p("M0 400 L180 240 300 330 460 180 640 300 820 160 1040 290 1240 150 1460 270 1600 190 1600 500 0 500z", "#d0dce8") +
        p("M0 430 L200 300 380 400 600 240 860 370 1120 230 1380 340 1600 260 1600 540 0 540z", "#e4eef6") +
        p("M160 250 l20 -16 24 20z", "#fff") +
        p("M800 175 l28 -22 30 26z", "#fff") +
        p("M1228 165 l22 -18 26 22z", "#f8e8e8") +
        p("M450 195 l16 -12 18 16z", "#f8ece8");
      const mid =
        p("M0 500 L1600 500 1600 680 0 680z", "#1e5a8a") +
        p("M0 500 C200 480 400 520 700 490 C1000 460 1300 520 1600 485 L1600 540 0 540z", "#2e7aaa") +
        iceFloe(160, 500, 0.85, false) +
        iceFloe(520, 515, 0.45, true) +
        iceFloe(900, 490, 1.05, false) +
        iceFloe(1280, 520, 0.55, true) +
        iceFloe(1450, 500, 0.7, false);
      const near =
        p("M0 620 C260 590 520 670 820 630 C1120 590 1400 670 1600 620 L1600 900 0 900z", "#f4f8fb") +
        p("M0 740 C300 710 600 800 900 750 C1200 700 1400 790 1600 740 L1600 900 0 900z", "#e8f0f6") +
        p("M0 820 C240 800 560 860 880 820 C1200 780 1400 850 1600 820 L1600 900 0 900z", "#f8fbfd") +
        // dry grass tufts
        p("M120 820 q8 -48 16 0 q8 -34 14 0 q6 -22 10 0", "#c4b070") +
        p("M180 840 q8 -36 14 0 q6 -24 10 0", "#d0bc80") +
        p("M260 830 q8 -40 16 0 q8 -28 12 0", "#c4b070") +
        p("M700 850 q8 -32 14 0 q6 -20 10 0", "#c4b070") +
        p("M1180 830 q8 -46 16 0 q8 -30 14 0", "#c4b070") +
        p("M1260 850 q8 -34 14 0 q6 -22 10 0", "#d0bc80") +
        p("M1460 810 q8 -52 16 0 q8 -34 14 0 q6 -20 10 0", "#c4b070") +
        p("M1540 840 q8 -36 14 0", "#d0bc80");
      const fg = p("M0 860 C200 840 400 890 700 860 C1000 830 1300 890 1600 860 L1600 900 0 900z", "#ffffff");
      return { far, mid, near, decor: "", fg };
    },

    pumpkin() {
      const far =
        stars(55, 99, 360) +
        c(1280, 150, 110, "#f4e6b8") +
        c(1280, 150, 86, "#fff6d8") +
        c(1280, 150, 58, "#fffce8") +
        // purple rolling hills + farmhouse
        p("M0 460 C200 400 400 480 700 420 C1000 360 1300 440 1600 380 L1600 620 0 620z", "#4a2a6a") +
        p("M0 530 C300 490 600 570 900 510 C1200 450 1400 540 1600 490 L1600 660 0 660z", "#5a3878") +
        r(820, 410, 78, 56, 2, "#3a2458") +
        p("M805 410 l54 -40 54 40z", "#2a1848") +
        r(858, 428, 16, 18, 2, "#f0d080") +
        r(832, 444, 14, 22, 1, "#2a1848") +
        r(900, 430, 10, 10, 1, "#f0d080");
      const mid =
        // fence along the ridge
        Array.from({ length: 24 }, (_, i) => {
          const x = 40 + i * 68;
          return r(x, 600, 8, 52, 2, "#6a4a28") + r(x - 8, 612, 24, 6, 1, "#6a4a28");
        }).join("") +
        r(40, 624, 1540, 6, 1, "#6a4a28") +
        // autumn trees, dense foliage
        p("M90 700 l0 -90 18 0 0 90z", "#5a3a18") +
        c(50, 540, 48, "#e07030") + c(120, 520, 54, "#d05020") + c(86, 470, 42, "#e88830") + c(20, 500, 32, "#c04018") +
        p("M1480 720 l0 -80 20 0 0 80z", "#5a3a18") +
        c(1440, 560, 50, "#e07030") + c(1530, 540, 58, "#c04018") + c(1488, 490, 44, "#e88830") + c(1570, 520, 30, "#d05020");
      const near =
        p("M0 690 C300 660 700 740 1000 690 C1300 650 1500 730 1600 690 L1600 900 0 900z", "#4a6a30") +
        // dirt path winding through the patch
        `<path d="M0 790 C200 770 360 820 560 800 C760 780 900 840 1120 810 C1320 780 1480 830 1600 810 L1600 870 C1400 890 1200 840 1000 860 C800 880 620 820 400 850 C220 870 80 840 0 850z" fill="#8a6a40"/>` +
        `<path d="M0 810 C220 790 400 840 600 820 C820 800 980 850 1180 825 C1380 800 1500 840 1600 830" fill="none" stroke="#7a5a34" stroke-width="6" opacity="0.35"/>` +
        // crop rows with pumpkins
        Array.from({ length: 9 }, (_, i) => {
          const x = 90 + i * 170;
          return cropLeaf(x, 750, 0.85 + (i % 3) * 0.08) + pumpkinDeco(x + 8, 748, 0.9 + (i % 2) * 0.15, i % 5 === 0 ? "light" : "mid");
        }).join("") +
        Array.from({ length: 8 }, (_, i) => {
          const x = 170 + i * 175;
          return cropLeaf(x, 850, 0.95) + pumpkinDeco(x - 6, 848, 1, i % 4 === 2 ? "deep" : "mid") + pumpkinDeco(x + 28, 856, 0.7, "mid");
        }).join("") +
        cropLeaf(80, 820, 0.7) + pumpkinDeco(70, 818, 0.8, "light") +
        cropLeaf(1500, 770, 0.9) + pumpkinDeco(1508, 768, 1.05, "deep") +
        // wooden sign
        r(70, 700, 12, 90, 2, "#6a4a24") +
        r(36, 655, 130, 54, 8, "#8a5a2c") +
        r(42, 661, 118, 42, 6, "#7a4a24") +
        `<text x="101" y="692" text-anchor="middle" font-family="Noto Sans TC, PingFang HK, Microsoft JhengHei, sans-serif" font-size="26" font-weight="800" fill="#f4e0c0">南瓜園</text>`;
      const fg =
        p("M0 0 q100 50 50 150 q30 50 0 110 l-50 0z", "#6a3010") +
        c(10, 50, 36, "#e07030") + c(55, 20, 32, "#d05020") + c(8, 10, 22, "#e88830") +
        p("M1600 0 q-100 50 -50 150 q-30 50 0 110 l50 0z", "#6a3010") +
        c(1590, 44, 36, "#e07030") + c(1545, 16, 30, "#c04018") + c(1596, 8, 20, "#e88830") +
        grassTufts(900, "#2e4a18", 28, 58);
      return { far, mid, near, decor: "", fg };
    },
  };

  function paintTheme(id) {
    const sceneEl = document.getElementById("scene");
    const theme = THEMES[id] || THEMES.savanna;
    sceneEl.dataset.theme = theme.id;
    const overlay = document.getElementById("loud-overlay");
    overlay.dataset.kind = theme.overlay;
    const layers = painters[theme.id] ? painters[theme.id]() : painters.savanna();
    ["far", "mid", "near", "decor", "fg"].forEach((key) => {
      const el = document.getElementById(key);
      const body = layers[key] || "";
      el.innerHTML = body ? scene(body) : "";
    });
    QH.paintParticles(theme.particles);
    QH.paintWeather(theme.id);
  }

  QH.paintParticles = function (kind) {
    const root = document.getElementById("particles");
    root.innerHTML = "";
    if (!kind || kind === "none") return;
    const n = kind === "stars" ? 48 : kind === "snow" ? 52 : kind === "bubbles" ? 28 : kind === "leaves" ? 20 : 10;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "particle " + (kind === "dust" ? "spark" : kind === "stars" ? "spark" : kind === "snow" ? "snow" : kind === "bubbles" ? "bubble" : "leaf");
      const size =
        kind === "snow" ? 3 + Math.random() * 5 :
        kind === "bubbles" ? 6 + Math.random() * 12 :
        kind === "leaves" ? 8 + Math.random() * 10 :
        2 + Math.random() * 3;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = Math.random() * 100 + "%";
      if (kind === "leaves") {
        el.style.background = ["#e07030", "#d05020", "#e8a040", "#c04018"][i % 4];
      }
      const dur = (kind === "stars" || kind === "dust" ? 3 : 8) + Math.random() * 10;
      el.style.animationDuration = dur + "s";
      el.style.animationDelay = -Math.random() * dur + "s";
      if (kind === "stars" || kind === "dust") {
        el.style.top = Math.random() * 70 + "%";
      }
      root.appendChild(el);
    }
    if (kind === "bubbles") {
      for (let i = 0; i < 36; i++) {
        const el = document.createElement("div");
        el.className = "particle spark";
        const size = 1.5 + Math.random() * 2.5;
        el.style.width = size + "px";
        el.style.height = size + "px";
        el.style.left = Math.random() * 100 + "%";
        el.style.top = Math.random() * 72 + "%";
        const dur = 3 + Math.random() * 5;
        el.style.animationDuration = dur + "s";
        el.style.animationDelay = -Math.random() * dur + "s";
        root.appendChild(el);
      }
    }
  };

  QH.paintWeather = function (id) {
    const fx = document.getElementById("weather-fx");
    fx.innerHTML = "";
    if (id !== "jungle") return;
    for (let i = 0; i < 40; i++) {
      const d = document.createElement("div");
      d.className = "drop";
      d.style.left = Math.random() * 100 + "%";
      d.style.animationDelay = Math.random() * 0.7 + "s";
      d.style.animationDuration = 0.55 + Math.random() * 0.35 + "s";
      fx.appendChild(d);
    }
  };

  QH.THEMES = THEMES;
  QH.THEME_ORDER = ORDER;
  QH.paintTheme = paintTheme;
})(window);
