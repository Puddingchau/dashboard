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
      p("M0 0 l0 -90", "#5a3a18") +
        `<path d="M0 -90 l0 90" stroke="#5a3a18" stroke-width="10" fill="none" stroke-linecap="round"/>` +
        p("M0 -88 q-70 -20 -80 20 q50 -8 80 -8 q40 4 80 12 q-8 -40 -80 -24z", "#6a9a3a") +
        p("M-10 -100 q-40 -16 -44 8 q24 0 44 2 q20 4 40 8 q-4 -20 -40 -18z", "#7aaa44"),
      `transform="${t}"`
    );
  }

  function grassTufts(y, color) {
    let s = "";
    for (let i = 0; i < 28; i++) {
      const x = i * 60 + (i % 3) * 10;
      const h = 30 + (i % 5) * 10;
      s += p(`M${x} ${y} q8 -${h} 16 0 q8 -${h * 0.7} 14 0`, color);
    }
    return s;
  }

  function stars(count, seed) {
    let s = "";
    let a = seed || 7;
    for (let i = 0; i < count; i++) {
      a = (a * 16807) % 2147483647;
      const x = (a % 1600);
      a = (a * 16807) % 2147483647;
      const y = (a % 800);
      a = (a * 16807) % 2147483647;
      const r0 = 1 + (a % 25) / 10;
      const o = 0.4 + (a % 50) / 100;
      s += c(x, y, r0, `rgba(255,255,255,${o})`);
    }
    return s;
  }

  const painters = {
    savanna() {
      const far =
        c(1280, 180, 110, "#f8e6a0") +
        c(1280, 180, 80, "#fff3c0") +
        p("M0 420 L180 300 360 400 560 260 780 380 980 240 1200 360 1400 220 1600 340 1600 520 0 520z", "#d4a06a") +
        p("M0 480 L220 380 440 470 700 350 960 460 1240 330 1600 450 1600 600 0 600z", "#c48a4a");
      const mid =
        p("M0 560 C200 500 400 580 700 520 C1000 460 1200 560 1600 500 L1600 900 0 900z", "#c8c45a") +
        p("M0 640 C300 600 600 680 900 620 C1200 560 1400 650 1600 610 L1600 900 0 900z", "#b8b44c") +
        acacia(260, 640, 1.1) +
        acacia(1180, 600, 0.85) +
        acacia(1460, 660, 0.6);
      const near =
        p("M0 760 C200 730 500 790 800 750 C1100 710 1400 780 1600 740 L1600 900 0 900z", "#9aaa3a") +
        e(420, 780, 90, 22, "#7a9aaa") +
        e(420, 786, 70, 12, "#8ab0b8");
      const fg = grassTufts(900, "#6a8a28") + grassTufts(880, "#7a9a30");
      return { far, mid, near, decor: "", fg };
    },

    reef() {
      const far =
        p("M200 0 l40 900", "none") +
        `<g opacity="0.18" fill="#fff">${[200, 360, 520, 800, 1100, 1400]
          .map((x) => p(`M${x} 0 l40 0 l80 900 l-200 0z`, "#fff8e0"))
          .join("")}</g>`;
      const mid = "";
      const near =
        p("M0 700 C200 660 400 740 700 700 C1000 660 1300 740 1600 690 L1600 900 0 900z", "#e8d2a0") +
        p("M0 780 C300 750 600 820 900 780 C1200 740 1400 810 1600 770 L1600 900 0 900z", "#e0c488") +
        // corals
        e(180, 800, 28, 50, "#e090b0") +
        e(160, 800, 16, 40, "#f0a0c0") +
        e(200, 800, 16, 36, "#d07098") +
        r(320, 720, 12, 90, 6, "#4aaa6a") +
        r(340, 740, 10, 70, 5, "#5aba78") +
        r(360, 730, 10, 80, 5, "#3a9a58") +
        e(520, 820, 36, 30, "#f08070") +
        p("M500 820 q0 -70 20 -70 q20 0 20 70", "#f09080") +
        p("M520 820 q0 -80 18 -80 q18 0 18 80", "#e07060") +
        e(900, 830, 24, 40, "#c080e0") +
        e(880, 830, 14, 30, "#d0a0f0") +
        e(920, 830, 14, 32, "#b070d0") +
        r(1100, 700, 14, 110, 7, "#3a9a8a") +
        r(1130, 730, 12, 80, 6, "#4aaa9a") +
        r(1078, 740, 10, 70, 5, "#2a8a7a") +
        e(1280, 840, 40, 20, "#e8a040") +
        p("M1260 840 l10 -30 10 30 10 -24 10 24", "#f0b050") +
        e(1480, 800, 26, 46, "#70c0c8") +
        e(1460, 800, 14, 34, "#90d0d4") +
        // decorative starfish / stones
        p("M240 860 l6 14 16 2 -12 10 4 16 -14 -8 -14 8 4-16 -12-10 16-2z", "#e07060") +
        c(700, 860, 10, "#d0b080") +
        c(740, 870, 7, "#c0a070") +
        c(1340, 870, 12, "#d8b890");
      const fg =
        r(40, 640, 16, 280, 8, "#2e8a5a") +
        r(70, 680, 12, 240, 6, "#3a9a68") +
        r(1520, 620, 18, 300, 8, "#2e8a5a") +
        r(1490, 700, 12, 220, 6, "#3a9a68") +
        e(48, 640, 18, 14, "#4aaa6a") +
        e(1528, 620, 20, 14, "#4aaa6a");
      return { far, mid, near, decor: "", fg };
    },

    space() {
      const far =
        stars(90, 13) +
        `<defs>
          <radialGradient id="neb1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(140,90,200,0.28)"/><stop offset="100%" stop-color="rgba(140,90,200,0)"/></radialGradient>
          <radialGradient id="neb2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(50,90,180,0.22)"/><stop offset="100%" stop-color="rgba(50,90,180,0)"/></radialGradient>
          <radialGradient id="neb3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(180,80,140,0.16)"/><stop offset="100%" stop-color="rgba(180,80,140,0)"/></radialGradient>
        </defs>` +
        e(320, 210, 260, 150, "url(#neb1)") +
        e(1180, 620, 280, 160, "url(#neb2)") +
        e(900, 160, 200, 110, "url(#neb3)");
      const mid =
        c(240, 160, 2.5, "#fff") +
        c(700, 80, 2, "#fff8d0") +
        c(1100, 300, 2, "#fff") +
        e(1350, 220, 50, 50, "#c09070") +
        e(1350, 210, 50, 20, "#d0a888");
      return { far, mid, near: "", decor: "", fg: "" };
    },

    prehistoric() {
      const far =
        p("M0 360 L160 240 300 330 480 180 700 300 900 160 1100 280 1300 150 1600 260 1600 500 0 500z", "#8aa0a8") +
        p("M0 400 L200 300 400 390 620 250 860 370 1120 230 1400 340 1600 260 1600 520 0 520z", "#7a949c") +
        // distant pines
        Array.from({ length: 22 }, (_, i) => {
          const x = i * 75 + 10;
          const h = 60 + (i % 4) * 20;
          return p(`M${x} 480 l18 -${h} 18 ${h}z`, "#5a7a68");
        }).join("");
      const mid =
        p("M0 520 C400 480 700 560 1100 500 C1300 470 1500 520 1600 500 L1600 700 0 700z", "#8aaa7a") +
        e(900, 560, 280, 50, "#7a9aaa") +
        e(900, 568, 200, 28, "#8ab0b8") +
        // tall conifer
        p("M240 700 l0 -40 20 0 0 40z", "#5a3a20") +
        p("M250 420 l-50 120 100 0z", "#2e5a38") +
        p("M250 470 l-60 120 120 0z", "#346840") +
        p("M250 530 l-70 130 140 0z", "#3a7448") +
        p("M1280 700 l0 -24 16 0 0 24z", "#5a3a20") +
        p("M1288 520 l-36 90 72 0z", "#2e5a38") +
        p("M1288 580 l-44 90 88 0z", "#346840");
      const near =
        p("M0 680 C300 650 600 720 900 680 C1200 640 1400 710 1600 670 L1600 900 0 900z", "#8a9a58") +
        p("M0 780 C250 750 550 820 850 780 C1150 740 1400 810 1600 770 L1600 900 0 900z", "#7a8a48") +
        // cycads
        p("M160 820 q-30 -80 0 -90 q30 10 0 90", "#4a7a38") +
        p("M160 820 q30 -80 0 -90 q-30 10 0 90", "#5a8a40") +
        r(154, 800, 12, 50, 3, "#6a5a30") +
        p("M1460 840 q-36 -90 0 -100 q36 12 0 100", "#4a7a38") +
        p("M1460 840 q36 -90 0 -100 q-36 12 0 100", "#5a8a40") +
        r(1454, 820, 12, 50, 3, "#6a5a30") +
        // log
        e(500, 840, 80, 18, "#7a4a24") +
        e(500, 836, 80, 8, "#8a5a30") +
        e(450, 840, 6, 8, "#5a3418");
      const fg = grassTufts(900, "#5a6a30") + grassTufts(885, "#6a7a38");
      return { far, mid, near, decor: "", fg };
    },

    forest() {
      const far =
        p("M0 400 C200 340 400 420 700 360 C1000 300 1300 380 1600 330 L1600 600 0 600z", "#6a9a60") +
        Array.from({ length: 16 }, (_, i) => {
          const x = i * 110;
          return p(`M${x} 520 l30 -120 30 120z`, "#3a7a44");
        }).join("");
      const mid =
        p("M0 560 C300 520 600 600 900 550 C1200 500 1400 580 1600 540 L1600 900 0 900z", "#5a8a48") +
        // trunks and fuller canopies
        r(180, 400, 28, 400, 8, "#7a4a24") +
        r(420, 360, 34, 460, 8, "#6a3e1e") +
        r(980, 380, 30, 440, 8, "#7a4a24") +
        r(1320, 340, 36, 480, 8, "#6a3e1e") +
        c(194, 300, 78, "#2e7a38") + c(150, 340, 60, "#3a8a44") + c(240, 340, 62, "#2a6a30") + c(194, 250, 52, "#34843c") +
        c(437, 250, 90, "#2e7a38") + c(380, 300, 70, "#3a8a44") + c(500, 300, 74, "#2a6a30") + c(437, 200, 58, "#34843c") +
        c(995, 280, 80, "#2e7a38") + c(950, 320, 62, "#3a8a44") + c(1040, 320, 64, "#2a6a30") + c(995, 230, 54, "#34843c") +
        c(1338, 230, 92, "#2e7a38") + c(1270, 280, 72, "#3a8a44") + c(1410, 280, 76, "#2a6a30") + c(1338, 180, 60, "#34843c");
      const near =
        p("M0 740 C300 700 700 780 1000 730 C1300 680 1500 760 1600 730 L1600 900 0 900z", "#4a7a38") +
        // mushrooms
        e(300, 820, 18, 8, "#f0e0c8") +
        r(292, 800, 16, 22, 3, "#f0e0c8") +
        e(300, 798, 22, 12, "#e07060") +
        e(860, 840, 14, 6, "#f0e0c8") +
        r(854, 824, 12, 18, 3, "#f0e0c8") +
        e(860, 822, 18, 10, "#e0a040") +
        // log
        e(600, 850, 90, 18, "#7a4a24") +
        e(600, 846, 90, 8, "#8a5a30") +
        e(540, 850, 6, 8, "#5a3418") +
        e(660, 850, 5, 7, "#5a3418") +
        // ferns
        p("M140 860 q-20 -50 0 -60 q20 10 0 60", "#3a7a38") +
        p("M140 860 q20 -50 0 -60 q-20 10 0 60", "#4a8a40") +
        p("M1480 870 q-24 -60 0 -70 q24 12 0 70", "#3a7a38") +
        p("M1480 870 q24 -60 0 -70 q-24 12 0 70", "#4a8a40");
      const fg = grassTufts(900, "#2e5a28") + grassTufts(888, "#3a6a30");
      return { far, mid, near, decor: "", fg };
    },

    jungle() {
      const far =
        p("M0 360 C200 300 400 380 700 320 C1000 260 1300 340 1600 280 L1600 600 0 600z", "#6aaa40") +
        p("M0 440 C300 400 600 480 900 420 C1200 360 1400 450 1600 400 L1600 620 0 620z", "#4a8a30");
      const mid =
        r(120, 200, 36, 600, 10, "#5a3a18") +
        r(500, 140, 40, 680, 10, "#4a3014") +
        r(1080, 180, 36, 640, 10, "#5a3a18") +
        r(1400, 120, 44, 700, 10, "#4a3014") +
        c(138, 120, 110, "#2e7a28") + c(70, 180, 90, "#3a8a30") + c(210, 180, 95, "#246820") + c(138, 50, 80, "#348028") +
        c(520, 60, 130, "#2a6a22") + c(430, 130, 100, "#348028") + c(620, 130, 108, "#1e5a1c") + c(520, -10, 90, "#3a8a30") +
        c(1098, 100, 115, "#2e7a28") + c(1020, 160, 90, "#3a8a30") + c(1180, 160, 95, "#246820") + c(1098, 30, 80, "#348028") +
        c(1422, 50, 130, "#2a6a22") + c(1330, 120, 100, "#348028") + c(1520, 110, 110, "#1e5a1c") + c(1422, -20, 88, "#3a8a30") +
        // vines
        `<path d="M300 0 q20 80 -10 160 q-20 80 16 240" stroke="#2e6a24" stroke-width="6" fill="none"/>` +
        `<path d="M900 0 q-30 100 10 200 q20 90 -16 260" stroke="#2e6a24" stroke-width="6" fill="none"/>` +
        `<path d="M1240 0 q20 90 -8 180 q-16 80 12 220" stroke="#2e6a24" stroke-width="5" fill="none"/>`;
      const near =
        p("M0 720 C300 680 700 760 1000 710 C1300 660 1500 740 1600 710 L1600 900 0 900z", "#3a7a28") +
        e(260, 820, 40, 16, "#e05070") +
        e(260, 812, 28, 12, "#f07088") +
        e(1180, 840, 36, 14, "#e0a040") +
        e(1180, 832, 24, 10, "#f0b850");
      const fg =
        p("M0 200 q80 40 40 160 q-20 40 -40 80z", "#1e5a20") +
        p("M0 400 q100 20 60 180 q-40 40 -60 80z", "#2a6a24") +
        p("M1600 160 q-90 40 -50 170 q20 40 50 90z", "#1e5a20") +
        p("M1600 420 q-110 20 -70 180 q40 40 70 90z", "#2a6a24") +
        grassTufts(900, "#1e4a18");
      return { far, mid, near, decor: "", fg };
    },

    arctic() {
      const far =
        // aurora
        e(800, 180, 500, 80, "rgba(80,230,190,0.35)") +
        e(600, 140, 360, 50, "rgba(120,255,210,0.28)") +
        e(1100, 200, 400, 60, "rgba(60,200,220,0.22)") +
        p("M0 360 L200 200 400 320 640 160 900 300 1140 140 1400 280 1600 180 1600 500 0 500z", "#d8e8f0") +
        p("M0 420 L240 280 480 400 760 220 1100 360 1400 230 1600 300 1600 560 0 560z", "#e8f4f8");
      const mid =
        p("M0 520 L1600 520 1600 680 0 680z", "#2a6a9a") +
        p("M0 520 C200 500 400 540 700 510 C1000 480 1300 530 1600 500 L1600 560 0 560z", "#3a8aba") +
        // icebergs
        p("M200 540 l40 -80 50 10 30 -50 40 120z", "#eef6fb") +
        p("M200 540 l160 0 -40 -40 -50 8 -30 -30z", "#d8e8f4") +
        p("M980 530 l50 -100 60 16 36 -60 50 144z", "#eef6fb") +
        p("M980 530 l196 0 -50 -50 -60 10 -36 -36z", "#d8e8f4") +
        p("M1360 550 l30 -50 40 8 20 -30 30 72z", "#eef6fb");
      const near =
        p("M0 640 C250 610 500 680 800 640 C1100 600 1400 670 1600 630 L1600 900 0 900z", "#f4f8fb") +
        p("M0 760 C300 730 600 800 900 760 C1200 720 1400 790 1600 750 L1600 900 0 900z", "#e8f0f6") +
        // dry grass
        p("M140 820 q8 -40 16 0 q8 -30 12 0", "#c4b070") +
        p("M180 830 q8 -36 16 0", "#c4b070") +
        p("M1280 840 q8 -40 16 0 q8 -28 12 0", "#c4b070") +
        p("M1480 820 q8 -44 16 0 q8 -30 14 0", "#c4b070");
      const fg = p("M0 860 C200 840 400 880 700 850 C1000 820 1300 880 1600 850 L1600 900 0 900z", "#fff");
      return { far, mid, near, decor: "", fg };
    },

    pumpkin() {
      const far =
        stars(40, 99) +
        c(1320, 160, 90, "#f4e6b8") +
        c(1320, 160, 70, "#fff6d8") +
        p("M0 480 C200 420 400 500 700 440 C1000 380 1300 460 1600 400 L1600 620 0 620z", "#4a2a6a") +
        p("M0 540 C300 500 600 580 900 520 C1200 460 1400 550 1600 500 L1600 660 0 660z", "#5a3878") +
        // farmhouse
        r(860, 430, 70, 50, 2, "#3a2858") +
        p("M845 430 l50 -36 50 36z", "#2a1848") +
        r(900, 448, 14, 16, 1, "#f0d080") +
        r(876, 460, 12, 20, 1, "#2a1848");
      const mid =
        // fence
        Array.from({ length: 22 }, (_, i) => {
          const x = 80 + i * 70;
          return r(x, 620, 8, 50, 2, "#6a4a28") + r(x - 6, 628, 20, 6, 1, "#6a4a28");
        }).join("") +
        // autumn trees
        p("M80 700 l0 -80 16 0 0 80z", "#5a3a18") +
        c(50, 560, 40, "#e07030") +
        c(110, 540, 46, "#d05020") +
        c(88, 500, 36, "#e88830") +
        p("M1480 720 l0 -70 18 0 0 70z", "#5a3a18") +
        c(1450, 580, 44, "#e07030") +
        c(1520, 560, 50, "#c04018") +
        c(1488, 520, 40, "#e88830");
      const near =
        p("M0 700 C300 670 700 740 1000 700 C1300 660 1500 730 1600 700 L1600 900 0 900z", "#4a6a30") +
        p("M0 780 C250 750 600 820 900 780 C1200 740 1400 810 1600 770 L1600 900 0 900z", "#3e5c28") +
        // pumpkin rows (decorative plants)
        Array.from({ length: 10 }, (_, i) => {
          const x = 160 + i * 140;
          const y = 780 + (i % 2) * 30;
          return (
            e(x, y, 22, 10, "#3a7a28") +
            e(x + 40, y + 8, 18, 9, "#3a7a28") +
            e(x + 18, y + 4, 10, 8, "#e07028")
          );
        }).join("") +
        // wooden sign
        r(70, 700, 10, 80, 2, "#6a4a24") +
        r(40, 660, 120, 50, 6, "#8a5a2c") +
        `<text x="100" y="694" text-anchor="middle" font-family="Noto Sans TC, PingFang HK, Microsoft JhengHei, sans-serif" font-size="26" font-weight="800" fill="#f4e0c0">南瓜園</text>`;
      const fg =
        p("M0 0 q80 40 40 120 q20 40 0 80 l-40 0z", "#6a3010") +
        c(10, 40, 30, "#e07030") +
        c(50, 20, 28, "#d05020") +
        p("M1600 0 q-80 40 -40 120 q-20 40 0 80 l40 0z", "#6a3010") +
        c(1590, 36, 30, "#e07030") +
        c(1550, 16, 26, "#c04018") +
        grassTufts(900, "#2e4a18");
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
    const n = kind === "stars" ? 36 : kind === "snow" ? 42 : kind === "bubbles" ? 22 : kind === "leaves" ? 16 : 8;
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
