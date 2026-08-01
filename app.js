(() => {
  "use strict";

  const STORAGE_KEY = "seed-spherical-notes-v1";
  const HINT_KEY = "seed-spherical-hint-v1";
  const MAIN_SIZE = 1.34;
  const SIZE_OPTIONS = [0.76, 0.88, 1.0, 1.12];
  const COLOR_KEYS = ["pearl", "ice", "mist", "silver", "navy"];
  const COLOR_PALETTES = {
    pearl: { glow: [255, 247, 235], mid: [249, 252, 255], dark: [204, 224, 244], label: [20, 58, 99] },
    ice:   { glow: [242, 251, 255], mid: [232, 245, 255], dark: [165, 207, 241], label: [22, 66, 112] },
    mist:  { glow: [247, 249, 255], mid: [240, 244, 255], dark: [180, 196, 225], label: [25, 64, 108] },
    silver:{ glow: [250, 252, 255], mid: [238, 242, 248], dark: [175, 188, 205], label: [27, 63, 103] },
    navy:  { glow: [238, 245, 255], mid: [219, 233, 248], dark: [120, 155, 206], label: [22, 58, 100] }
  };

  const canvas = document.getElementById("universe");
  const ctx = canvas.getContext("2d", { alpha: false });
  const addButton = document.getElementById("addButton");
  const menuButton = document.getElementById("menuButton");
  const editorSheet = document.getElementById("editorSheet");
  const menuSheet = document.getElementById("menuSheet");
  const titleInput = document.getElementById("seedTitle");
  const bodyInput = document.getElementById("seedBody");
  const colorInput = document.getElementById("seedColor");
  const sizeInput = document.getElementById("seedSize");
  const saveButton = document.getElementById("saveButton");
  const deleteButton = document.getElementById("deleteButton");
  const unlinkButton = document.getElementById("unlinkButton");
  const centerButton = document.getElementById("centerButton");
  const exportButton = document.getElementById("exportButton");
  const importInput = document.getElementById("importInput");
  const resetViewButton = document.getElementById("resetViewButton");
  const dismissHintButton = document.getElementById("dismissHintButton");
  const clearLinksButton = document.getElementById("clearLinksButton");
  const clearButton = document.getElementById("clearButton");
  const gestureHint = document.getElementById("gestureHint");
  const toast = document.getElementById("toast");

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
    const dist = 0.65 + Math.random() * 0.95; // can exceed guide sphere
    return {
      x: Math.sin(phi) * Math.cos(theta) * dist,
      y: Math.sin(phi) * Math.sin(theta) * dist,
      z: Math.cos(phi) * dist
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

  function createNode(title, body) {
    return {
      id: uid(),
      title: title || "無題のSEED",
      body: body || "",
      pos: randomPosition(),
      color: randomColorKey(),
      size: randomNormalSize(),
      createdAt: Date.now()
    };
  }

  function createDemoData() {
    const demoTitles = ["記憶", "時間", "写真", "不在", "声", "夢", "境界", "約束", "光", "名前"];
    const nodes = demoTitles.map((title, i) => {
      const node = createNode(title, "");
      node.createdAt += i;
      return node;
    });
    return {
      version: 2,
      nodes,
      links: [
        [nodes[0].id, nodes[2].id],
        [nodes[1].id, nodes[3].id],
        [nodes[4].id, nodes[5].id],
        [nodes[6].id, nodes[8].id]
      ],
      currentId: nodes[0].id
    };
  }

  function normalizeData(raw) {
    const data = raw && typeof raw === "object" ? raw : createDemoData();
    data.version = 2;
    data.nodes = Array.isArray(data.nodes) ? data.nodes : [];
    data.links = Array.isArray(data.links) ? data.links : [];
    data.nodes.forEach((node, index) => {
      node.id ||= uid();
      node.title ||= `SEED ${index + 1}`;
      node.body ||= "";
      if (!node.pos || !Number.isFinite(node.pos.x) || !Number.isFinite(node.pos.y) || !Number.isFinite(node.pos.z)) {
        node.pos = randomPosition();
      }
      if (!COLOR_KEYS.includes(node.color)) node.color = randomColorKey();
      node.size = clampNormalSeedSize(node.size);
      node.createdAt ||= Date.now() + index;
    });
    if (!data.currentId || !data.nodes.some(n => n.id === data.currentId)) {
      data.currentId = data.nodes[0]?.id || null;
    }
    return data;
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : createDemoData();
    } catch {
      return createDemoData();
    }
  }

  let data = normalizeData(loadData());

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

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

  function openEditor(id = null) {
    isNew = !id;
    editingId = id;
    const node = id ? data.nodes.find(n => n.id === id) : null;
    titleInput.value = node?.title || "";
    bodyInput.value = node?.body || "";
    colorInput.value = node?.color || "ice";
    sizeInput.value = String(node?.size ?? 1.0);
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
    saveData();
    showToast("中心のSEEDを切り替えました");
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
    const dragBase = Math.max(1, radius * zoom);
    let px = (screenX - cx) / dragBase;
    let py = (screenY - cy) / dragBase;
    px = Math.max(-1.8, Math.min(1.8, px));
    py = Math.max(-1.8, Math.min(1.8, py));

    let pz = currentCamera.z;
    pz = Math.max(-1.55, Math.min(1.55, pz));
    const world = inverseRotatePoint({ x: px, y: py, z: pz });
    const dist = Math.hypot(world.x, world.y, world.z) || 1;
    const scale = dist > 1.85 ? 1.85 / dist : 1;
    node.pos = { x: world.x * scale, y: world.y * scale, z: world.z * scale };
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
    const perspective = 3.0 / (4.35 - p.z);
    return {
      node,
      x: cx + p.x * radius * perspective * zoom,
      y: cy + p.y * radius * perspective * zoom,
      z: p.z,
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

    const guideRadius = radius * zoom;
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

  function drawPlanet(x, y, r, palette, glowBoost = 1, core = false) {
    ctx.save();
    const glow = ctx.createRadialGradient(x - r * .28, y - r * .3, r * .1, x, y, r * 1.7);
    glow.addColorStop(0, rgba(palette.glow, core ? .92 : .72));
    glow.addColorStop(.5, rgba(palette.mid, core ? .30 * glowBoost : .16 * glowBoost));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = core ? "rgba(76,142,206,.52)" : "rgba(81,137,196,.22)";
    ctx.shadowBlur = core ? 24 : 8;

    const body = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .12, x, y, r);
    body.addColorStop(0, rgba(palette.glow, .98));
    body.addColorStop(.58, rgba(palette.mid, .96));
    body.addColorStop(1, rgba(palette.dark, .95));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = core ? "rgba(18,65,108,.90)" : "rgba(25,68,111,.28)";
    ctx.lineWidth = core ? 1.3 : 1;
    ctx.stroke();

    if (core) {
      ctx.strokeStyle = "rgba(125,188,231,.62)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.arc(x, y, r * .78, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLabel(p, title, mode, palette) {
    const radiusPx = p.renderRadius;
    const labelAlpha = p.core ? .96 : (.42 + Math.max(0, p.z) * .20);
    const textSize = p.core ? 15 : (mode === 1 ? 11 : 12.5);
    ctx.font = `${p.core ? 650 : 560} ${textSize}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`;
    const textW = ctx.measureText(title).width;

    const ringW = radiusPx * (p.core ? 2.1 : 1.9) + textW + 26;
    const ringH = radiusPx * (p.core ? .90 : .78);

    ctx.save();
    ctx.globalAlpha = labelAlpha;
    ctx.strokeStyle = rgba(palette.label, p.core ? .34 : .24);
    ctx.lineWidth = .95;
    ctx.beginPath();
    ctx.ellipse(p.x + radiusPx * .42, p.y, ringW / 2, ringH / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = rgba(palette.label, p.core ? .96 : .88);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, p.x + radiusPx + 12, p.y);

    const hitX = p.x - radiusPx;
    const hitY = p.y - Math.max(radiusPx, 18);
    const hitW = ringW * .72 + radiusPx;
    const hitH = Math.max(32, ringH + 18);
    p.hit = {
      x: hitX,
      y: hitY,
      w: hitW,
      h: hitH,
      r: Math.max(radiusPx, hitH / 2)
    };
    ctx.restore();
  }

  function drawNode(p, time) {
    const node = p.node;
    const palette = COLOR_PALETTES[node.color] || COLOR_PALETTES.ice;
    const frontness = (p.z + 1.8) / 3.6;
    const dense = data.nodes.length >= 42;
    const baseRadius = p.core
      ? 22 + Math.sin(time * .0022) * 1.2
      : (7.6 + Math.max(-1.2, p.z) * 1.2) * (node.size || 1) * (0.92 + zoom * .08) * p.scale;

    const renderRadius = Math.max(p.core ? 18 : 4.2, Math.min(p.core ? 26 : 17, baseRadius));
    p.renderRadius = renderRadius;

    drawPlanet(p.x, p.y, renderRadius, palette, p.core ? 1.5 : 1, p.core);

    let mode = 2;
    if (!p.core) {
      if (zoom < .92 || (dense && zoom < 1.30 && p.z < .55)) {
        mode = 0;
      } else if (zoom < 1.65 || (dense && p.z < .08)) {
        mode = 1;
      }
    }

    if (mode === 0) {
      p.hit = {
        x: p.x - 16,
        y: p.y - 16,
        w: 32,
        h: 32,
        r: 16
      };
      return;
    }

    const title = truncateText(node.title || "SEED", p.core ? 18 : (mode === 1 ? 9 : 18));
    drawLabel(p, title, mode, palette);
  }

  function render(time = 0) {
    velocity.x *= 0.94;
    velocity.y *= 0.94;
    if (!gesture.dragging && !connectState) {
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
  menuButton.addEventListener("click", () => setSheet(menuSheet, true));
  document.querySelectorAll("[data-close-sheet]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-close-menu]").forEach(el => el.addEventListener("click", () => setSheet(menuSheet, false)));

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
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SEED-backup-${date}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("バックアップを書き出しました");
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      data = normalizeData(parsed);
      saveData();
      setSheet(menuSheet, false);
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
    setSheet(menuSheet, false);
    showToast("球体の向きを戻しました");
  });

  dismissHintButton.addEventListener("click", () => {
    const hidden = !gestureHint.classList.contains("hidden");
    gestureHint.classList.toggle("hidden", hidden);
    localStorage.setItem(HINT_KEY, hidden ? "hidden" : "visible");
    setSheet(menuSheet, false);
  });

  clearLinksButton.addEventListener("click", () => {
    if (!confirm("すべての接続だけを解除しますか？")) return;
    const removed = clearAllLinks();
    setSheet(menuSheet, false);
    showToast(removed ? `${removed}件の接続を解除しました` : "解除する接続はありません", 1500);
  });

  clearButton.addEventListener("click", () => {
    if (confirm("すべてのSEEDと接続を削除します。先にバックアップを書き出しましたか？")) {
      data = { version: 2, nodes: [], links: [], currentId: null };
      saveData();
      setSheet(menuSheet, false);
      showToast("生態系を空にしました");
    }
  });

  if (localStorage.getItem(HINT_KEY) === "hidden") {
    gestureHint.classList.add("hidden");
  } else {
    setTimeout(() => gestureHint.classList.add("hidden"), 9000);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 180));
  resize();
  requestAnimationFrame(render);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js?v=05").catch(() => {});
    });
  }
})();
