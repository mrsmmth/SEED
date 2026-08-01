(() => {
  "use strict";

  const STORAGE_KEY = "seed-spherical-notes-v1";
  const HINT_KEY = "seed-spherical-hint-v1";
  const PANEL_KEY = "seed-connection-panel-v1";
  const HELP_KEY = "seed-help-seen-v1";
  const MAIN_SIZE = 1.34;
  const GUIDE_SCALE = 0.50;
  const MAX_FREE_DISTANCE = 3.40;
  const SIZE_OPTIONS = [0.76, 0.88, 1.0, 1.12];

  const COLOR_KEYS = [
    "pearl", "ice", "mint", "violet", "rose", "cobalt", "silver",
    "palePink", "paleYellow", "paleGreen", "lilac", "aqua", "peach", "smokyBlue"
  ];

  const COLOR_NAMES = {
    pearl: "Pearl Gold",
    ice: "Ice Blue",
    mint: "Mint",
    violet: "Violet",
    rose: "Rose",
    cobalt: "Cobalt",
    silver: "Silver",
    palePink: "Pale Pink",
    paleYellow: "Pale Yellow",
    paleGreen: "Pale Green",
    lilac: "Lilac",
    aqua: "Aqua",
    peach: "Peach",
    smokyBlue: "Smoky Blue"
  };

  const LEGACY_COLOR_MAP = { mist: "violet", navy: "cobalt" };

  const COLOR_PALETTES = {
    pearl: {
      glow: [255, 253, 237], mid: [255, 224, 137], dark: [198, 139, 49],
      label: [111, 75, 20], chip: "#f2c768"
    },
    ice: {
      glow: [238, 253, 255], mid: [126, 222, 246], dark: [40, 137, 191],
      label: [18, 83, 126], chip: "#83d9f1"
    },
    mint: {
      glow: [235, 255, 249], mid: [117, 224, 187], dark: [29, 139, 108],
      label: [18, 92, 73], chip: "#78ddb9"
    },
    violet: {
      glow: [250, 242, 255], mid: [202, 158, 237], dark: [106, 65, 173],
      label: [76, 43, 126], chip: "#b889df"
    },
    rose: {
      glow: [255, 241, 247], mid: [238, 148, 179], dark: [175, 65, 105],
      label: [119, 38, 72], chip: "#e38cac"
    },
    cobalt: {
      glow: [239, 246, 255], mid: [102, 158, 235], dark: [25, 67, 148],
      label: [18, 54, 112], chip: "#528bda"
    },
    silver: {
      glow: [253, 254, 255], mid: [197, 207, 220], dark: [91, 104, 124],
      label: [54, 66, 84], chip: "#b7c1cf"
    },
    palePink: {
      glow: [255, 250, 253], mid: [249, 205, 222], dark: [211, 137, 168],
      label: [122, 66, 91], chip: "#f2c2d5"
    },
    paleYellow: {
      glow: [255, 255, 246], mid: [250, 236, 164], dark: [205, 174, 78],
      label: [107, 89, 27], chip: "#eadb8d"
    },
    paleGreen: {
      glow: [249, 255, 249], mid: [196, 235, 191], dark: [112, 174, 110],
      label: [53, 102, 54], chip: "#b9dfb6"
    },
    lilac: {
      glow: [253, 249, 255], mid: [222, 198, 242], dark: [151, 110, 190],
      label: [91, 61, 122], chip: "#d4bce9"
    },
    aqua: {
      glow: [246, 255, 255], mid: [167, 235, 233], dark: [69, 161, 162],
      label: [29, 102, 104], chip: "#9edfde"
    },
    peach: {
      glow: [255, 250, 245], mid: [249, 193, 157], dark: [201, 117, 75],
      label: [122, 66, 39], chip: "#efb68f"
    },
    smokyBlue: {
      glow: [248, 251, 255], mid: [164, 188, 215], dark: [76, 105, 143],
      label: [45, 67, 96], chip: "#94abc7"
    }
  };

  const canvas = document.getElementById("universe");
  const ctx = canvas.getContext("2d", { alpha: false });
  const addButton = document.getElementById("addButton");
  const autoViewButton = document.getElementById("autoViewButton");
  const menuButton = document.getElementById("menuButton");
  const editorSheet = document.getElementById("editorSheet");
  const menuSheet = document.getElementById("menuSheet");
  const universeSheet = document.getElementById("universeSheet");
  const helpSheet = document.getElementById("helpSheet");
  const titleInput = document.getElementById("seedTitle");
  const bodyInput = document.getElementById("seedBody");
  const colorInput = document.getElementById("seedColor");
  const colorPalette = document.getElementById("colorPalette");
  const selectedColorName = document.getElementById("selectedColorName");
  const sizeInput = document.getElementById("seedSize");
  const saveButton = document.getElementById("saveButton");
  const deleteButton = document.getElementById("deleteButton");
  const unlinkButton = document.getElementById("unlinkButton");
  const centerButton = document.getElementById("centerButton");
  const exportButton = document.getElementById("exportButton");
  const importInput = document.getElementById("importInput");
  const resetViewButton = document.getElementById("resetViewButton");
  const dismissHintButton = document.getElementById("dismissHintButton");
  const arrangeSizeButton = document.getElementById("arrangeSizeButton");
  const arrangeColorButton = document.getElementById("arrangeColorButton");
  const arrangeEvenButton = document.getElementById("arrangeEvenButton");
  const restoreLayoutButton = document.getElementById("restoreLayoutButton");
  const clearLinksButton = document.getElementById("clearLinksButton");
  const clearButton = document.getElementById("clearButton");
  const universeButton = document.getElementById("universeButton");
  const activeUniverseName = document.getElementById("activeUniverseName");
  const universeMenuButton = document.getElementById("universeMenuButton");
  const universeMenuCount = document.getElementById("universeMenuCount");
  const universeList = document.getElementById("universeList");
  const createUniverseButton = document.getElementById("createUniverseButton");
  const helpButton = document.getElementById("helpButton");
  const closeHelpButton = document.getElementById("closeHelpButton");
  const gestureHint = document.getElementById("gestureHint");
  const toast = document.getElementById("toast");

  const connectionPanel = document.getElementById("connectionPanel");
  const connectionPanelToggle = document.getElementById("connectionPanelToggle");
  const panelMainTitle = document.getElementById("panelMainTitle");
  const connectionList = document.getElementById("connectionList");
  const connectionEmpty = document.getElementById("connectionEmpty");
  const connectionCount = document.getElementById("connectionCount");

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;
  let cx = 0, cy = 0, radius = 0;
  let rotation = { x: -0.18, y: 0.42 };
  let velocity = { x: 0, y: 0 };
  let zoom = 1;
  let editingId = null;
  let isNew = false;
  let projectedNodes = [];
  let connectState = null;
  let toastTimer = null;
  let tapTimer = null;
  let lastTap = { id: null, time: 0, blank: false };
  let highlightedId = null;
  let highlightUntil = 0;
  let panelCollapsed = localStorage.getItem(PANEL_KEY) === "hidden";
  let panelLastTap = { id: null, time: 0 };
  let panelPressTimer = null;
  let panelLongPressHandled = false;

  let autoView = {
    mode: 0,
    phase: "idle",
    from: null,
    target: null,
    startedAt: 0,
    duration: 0,
    holdUntil: 0,
    resumeAt: 0,
    lastFocusId: null
  };

  const AUTO_VIEW_LEVELS = [
    { label: "OFF", moving: 0, holdMin: 0, holdMax: 0 },
    { label: "SLOW", moving: 1.28, holdMin: 2600, holdMax: 3400 },
    { label: "MID", moving: 1.0, holdMin: 1800, holdMax: 2400 },
    { label: "FAST", moving: 0.72, holdMin: 1000, holdMax: 1500 }
  ];

  const pointers = new Map();
  let gesture = {
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    startedNodeId: null,
    longPressTimer: null,
    pinchDistance: 0,
    startZoom: 1,
    nodeMovingId: null,
    nodeMoveDirty: false
  };

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rgba(arr, alpha = 1) {
    return `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;
  }

  function randomPosition() {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dist = 0.55 + Math.pow(Math.random(), .72) * 2.15;
    return {
      x: Math.sin(phi) * Math.cos(theta) * dist,
      y: Math.sin(phi) * Math.sin(theta) * dist,
      z: Math.cos(phi) * dist
    };
  }

  function fibonacciDirection(index, total) {
    const count = Math.max(1, total);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (2 * (index + .5)) / count;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    return {
      x: Math.cos(theta) * radial,
      y,
      z: Math.sin(theta) * radial
    };
  }

  function clampNormalSeedSize(size) {
    const n = Number(size);
    if (!Number.isFinite(n)) return 1.0;
    return Math.max(SIZE_OPTIONS[0], Math.min(SIZE_OPTIONS[SIZE_OPTIONS.length - 1], n));
  }

  function randomColorKey() {
    return choice(COLOR_KEYS);
  }

  function randomNormalSize() {
    return choice(SIZE_OPTIONS);
  }

  function positionBesideMain() {
    if (!data?.currentId || data.nodes.length <= 1) {
      return inverseRotatePoint({ x: .56, y: 0, z: .10 });
    }

    const existing = data.nodes
      .filter(node => node.id !== data.currentId)
      .map(node => rotatePoint(node.pos));

    const phase = Math.random() * Math.PI * 2;
    const candidates = [];
    const radii = [.50, .60, .70];

    for (const r of radii) {
      for (let i = 0; i < 12; i++) {
        // Prefer horizontal positions first while still allowing a free nearby orbit.
        const baseAngles = [0, Math.PI, .22, Math.PI - .22, -.22, Math.PI + .22];
        const angle = i < baseAngles.length
          ? baseAngles[i]
          : phase + (i - baseAngles.length) * (Math.PI * 2 / 6);

        candidates.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r * .62,
          z: -.08 + Math.random() * .32
        });
      }
    }

    let best = candidates[0];
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      let nearest = Infinity;
      for (const point of existing) {
        const distance = Math.hypot(
          candidate.x - point.x,
          candidate.y - point.y,
          (candidate.z - point.z) * .28
        );
        nearest = Math.min(nearest, distance);
      }

      const horizontalBonus = Math.abs(candidate.x) * .12;
      const score = nearest + horizontalBonus;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return inverseRotatePoint(best);
  }

  function createNode(title, body, position = null) {
    return {
      id: uid(),
      title: title || "無題のSEED",
      body: body || "",
      pos: position || positionBesideMain(),
      color: randomColorKey(),
      size: randomNormalSize(),
      createdAt: Date.now()
    };
  }

  function defaultView() {
    return {
      rotation: { x: -0.18, y: 0.42 },
      zoom: 1
    };
  }

  function normalizeView(raw) {
    const fallback = defaultView();
    const x = Number(raw?.rotation?.x);
    const y = Number(raw?.rotation?.y);
    const storedZoom = Number(raw?.zoom);
    return {
      rotation: {
        x: Number.isFinite(x) ? Math.max(-1.45, Math.min(1.45, x)) : fallback.rotation.x,
        y: Number.isFinite(y) ? y : fallback.rotation.y
      },
      zoom: Number.isFinite(storedZoom) ? Math.max(.34, Math.min(4.2, storedZoom)) : fallback.zoom
    };
  }

  function createDemoUniverse(name = "UNIVERSE 01") {
    const demoTitles = ["記憶", "時間", "写真", "不在", "声", "夢", "境界", "約束", "光", "名前"];
    const nodes = demoTitles.map((title, i) => {
      const node = createNode(title, "", randomPosition());
      node.createdAt += i;
      return node;
    });
    return {
      id: uid(),
      name,
      createdAt: Date.now(),
      version: 3,
      nodes,
      links: [
        [nodes[0].id, nodes[2].id],
        [nodes[1].id, nodes[3].id],
        [nodes[4].id, nodes[5].id],
        [nodes[6].id, nodes[8].id]
      ],
      currentId: nodes[0].id,
      layoutBackup: null,
      view: defaultView()
    };
  }

  function createEmptyUniverse(name) {
    const first = createNode("最初のSEED", "", { x: 0, y: 0, z: 0 });
    return {
      id: uid(),
      name,
      createdAt: Date.now(),
      version: 3,
      nodes: [first],
      links: [],
      currentId: first.id,
      layoutBackup: null,
      view: defaultView()
    };
  }

  function normalizeUniverse(raw, fallbackName = "UNIVERSE 01") {
    const universe = raw && typeof raw === "object" ? raw : createDemoUniverse(fallbackName);
    universe.id ||= uid();
    universe.name = String(universe.name || fallbackName).trim() || fallbackName;
    universe.createdAt ||= Date.now();
    universe.version = 3;
    universe.nodes = Array.isArray(universe.nodes) ? universe.nodes : [];
    universe.links = Array.isArray(universe.links) ? universe.links : [];
    universe.nodes.forEach((node, index) => {
      node.id ||= uid();
      node.title ||= `SEED ${index + 1}`;
      node.body ||= "";
      if (!node.pos || !Number.isFinite(node.pos.x) || !Number.isFinite(node.pos.y) || !Number.isFinite(node.pos.z)) {
        node.pos = randomPosition();
      }
      node.color = LEGACY_COLOR_MAP[node.color] || node.color;
      if (!COLOR_KEYS.includes(node.color)) node.color = randomColorKey();
      node.size = clampNormalSeedSize(node.size);
      node.createdAt ||= Date.now() + index;
    });

    universe.links = universe.links.filter(link =>
      Array.isArray(link) &&
      link.length >= 2 &&
      universe.nodes.some(node => node.id === link[0]) &&
      universe.nodes.some(node => node.id === link[1]) &&
      link[0] !== link[1]
    );

    if (!universe.currentId || !universe.nodes.some(n => n.id === universe.currentId)) {
      universe.currentId = universe.nodes[0]?.id || null;
    }

    if (!universe.layoutBackup || typeof universe.layoutBackup.positions !== "object") {
      universe.layoutBackup = null;
    }

    universe.view = normalizeView(universe.view);
    return universe;
  }

  function normalizeStore(raw) {
    if (raw && raw.version === 4 && Array.isArray(raw.universes)) {
      const universes = raw.universes.map((item, index) =>
        normalizeUniverse(item, `UNIVERSE ${String(index + 1).padStart(2, "0")}`)
      );
      if (!universes.length) universes.push(createDemoUniverse());
      const activeUniverseId = universes.some(item => item.id === raw.activeUniverseId)
        ? raw.activeUniverseId
        : universes[0].id;
      return {
        version: 4,
        activeUniverseId,
        universes
      };
    }

    // v0.7 and earlier used one universe directly. Preserve it as UNIVERSE 01.
    const legacyUniverse = raw && typeof raw === "object"
      ? normalizeUniverse({ ...raw, id: raw.id || uid(), name: raw.name || "UNIVERSE 01" }, "UNIVERSE 01")
      : createDemoUniverse();

    return {
      version: 4,
      activeUniverseId: legacyUniverse.id,
      universes: [legacyUniverse]
    };
  }

  function loadStore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeStore(saved ? JSON.parse(saved) : null);
    } catch {
      return normalizeStore(null);
    }
  }

  let store = loadStore();
  let data = store.universes.find(item => item.id === store.activeUniverseId) || store.universes[0];

  function applyUniverseView() {
    const view = normalizeView(data.view);
    rotation = { ...view.rotation };
    zoom = view.zoom;
    velocity = { x: 0, y: 0 };
    if (autoView.mode > 0) resetAutoViewJourney(800);
  }

  function persistActiveUniverse() {
    data.view = {
      rotation: { x: rotation.x, y: rotation.y },
      zoom
    };
    const index = store.universes.findIndex(item => item.id === data.id);
    if (index >= 0) store.universes[index] = data;
    else store.universes.push(data);
    store.activeUniverseId = data.id;
  }

  function writeStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function saveData() {
    persistActiveUniverse();
    writeStore();
    renderConnectionPanel();
    updateArrangeControls();
    renderUniverseUI();
  }

  applyUniverseView();

  function showToast(message, duration = 1800) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  }

  function setSheet(sheet, open) {
    sheet.classList.toggle("open", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function closeAllUtilitySheets() {
    setSheet(menuSheet, false);
    setSheet(universeSheet, false);
    setSheet(helpSheet, false);
  }

  function renderUniverseUI() {
    if (!data || !store) return;

    activeUniverseName.textContent = data.name || "UNIVERSE";
    activeUniverseName.title = data.name || "UNIVERSE";
    universeMenuCount.textContent = `${store.universes.length} ${store.universes.length === 1 ? "UNIVERSE" : "UNIVERSES"}`;

    universeList.innerHTML = "";

    for (const universe of store.universes) {
      const row = document.createElement("div");
      row.className = "universe-row";
      row.classList.toggle("active", universe.id === data.id);

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "universe-open";
      openButton.dataset.universeId = universe.id;
      openButton.setAttribute("aria-label", `${universe.name}を開く`);

      const name = document.createElement("span");
      name.className = "universe-name";
      name.textContent = universe.name;

      const meta = document.createElement("span");
      meta.className = "universe-meta";
      const seedCount = universe.nodes?.length || 0;
      const seedLabel = `${seedCount} ${seedCount === 1 ? "SEED" : "SEEDS"}`;
      meta.textContent = universe.id === data.id ? `CURRENT · ${seedLabel}` : seedLabel;

      openButton.append(name, meta);

      const actions = document.createElement("div");
      actions.className = "universe-actions";

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "universe-action";
      renameButton.dataset.renameUniverseId = universe.id;
      renameButton.setAttribute("aria-label", `${universe.name}の名前を変更`);
      renameButton.textContent = "✎";

      const deleteUniverseButton = document.createElement("button");
      deleteUniverseButton.type = "button";
      deleteUniverseButton.className = "universe-action danger";
      deleteUniverseButton.dataset.deleteUniverseId = universe.id;
      deleteUniverseButton.setAttribute("aria-label", `${universe.name}を削除`);
      deleteUniverseButton.textContent = "×";
      deleteUniverseButton.disabled = store.universes.length <= 1;

      actions.append(renameButton, deleteUniverseButton);
      row.append(openButton, actions);
      universeList.appendChild(row);
    }
  }

  function switchUniverse(id, announce = true) {
    const next = store.universes.find(item => item.id === id);
    if (!next) return;

    if (next.id === data.id) {
      setSheet(universeSheet, false);
      setSheet(menuSheet, false);
      return;
    }

    persistActiveUniverse();
    data = next;
    store.activeUniverseId = next.id;
    applyUniverseView();

    editingId = null;
    isNew = false;
    connectState = null;
    projectedNodes = [];
    highlightedId = null;
    lastTap = { id: null, time: 0, blank: false };
    panelLastTap = { id: null, time: 0 };

    writeStore();
    renderConnectionPanel();
    updateArrangeControls();
    renderUniverseUI();
    closeAllUtilitySheets();

    if (announce) showToast(`「${data.name}」へ移動しました`, 1500);
  }

  function defaultUniverseName() {
    const used = new Set(store.universes.map(item => item.name));
    let index = store.universes.length + 1;
    let name = `UNIVERSE ${String(index).padStart(2, "0")}`;
    while (used.has(name)) {
      index += 1;
      name = `UNIVERSE ${String(index).padStart(2, "0")}`;
    }
    return name;
  }

  function createUniverse() {
    const suggestion = defaultUniverseName();
    const input = prompt("新しい宇宙の名前", suggestion);
    if (input === null) return;

    const name = input.trim() || suggestion;
    persistActiveUniverse();

    const universe = createEmptyUniverse(name);
    store.universes.push(universe);
    data = universe;
    store.activeUniverseId = universe.id;
    applyUniverseView();
    writeStore();
    renderConnectionPanel();
    updateArrangeControls();
    renderUniverseUI();
    closeAllUtilitySheets();
    showToast(`新しい宇宙「${name}」が生まれました`, 1700);

    setTimeout(() => openEditor(universe.currentId), 260);
  }

  function renameUniverse(id) {
    const universe = store.universes.find(item => item.id === id);
    if (!universe) return;

    const input = prompt("宇宙の名前を変更", universe.name);
    if (input === null) return;

    const nextName = input.trim();
    if (!nextName) {
      showToast("宇宙名を入力してください");
      return;
    }

    universe.name = nextName;
    if (universe.id === data.id) data.name = nextName;
    persistActiveUniverse();
    writeStore();
    renderUniverseUI();
    showToast("宇宙名を変更しました", 1300);
  }

  function deleteUniverse(id) {
    if (store.universes.length <= 1) {
      showToast("最後の宇宙は削除できません");
      return;
    }

    const universe = store.universes.find(item => item.id === id);
    if (!universe) return;
    if (!confirm(`宇宙「${universe.name}」と、その中のSEEDをすべて削除しますか？`)) return;

    persistActiveUniverse();
    const wasActive = data.id === id;
    store.universes = store.universes.filter(item => item.id !== id);

    if (wasActive) {
      data = store.universes[0];
      store.activeUniverseId = data.id;
      applyUniverseView();
    }

    writeStore();
    renderConnectionPanel();
    updateArrangeControls();
    renderUniverseUI();
    showToast("宇宙を削除しました", 1400);
  }

  function openHelp() {
    setSheet(menuSheet, false);
    setSheet(helpSheet, true);
  }

  function closeHelp() {
    localStorage.setItem(HELP_KEY, "seen");
    setSheet(helpSheet, false);
  }

  function buildColorPalette() {
    colorPalette.innerHTML = "";
    for (const key of COLOR_KEYS) {
      const palette = COLOR_PALETTES[key];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-chip";
      button.dataset.color = key;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", COLOR_NAMES[key]);
      button.title = COLOR_NAMES[key];
      button.style.background = `radial-gradient(circle at 30% 25%,
        ${rgba(palette.glow, 1)} 0%,
        ${rgba(palette.mid, 1)} 54%,
        ${rgba(palette.dark, 1)} 100%)`;

      button.addEventListener("click", () => selectColor(key));
      colorPalette.appendChild(button);
    }
  }

  function selectColor(key) {
    const selected = COLOR_KEYS.includes(key) ? key : "ice";
    colorInput.value = selected;
    selectedColorName.textContent = COLOR_NAMES[selected];

    colorPalette.querySelectorAll(".color-chip").forEach(button => {
      const active = button.dataset.color === selected;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  function getConnectedNodes() {
    const currentId = data.currentId;
    if (!currentId) return [];

    const ids = [];
    const seen = new Set();

    for (const [a, b] of data.links) {
      let other = null;
      if (a === currentId) other = b;
      if (b === currentId) other = a;
      if (other && !seen.has(other)) {
        seen.add(other);
        ids.push(other);
      }
    }

    return ids
      .map(id => data.nodes.find(node => node.id === id))
      .filter(Boolean);
  }

  function createPanelSeedButton(node, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.seedId = node.id;
    button.textContent = node.title || "無題のSEED";
    button.title = node.title || "無題のSEED";
    return button;
  }

  function renderConnectionPanel() {
    if (!connectionPanel) return;

    const current = data.nodes.find(node => node.id === data.currentId) || null;
    panelMainTitle.textContent = current?.title || "NO MAIN";
    panelMainTitle.title = current?.title || "NO MAIN";
    panelMainTitle.disabled = !current;

    if (current) {
      panelMainTitle.dataset.seedId = current.id;
    } else {
      delete panelMainTitle.dataset.seedId;
    }

    const connected = getConnectedNodes();
    connectionCount.textContent = String(connected.length);
    connectionList.innerHTML = "";

    for (const node of connected) {
      connectionList.appendChild(createPanelSeedButton(node, "connection-item"));
    }

    connectionEmpty.hidden = connected.length > 0;
    applyPanelState();
  }

  function applyPanelState() {
    connectionPanel.classList.toggle("collapsed", panelCollapsed);
    connectionPanelToggle.textContent = panelCollapsed ? "‹" : "›";
    connectionPanelToggle.setAttribute("aria-expanded", panelCollapsed ? "false" : "true");
    connectionPanelToggle.setAttribute(
      "aria-label",
      panelCollapsed ? "接続一覧を表示" : "接続一覧を隠す"
    );
  }

  function setPanelCollapsed(collapsed) {
    panelCollapsed = Boolean(collapsed);
    localStorage.setItem(PANEL_KEY, panelCollapsed ? "hidden" : "visible");
    applyPanelState();
  }

  function focusSeed(id) {
    const node = data.nodes.find(item => item.id === id);
    if (!node) return;

    highlightedId = id;
    highlightUntil = performance.now() + 2300;

    connectionPanel.querySelectorAll("[data-seed-id]").forEach(button => {
      button.classList.toggle("focused", button.dataset.seedId === id);
    });

    setTimeout(() => {
      if (highlightedId !== id) return;
      connectionPanel.querySelectorAll("[data-seed-id]").forEach(button => {
        button.classList.remove("focused");
      });
    }, 1800);

    showToast(`「${node.title}」を発光`, 1150);
  }

  function updateArrangeControls() {
    restoreLayoutButton.disabled = !data.layoutBackup;
  }

  function captureLayoutBackup() {
    const positions = {};
    for (const node of data.nodes) {
      if (node.id === data.currentId) continue;
      positions[node.id] = {
        x: node.pos.x,
        y: node.pos.y,
        z: node.pos.z
      };
    }
    data.layoutBackup = {
      createdAt: Date.now(),
      positions
    };
  }

  function setCompactPosition(node, direction, distance) {
    node.pos = {
      x: direction.x * distance,
      y: direction.y * distance,
      z: direction.z * distance
    };
  }

  function arrangeEven(nodes) {
    const count = nodes.length;
    nodes
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .forEach((node, index) => {
        const direction = fibonacciDirection(index, count);
        const ratio = (index + 1) / count;
        const distance = .18 + .56 * Math.cbrt(ratio);
        setCompactPosition(node, direction, distance);
      });
  }

  function arrangeBySize(nodes) {
    const sorted = nodes
      .slice()
      .sort((a, b) => (b.size || 1) - (a.size || 1) || (a.createdAt || 0) - (b.createdAt || 0));

    const count = sorted.length;
    sorted.forEach((node, index) => {
      const direction = fibonacciDirection(index, count);
      const ratio = count <= 1 ? 0 : index / (count - 1);
      const distance = .20 + .54 * Math.pow(ratio, .80);
      setCompactPosition(node, direction, distance);
    });
  }

  function arrangeByColor(nodes) {
    const groups = COLOR_KEYS
      .map(key => ({
        key,
        nodes: nodes
          .filter(node => node.color === key)
          .sort((a, b) => (b.size || 1) - (a.size || 1))
      }))
      .filter(group => group.nodes.length > 0);

    groups.forEach((group, groupIndex) => {
      const centerDirection = fibonacciDirection(groupIndex, groups.length);
      const centerDistance = groups.length === 1 ? .30 : .43;
      const center = {
        x: centerDirection.x * centerDistance,
        y: centerDirection.y * centerDistance,
        z: centerDirection.z * centerDistance
      };

      const spread = Math.min(.18, .075 + Math.sqrt(group.nodes.length) * .016);

      group.nodes.forEach((node, index) => {
        if (group.nodes.length === 1) {
          node.pos = { ...center };
          return;
        }

        const localDirection = fibonacciDirection(index, group.nodes.length);
        const localDistance = .035 + spread * Math.cbrt((index + 1) / group.nodes.length);
        node.pos = {
          x: center.x + localDirection.x * localDistance,
          y: center.y + localDirection.y * localDistance,
          z: center.z + localDirection.z * localDistance
        };
      });
    });
  }

  function arrangeNodes(mode) {
    const nodes = data.nodes.filter(node => node.id !== data.currentId);
    if (!nodes.length) {
      showToast("整列する通常SEEDがありません");
      return;
    }

    captureLayoutBackup();

    if (mode === "size") arrangeBySize(nodes);
    if (mode === "color") arrangeByColor(nodes);
    if (mode === "even") arrangeEven(nodes);

    zoom = 1;
    velocity = { x: 0, y: 0 };
    saveData();
    setSheet(menuSheet, false);

    const labels = {
      size: "サイズ順に小さく整列しました",
      color: "色別に小さく整列しました",
      even: "均等に小さく整列しました"
    };
    showToast(labels[mode] || "小さく整列しました", 1500);
  }

  function restoreLayout() {
    const backup = data.layoutBackup;
    if (!backup?.positions) {
      showToast("戻せる整列前配置がありません");
      return;
    }

    for (const node of data.nodes) {
      const position = backup.positions[node.id];
      if (!position) continue;
      node.pos = {
        x: Number(position.x) || 0,
        y: Number(position.y) || 0,
        z: Number(position.z) || 0
      };
    }

    data.layoutBackup = null;
    saveData();
    setSheet(menuSheet, false);
    showToast("整列前の配置に戻しました", 1500);
  }

  function openEditor(id = null) {
    isNew = !id;
    editingId = id;
    const node = id ? data.nodes.find(n => n.id === id) : null;
    titleInput.value = node?.title || "";
    bodyInput.value = node?.body || "";

    const draftColor = node?.color || randomColorKey();
    const draftSize = node?.size ?? randomNormalSize();
    selectColor(draftColor);
    sizeInput.value = String(draftSize);
    deleteButton.hidden = isNew;
    unlinkButton.hidden = isNew;
    centerButton.hidden = isNew;
    setSheet(editorSheet, true);
    setTimeout(() => titleInput.focus(), 280);
  }

  function closeEditor() {
    setSheet(editorSheet, false);
    editingId = null;
    isNew = false;
  }

  function addSeed(title, body) {
    const node = createNode(title, body);
    data.nodes.push(node);
    if (!data.currentId) data.currentId = node.id;
    saveData();
    showToast("新しいSEEDが生まれました");
    return node;
  }

  function removeSeed(id) {
    data.nodes = data.nodes.filter(n => n.id !== id);
    data.links = data.links.filter(link => !link.includes(id));
    if (data.currentId === id) data.currentId = data.nodes[0]?.id || null;
    saveData();
  }

  function removeLinksForSeed(id) {
    const before = data.links.length;
    data.links = data.links.filter(link => !link.includes(id));
    const removed = before - data.links.length;
    if (removed) saveData();
    return removed;
  }

  function clearAllLinks() {
    const removed = data.links.length;
    data.links = [];
    if (removed) saveData();
    return removed;
  }

  function toggleLink(a, b) {
    if (!a || !b || a === b) return;
    const index = data.links.findIndex(link =>
      (link[0] === a && link[1] === b) || (link[0] === b && link[1] === a)
    );
    if (index >= 0) {
      data.links.splice(index, 1);
      showToast("接続を外しました");
    } else {
      data.links.push([a, b]);
      showToast("SEEDが接続されました");
    }
    saveData();
  }

  function setCurrent(id) {
    if (!data.nodes.some(n => n.id === id)) return;
    data.currentId = id;
    if (autoView.mode > 0) resetAutoViewJourney(900);
    saveData();
    showToast("メインSEEDにしました");
  }

  function rotatePoint(pos) {
    const cosy = Math.cos(rotation.y), siny = Math.sin(rotation.y);
    const cosx = Math.cos(rotation.x), sinx = Math.sin(rotation.x);

    const x1 = pos.x * cosy + pos.z * siny;
    const z1 = -pos.x * siny + pos.z * cosy;
    const y1 = pos.y * cosx - z1 * sinx;
    const z2 = pos.y * sinx + z1 * cosx;
    return { x: x1, y: y1, z: z2 };
  }

  function inverseRotatePoint(pos) {
    const cosy = Math.cos(rotation.y), siny = Math.sin(rotation.y);
    const cosx = Math.cos(rotation.x), sinx = Math.sin(rotation.x);

    const y1 = pos.y * cosx + pos.z * sinx;
    const z1 = -pos.y * sinx + pos.z * cosx;
    const x = pos.x * cosy - z1 * siny;
    const z = pos.x * siny + z1 * cosy;
    return { x, y: y1, z };
  }

  function moveNodeInVolume(nodeId, screenX, screenY) {
    const node = data.nodes.find(n => n.id === nodeId);
    if (!node || node.id === data.currentId) return;

    const currentCamera = rotatePoint(node.pos);
    const depth = Math.max(-2.60, Math.min(2.60, currentCamera.z));
    const perspective = 3.2 / (4.4 - depth);
    const projectionBase = Math.max(1, radius * zoom * perspective);

    // Map the finger position back into the 3D volume.
    // The node may sit far outside the visual guide sphere.
    let px = (screenX - cx) / projectionBase;
    let py = (screenY - cy) / projectionBase;
    px = Math.max(-3.20, Math.min(3.20, px));
    py = Math.max(-3.20, Math.min(3.20, py));

    const world = inverseRotatePoint({ x: px, y: py, z: currentCamera.z });
    const dist = Math.hypot(world.x, world.y, world.z) || 1;
    const fit = dist > MAX_FREE_DISTANCE ? MAX_FREE_DISTANCE / dist : 1;

    node.pos = {
      x: world.x * fit,
      y: world.y * fit,
      z: world.z * fit
    };
    gesture.nodeMoveDirty = true;
  }

  function projectNode(node) {
    if (node.id === data.currentId) {
      return {
        node,
        x: cx,
        y: cy,
        z: 0,
        scale: 1,
        core: true,
        projected: { x: 0, y: 0, z: 0 }
      };
    }

    const p = rotatePoint(node.pos);
    const depth = Math.max(-2.60, Math.min(2.60, p.z));
    // Stronger near/far difference. A front planet may visually exceed the sun.
    const perspective = 3.2 / (4.4 - depth);

    return {
      node,
      x: cx + p.x * radius * perspective * zoom,
      y: cy + p.y * radius * perspective * zoom,
      z: p.z,
      depth,
      scale: perspective,
      core: false,
      projected: p
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = width / 2;
    cy = height * 0.52;
    radius = Math.min(width, height) * 0.43;
  }

  const dust = Array.from({ length: 110 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.4 + Math.random() * 1.6,
    a: 0.03 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2
  }));

  function drawBackground(time) {
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.84);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.52, "#f8fbff");
    bg.addColorStop(1, "#e8f0f8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    dust.forEach((p) => {
      const driftX = Math.sin(time * 0.00018 + p.phase) * 6;
      const driftY = Math.cos(time * 0.00015 + p.phase) * 4;
      const twinkle = .58 + Math.sin(time * 0.001 + p.phase) * .22;
      ctx.beginPath();
      ctx.arc(p.x * width + driftX, p.y * height + driftY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(38,78,121,${p.a * twinkle})`;
      ctx.fill();
    });

    const guideRadius = radius * zoom * GUIDE_SCALE;
    const guideFade = Math.max(.025, .07 / Math.max(.75, zoom));

    const halo = ctx.createRadialGradient(cx, cy, guideRadius * .42, cx, cy, guideRadius * 1.26);
    halo.addColorStop(0, "rgba(255,255,255,0)");
    halo.addColorStop(.74, "rgba(70,116,166,0.018)");
    halo.addColorStop(1, "rgba(37,83,133,0.082)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, guideRadius * 1.26, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = `rgba(31,70,113,${guideFade})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, guideRadius * 1.01, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, guideRadius * 1.01, guideRadius * .28, rotation.y * .2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, guideRadius * .35, guideRadius * 1.01, rotation.x * .18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function linePoint(id) {
    return projectedNodes.find(p => p.node.id === id);
  }

  function drawLinks() {
    ctx.save();
    for (const [a, b] of data.links) {
      const pa = linePoint(a), pb = linePoint(b);
      if (!pa || !pb) continue;
      const depth = Math.max(-1, Math.min(1, (pa.z + pb.z) / 2));
      const alpha = 0.10 + (depth + 1) * 0.14;
      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, `rgba(30,78,132,${alpha})`);
      grad.addColorStop(.5, `rgba(96,156,214,${Math.min(.58, alpha + .22)})`);
      grad.addColorStop(1, `rgba(30,78,132,${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = (pa.core || pb.core) ? 1.9 : 1.05;
      ctx.shadowColor = "rgba(77,146,210,.28)";
      ctx.shadowBlur = (pa.core || pb.core) ? 12 : 7;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2 - Math.abs(pa.x - pb.x) * .045;
      ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
      ctx.stroke();
    }

    if (connectState) {
      const start = linePoint(connectState.fromId);
      if (start) {
        ctx.strokeStyle = "rgba(26,75,128,.76)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(49,110,173,.36)";
        ctx.shadowBlur = 12;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(connectState.x, connectState.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  function truncateText(text, max) {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  function drawPlanet(x, y, r, palette, depthAlpha = 1, depthStrength = 1, core = false) {
    ctx.save();
    ctx.globalAlpha = core ? 1 : depthAlpha;

    const glow = ctx.createRadialGradient(
      x - r * .28, y - r * .30, r * .08,
      x, y, r * (core ? 1.82 : 1.62)
    );
    glow.addColorStop(0, rgba(palette.glow, core ? .98 : .84));
    glow.addColorStop(.48, rgba(palette.mid, core ? .34 : .18 + depthStrength * .12));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * (core ? 1.82 : 1.62), 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = core
      ? "rgba(76,142,206,.56)"
      : `rgba(${palette.dark[0]},${palette.dark[1]},${palette.dark[2]},${.10 + depthStrength * .30})`;
    ctx.shadowBlur = core ? 25 : 4 + depthStrength * 12;

    const body = ctx.createRadialGradient(x - r * .36, y - r * .38, r * .10, x, y, r);
    body.addColorStop(0, rgba(palette.glow, .99));
    body.addColorStop(.52, rgba(palette.mid, .97));
    body.addColorStop(1, rgba(palette.dark, .88 + depthStrength * .12));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = core
      ? "rgba(18,65,108,.92)"
      : rgba(palette.dark, .30 + depthStrength * .62);
    ctx.lineWidth = core ? 1.35 : .75 + depthStrength * .55;
    ctx.stroke();

    if (core) {
      ctx.strokeStyle = "rgba(125,188,231,.68)";
      ctx.lineWidth = .85;
      ctx.beginPath();
      ctx.arc(x, y, r * .78, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLabel(p, title, mode, palette, depthAlpha, depthStrength) {
    const radiusPx = p.renderRadius;
    const labelAlpha = p.core ? .98 : Math.max(.08, depthAlpha * (.56 + depthStrength * .44));
    const textSize = p.core ? 15 : (mode === 1 ? 11 : 12.5);
    ctx.font = `${p.core ? 650 : 560} ${textSize}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`;
    const textW = ctx.measureText(title).width;

    const ringW = radiusPx * (p.core ? 2.1 : 1.9) + textW + 26;
    const ringH = radiusPx * (p.core ? .90 : .78);

    ctx.save();
    ctx.globalAlpha = labelAlpha;
    ctx.strokeStyle = rgba(palette.label, p.core ? .38 : .18 + depthStrength * .30);
    ctx.lineWidth = .80 + depthStrength * .30;
    ctx.beginPath();
    ctx.ellipse(p.x + radiusPx * .42, p.y, ringW / 2, ringH / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = rgba(palette.label, p.core ? .98 : .50 + depthStrength * .50);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, p.x + radiusPx + 12, p.y);

    const hitX = p.x - radiusPx;
    const hitY = p.y - Math.max(radiusPx, 18);
    const hitW = ringW * .72 + radiusPx;
    const hitH = Math.max(32, ringH + 18);
    p.hit = { x: hitX, y: hitY, w: hitW, h: hitH, r: Math.max(radiusPx, hitH / 2) };
    ctx.restore();
  }

  function drawHighlightAura(p, palette, time) {
    const radius = p.renderRadius || 10;
    const pulse = 1 + Math.sin(time * .010) * .08;

    ctx.save();
    ctx.globalAlpha = .86;
    ctx.strokeStyle = rgba(palette.mid, .76);
    ctx.lineWidth = 1.25;
    ctx.shadowColor = rgba(palette.mid, .68);
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 1.82 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = .42;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 2.24 / pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawNode(p, time) {
    const node = p.node;
    const palette = COLOR_PALETTES[node.color] || COLOR_PALETTES.ice;
    const dense = data.nodes.length >= 42;

    const depthNorm = p.core
      ? .62
      : Math.max(0, Math.min(1, ((p.depth ?? p.z) + 2.60) / 5.20));
    const depthStrength = Math.pow(depthNorm, .88);
    const depthAlpha = p.core ? 1 : .14 + depthStrength * .86;

    const zoomSize = Math.pow(Math.max(.34, zoom), .17);
    const baseRadius = p.core
      ? 21.5 + Math.sin(time * .0022) * 1.15
      : 11.8 * (node.size || 1) * p.scale * zoomSize;

    const renderRadius = p.core
      ? Math.max(18, Math.min(25, baseRadius))
      : Math.max(3.2, Math.min(34, baseRadius));

    p.renderRadius = renderRadius;

    drawPlanet(
      p.x,
      p.y,
      renderRadius,
      palette,
      depthAlpha,
      depthStrength,
      p.core
    );

    if (highlightedId === node.id && time < highlightUntil) {
      drawHighlightAura(p, palette, time);
    }

    let mode = 2;

    if (!p.core) {
      const depth = p.depth ?? p.z;
      const farView = zoom < .92;
      const foregroundAtFar = farView && depth > 1.05;

      if (farView) {
        // v0.7: only foreground planets introduce themselves in a distant view.
        mode = foregroundAtFar ? 1 : 0;
      } else if (
        depth < -0.55 ||
        (dense && zoom < 1.35 && depth < .62)
      ) {
        mode = 0;
      } else if (
        zoom < 1.70 ||
        (dense && depth < .12)
      ) {
        mode = 1;
      }
    }

    if (mode === 0) {
      const hitRadius = Math.max(15, renderRadius + 7);
      p.hit = {
        x: p.x - hitRadius,
        y: p.y - hitRadius,
        w: hitRadius * 2,
        h: hitRadius * 2,
        r: hitRadius
      };
      return;
    }

    const title = truncateText(node.title || "SEED", p.core ? 18 : (mode === 1 ? 9 : 18));
    drawLabel(p, title, mode, palette, depthAlpha, depthStrength);
  }

  function normalizeAngleNear(angle, reference) {
    const turn = Math.PI * 2;
    let result = angle;
    while (result - reference > Math.PI) result -= turn;
    while (result - reference < -Math.PI) result += turn;
    return result;
  }

  function easeSmootherStep(t) {
    const n = Math.max(0, Math.min(1, t));
    return n * n * n * (n * (n * 6 - 15) + 10);
  }

  function connectedToMain() {
    if (!data.currentId) return [];
    const ids = [];
    for (const [a, b] of data.links) {
      if (a === data.currentId) ids.push(b);
      else if (b === data.currentId) ids.push(a);
    }
    return ids
      .map(id => data.nodes.find(node => node.id === id))
      .filter(Boolean);
  }

  function chooseAutoViewFocus() {
    const connected = connectedToMain();
    const fallback = data.nodes.filter(node => node.id !== data.currentId);
    const pool = connected.length ? connected : fallback;
    if (!pool.length) return null;

    const alternatives = pool.filter(node => node.id !== autoView.lastFocusId);
    const choices = alternatives.length ? alternatives : pool;
    const focus = choice(choices);
    autoView.lastFocusId = focus.id;
    return focus;
  }

  function planAutoView(time) {
    const focus = chooseAutoViewFocus();
    let targetX;
    let targetY;

    if (focus) {
      const horizontal = Math.hypot(focus.pos.x, focus.pos.z) || 0.0001;
      const faceYaw = -Math.atan2(focus.pos.x, focus.pos.z);
      const facePitch = Math.atan2(focus.pos.y, horizontal);
      const side = Math.random() < .5 ? -1 : 1;

      // Keep the chosen SEED near, but not directly on top of, the central MAIN SEED.
      targetY = faceYaw + side * (.24 + Math.random() * .42);
      targetX = facePitch + (Math.random() - .5) * .54;
    } else {
      targetY = rotation.y + (Math.random() < .5 ? -1 : 1) * (.85 + Math.random() * 1.55);
      targetX = -1.02 + Math.random() * 2.04;
    }

    targetX = Math.max(-1.25, Math.min(1.25, targetX));
    targetY = normalizeAngleNear(targetY, rotation.y);

    const distance = Math.hypot(targetX - rotation.x, targetY - rotation.y);
    const level = AUTO_VIEW_LEVELS[autoView.mode] || AUTO_VIEW_LEVELS[2];
    autoView.from = { x: rotation.x, y: rotation.y };
    autoView.target = { x: targetX, y: targetY };
    autoView.startedAt = time;
    autoView.duration = Math.max(1800, Math.min(13000, (5200 + distance * 2600) * level.moving));
    autoView.phase = "moving";
    velocity = { x: 0, y: 0 };
  }

  function autoViewBlocked() {
    return pointers.size > 0 ||
      gesture.dragging ||
      Boolean(connectState) ||
      document.visibilityState === "hidden" ||
      document.querySelector(".sheet.open") !== null;
  }

  function updateAutoView(time) {
    if (autoView.mode === 0) return false;

    if (autoViewBlocked()) {
      autoView.phase = "waiting";
      autoView.resumeAt = time + 2100;
      return false;
    }

    if (time < autoView.resumeAt) return false;

    if (autoView.phase === "idle" || autoView.phase === "waiting") {
      planAutoView(time);
    }

    if (autoView.phase === "moving") {
      const progress = (time - autoView.startedAt) / autoView.duration;
      const eased = easeSmootherStep(progress);
      rotation.x = autoView.from.x + (autoView.target.x - autoView.from.x) * eased;
      rotation.y = autoView.from.y + (autoView.target.y - autoView.from.y) * eased;

      if (progress >= 1) {
        const level = AUTO_VIEW_LEVELS[autoView.mode] || AUTO_VIEW_LEVELS[2];
        rotation = { ...autoView.target };
        autoView.phase = "holding";
        autoView.holdUntil = time + level.holdMin + Math.random() * Math.max(0, level.holdMax - level.holdMin);
      }
      return true;
    }

    if (autoView.phase === "holding") {
      if (time >= autoView.holdUntil) planAutoView(time);
      return true;
    }

    return false;
  }

  function refreshAutoViewButton() {
    const current = AUTO_VIEW_LEVELS[autoView.mode] || AUTO_VIEW_LEVELS[0];
    const active = autoView.mode > 0;
    autoViewButton.classList.toggle("active", active);
    autoViewButton.setAttribute("aria-pressed", active ? "true" : "false");
    autoViewButton.setAttribute("aria-label", `自動鑑賞 ${current.label}`);
    const label = autoViewButton.querySelector(".auto-view-label");
    if (label) label.textContent = `AUTO : ${current.label}`;
  }

  function resetAutoViewJourney(delay = 700) {
    autoView.phase = "idle";
    autoView.from = null;
    autoView.target = null;
    autoView.resumeAt = performance.now() + delay;
    autoView.lastFocusId = null;
  }

  function setAutoViewMode(mode) {
    autoView.mode = Number(mode) || 0;
    velocity = { x: 0, y: 0 };
    resetAutoViewJourney(autoView.mode > 0 ? 280 : 0);
    refreshAutoViewButton();
    const current = AUTO_VIEW_LEVELS[autoView.mode] || AUTO_VIEW_LEVELS[0];
    showToast(`AUTO VIEW : ${current.label}`, 1300);
  }

  function cycleAutoViewMode() {
    setAutoViewMode((autoView.mode + 1) % AUTO_VIEW_LEVELS.length);
  }

  function render(time = 0) {
    const autoViewApplied = updateAutoView(time);
    velocity.x *= 0.94;
    velocity.y *= 0.94;
    if (!autoViewApplied && !gesture.dragging && !connectState) {
      rotation.x += velocity.x;
      rotation.y += velocity.y;
    }

    drawBackground(time);
    projectedNodes = data.nodes.map(projectNode).sort((a, b) => a.z - b.z);
    drawLinks();
    projectedNodes.forEach(p => drawNode(p, time));
    requestAnimationFrame(render);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hitTest(x, y, excludeId = null) {
    const sorted = [...projectedNodes].sort((a, b) => b.z - a.z);
    return sorted.find(p => {
      if (p.node.id === excludeId || !p.hit) return false;
      return x >= p.hit.x - 8 && x <= p.hit.x + p.hit.w + 8 &&
             y >= p.hit.y - 8 && y <= p.hit.y + p.hit.h + 8;
    }) || null;
  }

  function clearLongPress() {
    clearTimeout(gesture.longPressTimer);
    gesture.longPressTimer = null;
  }

  function beginLongPress(point, nodeId) {
    clearLongPress();
    if (!nodeId) return;
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture.moved && pointers.size === 1) {
        connectState = { fromId: nodeId, x: point.x, y: point.y };
        gesture.dragging = false;
        showToast("別のSEEDへ重ねると接続します", 2200);
      }
    }, 480);
  }

  function onPointerDown(event) {
    canvas.setPointerCapture?.(event.pointerId);
    const p = canvasPoint(event);
    pointers.set(event.pointerId, p);
    gesture.moved = false;
    gesture.lastX = p.x;
    gesture.lastY = p.y;
    gesture.lastTime = performance.now();
    const hit = hitTest(p.x, p.y);
    gesture.startedNodeId = hit?.node.id || null;

    if (pointers.size === 1) {
      gesture.dragging = !gesture.startedNodeId;
      gesture.nodeMovingId = null;
      gesture.nodeMoveDirty = false;
      beginLongPress(p, gesture.startedNodeId);
    } else if (pointers.size === 2) {
      clearLongPress();
      gesture.dragging = false;
      const pts = [...pointers.values()];
      gesture.pinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      gesture.startZoom = zoom;
    }
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    const p = canvasPoint(event);
    pointers.set(event.pointerId, p);

    if (connectState) {
      connectState.x = p.x;
      connectState.y = p.y;
      gesture.moved = true;
      return;
    }

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (gesture.pinchDistance > 0) {
        zoom = Math.max(.34, Math.min(4.2, gesture.startZoom * dist / gesture.pinchDistance));
      }
      gesture.moved = true;
      return;
    }

    const dx = p.x - gesture.lastX;
    const dy = p.y - gesture.lastY;
    const movement = Math.hypot(dx, dy);

    if (gesture.startedNodeId && movement > 3) {
      clearLongPress();
      gesture.moved = true;
      gesture.nodeMovingId = gesture.startedNodeId;
      moveNodeInVolume(gesture.nodeMovingId, p.x, p.y);
      gesture.lastX = p.x;
      gesture.lastY = p.y;
      gesture.lastTime = performance.now();
      return;
    }

    if (!gesture.dragging) return;
    if (movement > 3) {
      gesture.moved = true;
      clearLongPress();
    }

    const now = performance.now();
    const dt = Math.max(8, now - gesture.lastTime);
    const factor = 0.006 / Math.max(.72, zoom);
    rotation.y += dx * factor;
    rotation.x += dy * factor;
    rotation.x = Math.max(-1.45, Math.min(1.45, rotation.x));
    velocity.y = (dx * factor) * (16 / dt);
    velocity.x = (dy * factor) * (16 / dt);
    gesture.lastX = p.x;
    gesture.lastY = p.y;
    gesture.lastTime = now;
  }

  function handleTap(point) {
    const hit = hitTest(point.x, point.y);
    const now = Date.now();

    if (hit) {
      const sameDouble = lastTap.id === hit.node.id && now - lastTap.time < 330;
      if (sameDouble) {
        clearTimeout(tapTimer);
        lastTap = { id: null, time: 0, blank: false };
        setCurrent(hit.node.id);
      } else {
        lastTap = { id: hit.node.id, time: now, blank: false };
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => openEditor(hit.node.id), 335);
      }
    } else {
      const blankDouble = lastTap.blank && now - lastTap.time < 330;
      if (blankDouble) {
        clearTimeout(tapTimer);
        lastTap = { id: null, time: 0, blank: false };
        openEditor();
      } else {
        lastTap = { id: null, time: now, blank: true };
      }
    }
  }

  function onPointerUp(event) {
    const p = canvasPoint(event);
    clearLongPress();

    if (connectState) {
      const target = hitTest(p.x, p.y, connectState.fromId);
      if (target) toggleLink(connectState.fromId, target.node.id);
      else showToast("接続をキャンセルしました", 1100);
      connectState = null;
    } else if (gesture.nodeMovingId) {
      if (gesture.nodeMoveDirty) {
        saveData();
        showToast("SEEDの位置を移動しました", 1100);
      }
    } else if (!gesture.moved && pointers.size === 1) {
      handleTap(p);
    }

    gesture.nodeMovingId = null;
    gesture.nodeMoveDirty = false;
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      gesture.dragging = false;
      gesture.pinchDistance = 0;
    } else if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      gesture.dragging = true;
      gesture.lastX = remaining.x;
      gesture.lastY = remaining.y;
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", e => e.preventDefault());

  addButton.addEventListener("click", () => openEditor());
  autoViewButton.addEventListener("click", cycleAutoViewMode);
  menuButton.addEventListener("click", () => setSheet(menuSheet, true));
  universeButton.addEventListener("click", () => setSheet(universeSheet, true));
  universeMenuButton.addEventListener("click", () => {
    setSheet(menuSheet, false);
    setSheet(universeSheet, true);
  });
  helpButton.addEventListener("click", openHelp);
  closeHelpButton.addEventListener("click", closeHelp);
  createUniverseButton.addEventListener("click", createUniverse);

  document.querySelectorAll("[data-close-sheet]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-close-menu]").forEach(el => el.addEventListener("click", () => setSheet(menuSheet, false)));
  document.querySelectorAll("[data-close-universe]").forEach(el => el.addEventListener("click", () => setSheet(universeSheet, false)));
  document.querySelectorAll("[data-close-help]").forEach(el => el.addEventListener("click", closeHelp));

  universeList.addEventListener("click", event => {
    const openTarget = event.target.closest("[data-universe-id]");
    if (openTarget) {
      switchUniverse(openTarget.dataset.universeId);
      return;
    }

    const renameTarget = event.target.closest("[data-rename-universe-id]");
    if (renameTarget) {
      renameUniverse(renameTarget.dataset.renameUniverseId);
      return;
    }

    const deleteTarget = event.target.closest("[data-delete-universe-id]");
    if (deleteTarget) {
      deleteUniverse(deleteTarget.dataset.deleteUniverseId);
    }
  });

  connectionPanelToggle.addEventListener("click", () => {
    setPanelCollapsed(!panelCollapsed);
  });

  connectionPanel.addEventListener("pointerdown", event => {
    const target = event.target.closest("[data-seed-id]");
    if (!target) return;

    panelLongPressHandled = false;
    clearTimeout(panelPressTimer);
    panelPressTimer = setTimeout(() => {
      panelLongPressHandled = true;
      openEditor(target.dataset.seedId);
    }, 560);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach(type => {
    connectionPanel.addEventListener(type, () => {
      clearTimeout(panelPressTimer);
      panelPressTimer = null;
    });
  });

  connectionPanel.addEventListener("click", event => {
    const target = event.target.closest("[data-seed-id]");
    if (!target) return;

    if (panelLongPressHandled) {
      panelLongPressHandled = false;
      return;
    }

    const id = target.dataset.seedId;
    const now = Date.now();
    const secondTap = panelLastTap.id === id && now - panelLastTap.time < 1050;

    if (secondTap) {
      panelLastTap = { id: null, time: 0 };
      openEditor(id);
    } else {
      panelLastTap = { id, time: now };
      focusSeed(id);
    }
  });


  saveButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const color = COLOR_KEYS.includes(colorInput.value) ? colorInput.value : "ice";
    const size = clampNormalSeedSize(sizeInput.value);

    if (!title && !body) {
      showToast("名前か本文を入れてください");
      return;
    }

    if (isNew) {
      const node = addSeed(title || "無題のSEED", body);
      node.color = color;
      node.size = size;
      saveData();
    } else {
      const node = data.nodes.find(n => n.id === editingId);
      if (node) {
        node.title = title || "無題のSEED";
        node.body = body;
        node.color = color;
        node.size = size;
        saveData();
        showToast("保存しました");
      }
    }
    closeEditor();
  });

  unlinkButton.addEventListener("click", () => {
    if (!editingId) return;
    const removed = removeLinksForSeed(editingId);
    showToast(removed ? `${removed}件の接続を解除しました` : "このSEEDに接続はありません", 1500);
  });

  centerButton.addEventListener("click", () => {
    if (editingId) setCurrent(editingId);
    closeEditor();
  });

  deleteButton.addEventListener("click", () => {
    const node = data.nodes.find(n => n.id === editingId);
    if (!node) return;
    if (confirm(`「${node.title}」を削除しますか？`)) {
      removeSeed(node.id);
      closeEditor();
      showToast("削除しました");
    }
  });

  exportButton.addEventListener("click", () => {
    persistActiveUniverse();
    const payload = JSON.stringify(store, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SEED-multiverse-backup-${date}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("バックアップを書き出しました");
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      store = normalizeStore(parsed);
      data = store.universes.find(item => item.id === store.activeUniverseId) || store.universes[0];
      applyUniverseView();
      saveData();
      closeAllUtilitySheets();
      showToast("バックアップを読み込みました");
    } catch {
      showToast("読み込めないファイルです");
    } finally {
      importInput.value = "";
    }
  });

  resetViewButton.addEventListener("click", () => {
    rotation = { x: -0.18, y: 0.42 };
    velocity = { x: 0, y: 0 };
    zoom = 1;
    if (autoView.mode > 0) resetAutoViewJourney(1100);
    saveData();
    setSheet(menuSheet, false);
    showToast("球体の向きを戻しました");
  });

  dismissHintButton.addEventListener("click", () => {
    const hidden = !gestureHint.classList.contains("hidden");
    gestureHint.classList.toggle("hidden", hidden);
    localStorage.setItem(HINT_KEY, hidden ? "hidden" : "visible");
    setSheet(menuSheet, false);
  });

  arrangeSizeButton.addEventListener("click", () => arrangeNodes("size"));
  arrangeColorButton.addEventListener("click", () => arrangeNodes("color"));
  arrangeEvenButton.addEventListener("click", () => arrangeNodes("even"));
  restoreLayoutButton.addEventListener("click", restoreLayout);


  clearLinksButton.addEventListener("click", () => {
    if (!confirm("すべての接続だけを解除しますか？")) return;
    const removed = clearAllLinks();
    setSheet(menuSheet, false);
    showToast(removed ? `${removed}件の接続を解除しました` : "解除する接続はありません", 1500);
  });

  clearButton.addEventListener("click", () => {
    if (confirm(`宇宙「${data.name}」のSEEDと接続をすべて削除します。先にバックアップを書き出しましたか？`)) {
      data.nodes = [];
      data.links = [];
      data.currentId = null;
      data.layoutBackup = null;
      saveData();
      setSheet(menuSheet, false);
      showToast("この宇宙を空にしました");
    }
  });

  if (localStorage.getItem(HINT_KEY) === "hidden") {
    gestureHint.classList.add("hidden");
  } else {
    setTimeout(() => gestureHint.classList.add("hidden"), 9000);
  }

  buildColorPalette();
  selectColor("ice");
  refreshAutoViewButton();
  renderConnectionPanel();
  updateArrangeControls();
  renderUniverseUI();
  persistActiveUniverse();
  writeStore();

  if (localStorage.getItem(HELP_KEY) !== "seen") {
    setTimeout(() => setSheet(helpSheet, true), 650);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 180));
  window.addEventListener("pagehide", () => {
    persistActiveUniverse();
    writeStore();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistActiveUniverse();
      writeStore();
    }
  });
  resize();
  requestAnimationFrame(render);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js?v=09").catch(() => {});
    });
  }
})();
