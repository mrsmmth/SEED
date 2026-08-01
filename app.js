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
  const centerButton = document.getElementById("centerButton");
  const exportButton = document.getElementById("exportButton");
  const importInput = document.getElementById("importInput");
  const resetViewButton = document.getElementById("resetViewButton");
  const dismissHintButton = document.getElementById("dismissHintButton");
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
    startZoom: 1
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

  function projectNode(node) {
    if (node.id === data.currentId) {
      return { node, x: cx, y: cy, z: 1.28, scale: 1.18, core: true };
    }
    const p = rotatePoint(node.pos);
    const perspective = 2.8 / (3.6 - p.z);
    return {
      node,
      x: cx + p.x * radius * perspective * zoom,
      y: cy + p.y * radius * perspective * zoom,
      z: p.z,
      scale: perspective,
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
    cy = height * 0.51;
    radius = Math.min(width, height) * 0.32;
  }

  const dust = Array.from({ length: 95 }, (_, i) => ({
    x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.4,
    a: 0.035 + Math.random() * 0.10, phase: Math.random() * Math.PI * 2
  }));

  function drawBackground(time) {
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.72);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.48, "#f8faff");
    bg.addColorStop(1, "#edf2f8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    dust.forEach((p, i) => {
      const drift = Math.sin(time * 0.00022 + p.phase) * 4;
      ctx.beginPath();
      ctx.arc(p.x * width + drift, p.y * height, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(41,76,115,${p.a})`;
      ctx.fill();
    });

    const halo = ctx.createRadialGradient(cx, cy, radius * .58, cx, cy, radius * 1.22);
    halo.addColorStop(0, "rgba(255,255,255,0)");
    halo.addColorStop(.76, "rgba(82,121,164,0.018)");
    halo.addColorStop(1, "rgba(45,88,137,0.085)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(43,78,118,0.075)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 7]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.06 * zoom, radius * .29 * zoom, rotation.y * .18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * .36 * zoom, radius * 1.06 * zoom, rotation.x * .16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function linePoint(id) {
    return projectedNodes.find(p => p.node.id === id);
  }

  function drawLinks() {
    for (const [a, b] of data.links) {
      const pa = linePoint(a), pb = linePoint(b);
      if (!pa || !pb) continue;
      const depth = Math.max(-1, Math.min(1, (pa.z + pb.z) / 2));
      const alpha = 0.10 + (depth + 1) * 0.10;
      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, `rgba(36,85,139,${alpha})`);
      grad.addColorStop(.5, `rgba(83,130,178,${Math.min(.42, alpha + .12)})`);
      grad.addColorStop(1, `rgba(36,85,139,${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = (pa.core || pb.core) ? 1.7 : 1.05;
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
        ctx.strokeStyle = "rgba(32,78,129,.62)";
        ctx.lineWidth = 1.7;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(connectState.x, connectState.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
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
    const title = truncateText(p.node.title || "SEED", p.core ? 18 : 13);
    const fontSize = p.core ? 17 : Math.max(10.5, 11.5 + frontness * 2.5);
    ctx.font = `${p.core ? 650 : 560} ${fontSize}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`;
    const textW = ctx.measureText(title).width;
    const padX = p.core ? 22 : 15;
    const w = Math.max(p.core ? 96 : 64, textW + padX * 2);
    const h = p.core ? 53 : 39;
    const pulse = p.core ? 1 + Math.sin(time * .0022) * .025 : 1;
    const x = p.x - (w * pulse) / 2;
    const y = p.y - (h * pulse) / 2;
    p.hit = { x, y, w: w * pulse, h: h * pulse, r: Math.max(w, h) * .6 };

    ctx.save();
    const alpha = p.core ? 0.98 : 0.48 + frontness * .44;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.core ? "rgba(103,122,156,.28)" : "rgba(34,72,113,.16)";
    ctx.shadowBlur = p.core ? 28 : 10 + frontness * 12;
    ctx.shadowOffsetY = p.core ? 8 : 4;

    const fill = ctx.createLinearGradient(x, y, x, y + h);
    fill.addColorStop(0, p.core ? "rgba(255,255,255,.99)" : "rgba(255,255,255,.93)");
    fill.addColorStop(1, p.core ? "rgba(241,235,218,.95)" : "rgba(240,245,251,.84)");
    ctx.fillStyle = fill;
    roundedRectPath(x, y, w * pulse, h * pulse, p.core ? 27 : 20);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = p.core ? "rgba(133,111,62,.26)" : `rgba(38,78,121,${.12 + frontness * .13})`;
    ctx.lineWidth = p.core ? 1.25 : 1;
    ctx.stroke();

    ctx.fillStyle = p.core ? "#183759" : "#183c64";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, p.x, p.y + .5);

    if (p.core) {
      ctx.beginPath();
      ctx.arc(p.x, p.y - h * .56, 3.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(160,128,62,.60)";
      ctx.fill();
    }
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
      gesture.dragging = true;
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
        zoom = Math.max(.66, Math.min(1.72, gesture.startZoom * dist / gesture.pinchDistance));
      }
      gesture.moved = true;
      return;
    }

    if (!gesture.dragging) return;
    const dx = p.x - gesture.lastX;
    const dy = p.y - gesture.lastY;
    if (Math.hypot(dx, dy) > 3) {
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
    } else if (!gesture.moved && pointers.size === 1) {
      handleTap(p);
    }

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
