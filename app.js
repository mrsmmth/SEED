(() => {
  "use strict";

  const STORAGE_KEY = "seed-spherical-notes-v1";
  const HINT_KEY = "seed-spherical-hint-v1";

  const canvas = document.getElementById("universe");
  const ctx = canvas.getContext("2d", { alpha: false });
  const addButton = document.getElementById("addButton");
  const menuButton = document.getElementById("menuButton");
  const editorSheet = document.getElementById("editorSheet");
  const menuSheet = document.getElementById("menuSheet");
  const titleInput = document.getElementById("seedTitle");
  const bodyInput = document.getElementById("seedBody");
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

  const demoTitles = ["記憶", "時間", "写真", "不在", "声", "夢", "境界", "約束", "光", "名前"];

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function fibonacciPosition(index, total) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (index / Math.max(1, total - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
  }

  function createDemoData() {
    const nodes = demoTitles.map((title, index) => ({
      id: uid(),
      title,
      body: "",
      pos: fibonacciPosition(index, demoTitles.length),
      createdAt: Date.now() + index
    }));
    return {
      version: 1,
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
    data.version = 1;
    data.nodes = Array.isArray(data.nodes) ? data.nodes : [];
    data.links = Array.isArray(data.links) ? data.links : [];
    data.nodes.forEach((node, index) => {
      node.id ||= uid();
      node.title ||= `SEED ${index + 1}`;
      node.body ||= "";
      if (!node.pos || !Number.isFinite(node.pos.x)) {
        node.pos = fibonacciPosition(index, Math.max(data.nodes.length, 1));
      }
    });
    if (!data.currentId || !data.nodes.some(n => n.id === data.currentId)) {
      data.currentId = data.nodes[0]?.id || null;
    }
    return data;
  }

  let data = normalizeData(loadData());

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : createDemoData();
    } catch {
      return createDemoData();
    }
  }

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
    deleteButton.hidden = isNew;
    unlinkButton.hidden = isNew;
    centerButton.hidden = isNew;
    setSheet(editorSheet, true);
    setTimeout(() => titleInput.focus(), 300);
  }

  function closeEditor() {
    setSheet(editorSheet, false);
    editingId = null;
    isNew = false;
  }

  function addSeed(title, body) {
    const index = data.nodes.length;
    const node = {
      id: uid(),
      title: title || `SEED ${index + 1}`,
      body: body || "",
      pos: fibonacciPosition(index + 1, index + 2),
      createdAt: Date.now()
    };
    const jitter = 0.18;
    node.pos.x += (Math.random() - 0.5) * jitter;
    node.pos.y += (Math.random() - 0.5) * jitter;
    node.pos.z += (Math.random() - 0.5) * jitter;
    normalizeVector(node.pos);
    data.nodes.push(node);
    if (!data.currentId) data.currentId = node.id;
    saveData();
    showToast("新しいSEEDが生まれました");
    return node;
  }

  function normalizeVector(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    v.x /= len; v.y /= len; v.z /= len;
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

  function moveNodeOnSphere(nodeId, screenX, screenY) {
    const node = data.nodes.find(n => n.id === nodeId);
    if (!node || node.id === data.currentId) return;

    const currentCamera = rotatePoint(node.pos);
    const dragRadius = Math.max(1, radius * zoom * 1.12);
    let px = (screenX - cx) / dragRadius;
    let py = (screenY - cy) / dragRadius;

    // Let a SEED travel almost to the full visible edge of the sphere.
    const radial = Math.hypot(px, py);
    if (radial > 0.998) {
      px = px / radial * 0.998;
      py = py / radial * 0.998;
    }

    // Preserve whether the node was on the front or back hemisphere.
    const sign = currentCamera.z >= 0 ? 1 : -1;
    const pz = sign * Math.sqrt(Math.max(0.001, 1 - px * px - py * py));
    const world = inverseRotatePoint({ x: px, y: py, z: pz });
    normalizeVector(world);
    node.pos = world;
    gesture.nodeMoveDirty = true;
  }

  function projectNode(node) {
    if (node.id === data.currentId) {
      return { node, x: cx, y: cy, z: 1.28, scale: 1.18, screenScale: Math.min(1.6, Math.max(.86, Math.pow(zoom, .32))), core: true };
    }
    const p = rotatePoint(node.pos);
    const perspective = 2.8 / (3.6 - p.z);
    return {
      node,
      x: cx + p.x * radius * perspective * zoom,
      y: cy + p.y * radius * perspective * zoom,
      z: p.z,
      scale: perspective,
      screenScale: Math.min(1.7, Math.max(.56, Math.pow(zoom, .42))),
      core: false
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
    radius = Math.min(width, height) * 0.46;
  }

  const dust = Array.from({ length: 95 }, (_, i) => ({
    x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.4,
    a: 0.035 + Math.random() * 0.10, phase: Math.random() * Math.PI * 2
  }));

  function drawBackground(time) {
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.82);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.54, "#f9fbff");
    bg.addColorStop(1, "#eaf1f8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    dust.forEach((p) => {
      const driftX = Math.sin(time * 0.00020 + p.phase) * 5;
      const driftY = Math.cos(time * 0.00016 + p.phase) * 3;
      const twinkle = .62 + Math.sin(time * 0.0011 + p.phase) * .24;
      ctx.beginPath();
      ctx.arc(p.x * width + driftX, p.y * height + driftY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(38,78,121,${p.a * twinkle})`;
      ctx.fill();
    });

    // The guide sphere now follows the same zoom as the SEED ecosystem.
    const guideRadius = radius * zoom;
    const guideFade = Math.max(.025, .075 / Math.max(.75, zoom));

    const halo = ctx.createRadialGradient(
      cx, cy, guideRadius * .46,
      cx, cy, Math.max(guideRadius * 1.20, 20)
    );
    halo.addColorStop(0, "rgba(255,255,255,0)");
    halo.addColorStop(.72, "rgba(70,116,166,0.018)");
    halo.addColorStop(1, "rgba(37,83,133,0.078)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(guideRadius * 1.20, 12), 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = "rgba(44,91,143,.12)";
    ctx.shadowBlur = 7;
    ctx.strokeStyle = `rgba(31,70,113,${guideFade})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 10]);

    ctx.beginPath();
    ctx.arc(cx, cy, guideRadius * 1.03, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
      cx, cy,
      guideRadius * 1.03,
      guideRadius * .29,
      rotation.y * .20,
      0, Math.PI * 2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
      cx, cy,
      guideRadius * .34,
      guideRadius * 1.03,
      rotation.x * .18,
      0, Math.PI * 2
    );
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
      const alpha = 0.12 + (depth + 1) * 0.12;
      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, `rgba(30,78,132,${alpha})`);
      grad.addColorStop(.5, `rgba(80,137,195,${Math.min(.56, alpha + .18)})`);
      grad.addColorStop(1, `rgba(30,78,132,${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = (pa.core || pb.core) ? 1.75 : 1.05;
      ctx.shadowColor = "rgba(60,119,180,.23)";
      ctx.shadowBlur = (pa.core || pb.core) ? 10 : 6;
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
        ctx.strokeStyle = "rgba(26,75,128,.72)";
        ctx.lineWidth = 1.7;
        ctx.shadowColor = "rgba(49,110,173,.34)";
        ctx.shadowBlur = 10;
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

  function roundedRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function truncateText(text, max) {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  function drawNode(p, time) {
    const frontness = (p.z + 1) / 2;
    const dense = data.nodes.length >= 36;

    let mode = 2; // 0: symbol only, 1: compact title, 2: full title
    if (!p.core) {
      if (zoom < .64 || (dense && zoom < 1.15 && p.z < .66)) {
        mode = 0;
      } else if (zoom < 1.42 || (dense && p.z < .14)) {
        mode = 1;
      }
    }

    if (mode === 0) {
      const size = Math.max(6, Math.min(14, (7 + frontness * 4) * p.screenScale));
      p.hit = {
        x: p.x - 14,
        y: p.y - 14,
        w: 28,
        h: 28,
        r: 14
      };

      ctx.save();
      ctx.globalAlpha = .20 + frontness * .52;
      ctx.strokeStyle = `rgba(20,58,99,${.30 + frontness * .42})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(48,105,166,.18)";
      ctx.shadowBlur = 6;
      ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.restore();
      return;
    }

    const maxChars = p.core ? 18 : (mode === 1 ? 9 : (zoom > 1.9 ? 22 : 15));
    const title = truncateText(p.node.title || "SEED", maxChars);
    const baseFont = p.core ? 16.5 : (mode === 1 ? 10.5 : 12.2 + frontness * 1.6);
    const fontSize = Math.max(9, Math.min(21, baseFont * p.screenScale));
    ctx.font = `${p.core ? 650 : 560} ${fontSize}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`;

    const textW = ctx.measureText(title).width;
    const padX = (p.core ? 20 : (mode === 1 ? 10 : 14)) * p.screenScale;
    const minW = (p.core ? 108 : (mode === 1 ? 42 : 70)) * p.screenScale;
    const w = Math.max(minW, textW + padX * 2);
    const h = (p.core ? 44 : (mode === 1 ? 24 : 31)) * p.screenScale;
    const pulse = p.core ? 1 + Math.sin(time * .0020) * .018 : 1;
    const drawW = w * pulse;
    const drawH = h * pulse;
    const x = p.x - drawW / 2;
    const y = p.y - drawH / 2;

    p.hit = { x, y, w: drawW, h: drawH, r: Math.max(drawW, drawH) * .62 };

    ctx.save();
    ctx.globalAlpha = p.core ? .99 : (.30 + frontness * .56);

    if (p.core) {
      const aura = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, Math.max(drawW, drawH) * .92);
      aura.addColorStop(0, "rgba(115,163,214,.22)");
      aura.addColorStop(.56, "rgba(78,133,191,.10)");
      aura.addColorStop(1, "rgba(60,112,171,0)");
      ctx.fillStyle = aura;
      ctx.fillRect(
        p.x - Math.max(drawW, drawH),
        p.y - Math.max(drawW, drawH),
        Math.max(drawW, drawH) * 2,
        Math.max(drawW, drawH) * 2
      );

      ctx.shadowColor = "rgba(58,121,188,.48)";
      ctx.shadowBlur = 22 + Math.sin(time * .0020) * 5;
      ctx.strokeStyle = "rgba(22,66,112,.88)";
      ctx.lineWidth = 1.35;
      ctx.strokeRect(x, y, drawW, drawH);

      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(99,151,205,.72)";
      ctx.lineWidth = .8;
      ctx.strokeRect(x + 4, y + 4, drawW - 8, drawH - 8);
      ctx.fillStyle = "#102f52";
    } else {
      ctx.shadowColor = "rgba(60,116,177,.16)";
      ctx.shadowBlur = mode === 1 ? 5 : 8;
      ctx.strokeStyle = `rgba(18,57,99,${.38 + frontness * .42})`;
      ctx.lineWidth = .9;
      ctx.strokeRect(x, y, drawW, drawH);
      ctx.fillStyle = `rgba(17,52,91,${.52 + frontness * .42})`;
    }

    ctx.shadowColor = "transparent";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, p.x, p.y + .2);
    ctx.restore();
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
      moveNodeOnSphere(gesture.nodeMovingId, p.x, p.y);
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
    if (!title && !body) {
      showToast("名前か本文を入れてください");
      return;
    }
    if (isNew) {
      addSeed(title || "無題のSEED", body);
    } else {
      const node = data.nodes.find(n => n.id === editingId);
      if (node) {
        node.title = title || "無題のSEED";
        node.body = body;
        saveData();
        showToast("保存しました");
      }
    }
    closeEditor();
  });

  unlinkButton.addEventListener("click", () => {
    if (!editingId) return;
    const removed = removeLinksForSeed(editingId);
    showToast(
      removed ? `${removed}件の接続を解除しました` : "このSEEDに接続はありません",
      1500
    );
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
    showToast(
      removed ? `${removed}件の接続を解除しました` : "解除する接続はありません",
      1500
    );
  });

  clearButton.addEventListener("click", () => {
    if (confirm("すべてのSEEDと接続を削除します。先にバックアップを書き出しましたか？")) {
      data = { version: 1, nodes: [], links: [], currentId: null };
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
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
})();
