/* ========= helpers ========= */
const $  = (q, r=document) => r.querySelector(q);
const $$ = (q, r=document) => Array.from(r.querySelectorAll(q));
const openModal  = sel => { const m=$(sel); if(m) m.style.display="flex"; };
const closeModal = sel => { const m=$(sel); if(m) m.style.display="none"; };
const escapeHTML = (s="") => s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"\'":'&#39;','"':'&quot;'}[c]) );

function nameColor(hex){
  const m={"#000000":"Black","#FFFFFF":"White","#FF3333":"Red","#00FFFF":"Cyan",
           "#FFFF00":"Yellow","#00FF00":"Lime","#0000FF":"Blue","#FF69B4":"Hot Pink",
           "#C0C0C0":"Silver"};
  return m[(hex||"").toUpperCase()]||hex;
}

/* ===== placeholder ===== */
function hidePlaceholder(){
  const ph = $("#canvas .placeholder");
  if (ph) ph.remove();
}
function maybeShowPlaceholder(){
  const hasItems = !!$("#canvas .item");
  if (!hasItems && !$("#canvas .placeholder")){
    const ph = document.createElement("div");
    ph.className = "placeholder";
    ph.innerHTML = `<h3>Start Creating</h3><p>Use the tools on the left to add elements.</p>`;
    $("#canvas")?.appendChild(ph);
  }
}

/* ========= canvas state ========= */
const stage  = $(".stage");
const canvas = $("#canvas");
let selected=null, seq=0;

let dragging=false, dragOff={x:0,y:0};
let rotating=false, rotateStart=0, rotateBase=0;
let resizing=false, resizeStart={x:0,y:0}, resizeBase={w:0,h:0};
let textResizing=false, textResizeStartX=0, textResizeBaseW=0;

/* inline edit */
let isEditing = false;
let activeEditor = null;

/* keep canvas sized to visible stage */
function sizeCanvasToStage(){
  if(!stage || !canvas) return;
  canvas.style.width  = stage.clientWidth  + "px";
  canvas.style.height = stage.clientHeight + "px";
}
sizeCanvasToStage();
window.addEventListener("resize", sizeCanvasToStage);

/* compute wrap limit based on available space to the right inside the canvas */
function computeWrapLimit(node){
  const cw = canvas.clientWidth;
  const left = node.offsetLeft || 0;
  return Math.max(40, cw - left - 20);
}

/* ----- inline edit ----- */
function startInlineEdit(node){
  if(!node?.classList.contains("text") || isEditing) return;
  isEditing = true;

  const svg = node.querySelector(".text-svg");
  const handles = node.querySelector(".handles");
  const prevVis = svg ? svg.style.visibility : "";
  const prevDisp = handles ? handles.style.display : "";
  if (svg) svg.style.visibility = "hidden";
  if (handles) handles.style.display = "none";

  const ta = document.createElement("textarea");
  activeEditor = ta;
  ta.value = node.dataset.content || "";
  ta.style.position = "absolute";

  const wanted = Math.max(40, +node.dataset.boxW || node.getBoundingClientRect().width || 320);
  const limit  = computeWrapLimit(node);
  const width  = Math.max(40, Math.min(wanted, limit));
  const boxW   = node.getBoundingClientRect().width || width;

  const anchor = (node.dataset.anchor || "start");
  let leftPos = node.offsetLeft;
  if (anchor === "middle") leftPos = node.offsetLeft + (boxW - width)/2;
  if (anchor === "end")    leftPos = node.offsetLeft + (boxW - width);

  Object.assign(ta.style, {
    left: Math.max(0,leftPos) + "px",
    top:  node.offsetTop  + "px",
    minWidth: "40px",
    width: width + "px",
    padding: "0",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    fontFamily: node.dataset.fontFamily || "Lily Script One",
    fontSize: (node.dataset.fontSize || 64) + "px",
    lineHeight: "1.2",
    color: "#fff",
    zIndex: "200",
    boxShadow: "none",
    resize: "none",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    maxWidth: "min(90vw, 1400px)",
    textAlign: (anchor==="middle"?"center":anchor==="end"?"right":"left")
  });

  canvas.appendChild(ta);
  ta.focus();
  ta.selectionStart = ta.value.length;
  ta.selectionEnd   = ta.value.length;

  const restoreHidden = () => {
    if (svg) svg.style.visibility = prevVis;
    if (handles) handles.style.display = prevDisp;
  };

  const commit = () => {
    if(!isEditing) return;
    const v = ta.value;
    const w = Math.max(40, parseFloat(ta.style.width) || ta.clientWidth || wanted);

    ta.remove();
    activeEditor = null;
    isEditing = false;

    node.dataset.content = v;
    node.dataset.boxW = String(w);

    restoreHidden();
    if(selected !== node) select(node);
    const tc = $("#textContent");
    if (tc) tc.value = v;
    rerender();
  };
  const cancel = () => {
    if(!isEditing) return;
    ta.remove();
    activeEditor = null;
    isEditing = false;
    restoreHidden();
    rerender();
  };

  ta.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); commit(); }
    if(e.key === "Escape"){ e.preventDefault(); cancel(); }
  });
  ta.addEventListener("blur", commit);
}

/* ---- touch: double-tap to edit + long-press to drag ---- */
let lastTapTime = 0;
let longPressTimer = null;
let touchStartPos = {x:0, y:0};
let touchCurrent = {x:0, y:0};
const DOUBLE_TAP_MS = 300;
const LONG_PRESS_MS  = 350;
const TOUCH_MOVE_TOL = 6;
let touchDragActive = false;

function onItemTouchStart(e, node){
  if(e.touches.length !== 1) return;
  const t = e.touches[0];

  if(e.target.closest(".btnX,.btnRot,.btnResize,.btnLayer,input,select,.num,textarea")) return;

  const now = Date.now();
  const dt  = now - lastTapTime;
  lastTapTime = now;

  touchStartPos = { x: t.clientX, y: t.clientY };
  touchCurrent  = { ...touchStartPos };
  touchDragActive = false;

  if(dt < DOUBLE_TAP_MS){
    clearTimeout(longPressTimer);
    if(node.classList.contains("text")){
      e.preventDefault();
      select(node);
      startInlineEdit(node);
    }
    return;
  }

  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(()=>{ beginTouchDrag(node, touchCurrent); }, LONG_PRESS_MS);

  node.addEventListener("touchmove", onTouchMoveCancelLongPress, {passive:false, once:false});
  node.addEventListener("touchend",  onTouchEndCancelLongPress,   {once:true});
  node.addEventListener("touchcancel", onTouchEndCancelLongPress, {once:true});
}
function onTouchMoveCancelLongPress(e){
  const t = e.touches[0];
  touchCurrent = { x: t.clientX, y: t.clientY };
  const dx = Math.abs(t.clientX - touchStartPos.x);
  const dy = Math.abs(t.clientY - touchStartPos.y);
  if(dx > TOUCH_MOVE_TOL || dy > TOUCH_MOVE_TOL){
    clearTimeout(longPressTimer);
  }
}
function onTouchEndCancelLongPress(){ clearTimeout(longPressTimer); }
function beginTouchDrag(node, point){
  if(isEditing) return;
  select(node);
  dragging = true;
  touchDragActive = true;

  const r = node.getBoundingClientRect();
  dragOff.x = point.x - r.left;
  dragOff.y = point.y - r.top;

  document.addEventListener("touchmove", touchDragMove, {passive:false});
  document.addEventListener("touchend",  touchDragStop, {once:true});
  document.addEventListener("touchcancel", touchDragStop, {once:true});
}
function touchDragMove(e){
  if(!touchDragActive || !selected) return;
  const t = e.touches[0];
  e.preventDefault();

  const c = canvas.getBoundingClientRect();
  const x = Math.max(0, t.clientX - c.left - dragOff.x);
  const y = Math.max(0, t.clientY - c.top  - dragOff.y);
  selected.style.left = x + "px";
  selected.style.top  = y + "px";
}
function touchDragStop(){
  dragging = false;
  touchDragActive = false;
  document.removeEventListener("touchmove", touchDragMove);
  if(selected?.classList.contains("text")) rerender();
  updateCanvasSize();
}

/* undo/redo */
const undoStack=[], redoStack=[];
function snapshot(){undoStack.push(canvas.innerHTML); if(undoStack.length>60)undoStack.shift(); redoStack.length=0;}
function restore(html){
  canvas.innerHTML=html;
  rebind(); normalizeZ(); selected=null; updateCanvasSize();
  maybeShowPlaceholder();
}
$("#btnUndo")?.addEventListener("click",()=>{ if(!undoStack.length)return; const cur=canvas.innerHTML; const prev=undoStack.pop(); redoStack.push(cur); restore(prev); });
$("#btnRedo")?.addEventListener("click",()=>{ if(!redoStack.length)return; const cur=canvas.innerHTML; const nxt=redoStack.pop(); undoStack.push(cur); restore(nxt); });

/* upload */
const fileInput=$("#hiddenFile");

/* rebind — only add listeners once per node; do NOT attach handles here */
function rebind(){
  $$(".item",canvas).forEach(n=>{
    if (n.dataset.bound === "1") return;
    n.dataset.bound = "1";

    n.addEventListener("mousedown",startDrag);
    n.addEventListener("click", pick);
    n.addEventListener("dblclick", (e)=>{
      if(n.classList.contains("text") && !e.target.closest(".btnX,.btnRot,.btnResize,.btnLayer,input,select,.num,textarea")){
        e.stopPropagation();
        select(n);
        startInlineEdit(n);
      }
    });
    n.addEventListener("touchstart", (e)=>onItemTouchStart(e, n), {passive:false});
    // IMPORTANT: do NOT call ensureHandles(n) here
  });
}

/* selection */
function pick(e){ select(e.currentTarget); }
function select(node){
  if (selected && selected !== node) {
    selected.classList.remove("selected");
    removeHandles(selected);
  }
  closeAllLayerMenus(); // ensure only one menu exists and no stale listeners
  selected=node;
  if (selected){
    selected.classList.add("selected");
    ensureHandles(selected);  // handles only on current selection
  }
  syncPanel();
}
function deselect(){
  if(selected){
    selected.classList.remove("selected");
    removeHandles(selected);
  }
  selected=null; syncPanel();
  closeAllLayerMenus();
}

/* ---------- LAYER HELPERS ---------- */
function normalizeZ(){
  const items = $$(".item", canvas);
  items.forEach((el, i) => {
    const cs = getComputedStyle(el);
    if (cs.position === "static" || !cs.position) el.style.position = "absolute";
    el.style.zIndex = String(100 + i); // below handles (300+)
  });
}
function moveToFront(node){ if(!node) return; canvas.appendChild(node); normalizeZ(); }
function moveToBack(node){ if(!node) return; canvas.insertBefore(node, canvas.firstElementChild); normalizeZ(); }
function moveForward(node){ if(!node) return; const next=node.nextElementSibling; if(next) canvas.insertBefore(node, next.nextElementSibling||null); normalizeZ(); }
function moveBackward(node){ if(!node) return; const prev=node.previousElementSibling; if(prev) canvas.insertBefore(node, prev); normalizeZ(); }

/* ---------- HANDLES + LAYER MENU ---------- */

// Track click-away handlers so we can remove the exact one for each menu
const LAYER_AWAY_LISTENERS = new Set();

function closeAllLayerMenus(){
  $$(".layer-menu", canvas).forEach(m=>{
    if (m._closeFn){
      document.removeEventListener("mousedown", m._closeFn, true);
      LAYER_AWAY_LISTENERS.delete(m._closeFn);
    }
    m.remove();
  });
  // Extra safety in case any listener leaked
  LAYER_AWAY_LISTENERS.forEach(fn=>{
    document.removeEventListener("mousedown", fn, true);
  });
  LAYER_AWAY_LISTENERS.clear();
}

function ensureHandles(node){
  // Only the currently selected node should ever get handles
  if (!node || node !== selected) return;

  removeHandles(node);

  const h = document.createElement("div");
  h.className = "handles";
  h.style.pointerEvents = "none";
  h.style.zIndex = "300";

  const mkBtn = (cls, txt, styles={})=>{
    const b=document.createElement("button");
    b.type="button";
    b.className=cls;
    b.textContent=txt;
    b.style.pointerEvents="auto";
    b.style.zIndex="301";
    Object.assign(b.style, styles);
    return b;
  };

  const x = mkBtn("btnX","✕",{top:"-10px",right:"-10px",position:"absolute"});
  const r = mkBtn("btnRot","⟲",{bottom:"-10px",left:"-10px",position:"absolute"});
  const s = mkBtn("btnResize","⤡",{bottom:"-10px",right:"-10px",position:"absolute"});
  const layerBtn = mkBtn("btnLayer","▲",{top:"-10px",left:"-10px",position:"absolute",width:"22px",height:"22px"});
  layerBtn.title = "Layer options";

  h.append(x, r, s, layerBtn);

  // background shape on text gets its own resize handle (◼)
  if (node.classList.contains("text") && (node.dataset.bgShape || "none") !== "none"){
    const btnBg = mkBtn("btnBgResize","◼",{bottom:"-10px",right:"28px",position:"absolute"});
    h.append(btnBg);
    btnBg.addEventListener("mousedown", startBgResize);
  }

  node.appendChild(h);

  const removeNode = (e)=>{
    e.preventDefault(); e.stopPropagation();
    snapshot();
    closeAllLayerMenus();
    node.remove();
    if (selected === node) selected = null;
    updateCanvasSize();
    maybeShowPlaceholder();
  };
  x.addEventListener("pointerdown", removeNode);
  x.addEventListener("click", removeNode);
  x.addEventListener("touchstart", removeNode, {passive:false});

  r.addEventListener("mousedown",(e)=>{
    e.stopPropagation(); rotating=true;
    const rect=node.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    rotateStart=Math.atan2(e.clientY-cy, e.clientX-cx)*180/Math.PI;
    rotateBase=parseFloat(node.dataset.rotate||0);
    document.addEventListener("mousemove",rotDrag);
    document.addEventListener("mouseup",rotStop);
  });
  s.addEventListener("mousedown",(e)=>{
    e.stopPropagation();
    if(node.classList.contains("image")) startImageResize(e);
    else if(node.classList.contains("text")) startTextBoxResize(e);
  });

  // Re-assert selection before toggling menu to avoid stale-away issues
  layerBtn.addEventListener("click",(e)=>{
    e.stopPropagation();
    select(node);
    toggleLayerMenu(node, layerBtn);
  });
}
function removeHandles(node){ node.querySelector(".handles")?.remove(); }

function toggleLayerMenu(node, anchorBtn){
  // If this node already has one, close just that one (true toggle)
  const open = node.querySelector(".layer-menu");
  if (open){
    if (open._closeFn){
      document.removeEventListener("mousedown", open._closeFn, true);
      LAYER_AWAY_LISTENERS.delete(open._closeFn);
    }
    open.remove();
    return;
  }

  // Otherwise close others and open a fresh one
  closeAllLayerMenus();

  const menu = document.createElement("div");
  menu.className = "layer-menu";
  Object.assign(menu.style, {
    position:"absolute",
    top:"16px",
    left:"-10px",
    background:"#fff",
    border:"1px solid #c9c2ae",
    borderRadius:"10px",
    boxShadow:"0 8px 20px rgba(0,0,0,.15)",
    padding:"6px",
    display:"flex",
    flexDirection:"column",
    gap:"6px",
    zIndex:"9999"
  });

  const mk = (label, fn)=>{
    const b=document.createElement("button");
    b.type="button";
    b.textContent=label;
    Object.assign(b.style, {
      all:"unset",
      cursor:"pointer",
      padding:"6px 10px",
      borderRadius:"8px",
      fontSize:"12px",
      border:"1px solid #e0dac8"
    });
    b.addEventListener("click",(e)=>{
      e.stopPropagation();
      snapshot();
      fn(node);
      closeAllLayerMenus();
    });
    b.addEventListener("mouseenter",()=>b.style.background="#f7f4ea");
    b.addEventListener("mouseleave",()=>b.style.background="transparent");
    return b;
  };

  menu.append(
    mk("Bring to Front", moveToFront),
    mk("Bring Forward",  moveForward),
    mk("Send Backward",  moveBackward),
    mk("Send to Back",   moveToBack)
  );
  node.appendChild(menu);

  // Click-away
  setTimeout(()=>{
    const closeOnAway = (ev)=>{
      if(!menu.contains(ev.target) && ev.target!==anchorBtn){
        document.removeEventListener("mousedown", closeOnAway, true);
        LAYER_AWAY_LISTENERS.delete(closeOnAway);
        menu.remove();
      }
    };
    menu._closeFn = closeOnAway;
    LAYER_AWAY_LISTENERS.add(closeOnAway);
    document.addEventListener("mousedown", closeOnAway, true);
  },0);
}

/* drag with mouse */
function startDrag(e){
  if(isEditing) return;
  if(e.target.closest(".btnX,.btnRot,.btnResize,.btnLayer,input,select,.num,textarea")) return;
  dragging=true; select(e.currentTarget);
  const r=selected.getBoundingClientRect();
  dragOff.x=e.clientX-r.left; dragOff.y=e.clientY-r.top; e.preventDefault();
  document.addEventListener("mousemove",dragMove);
  document.addEventListener("mouseup",dragStop);
}
function dragMove(e){
  if(!dragging||!selected) return;
  const c=canvas.getBoundingClientRect();
  const x=Math.max(0,e.clientX-c.left-dragOff.x);
  const y=Math.max(0,e.clientY-c.top-dragOff.y);
  selected.style.left=x+"px"; selected.style.top=y+"px";
}
function dragStop(){
  dragging=false;
  document.removeEventListener("mousemove",dragMove);
  if(selected?.classList.contains("text")) rerender();
  updateCanvasSize();
}

/* rotation (mouse) */
function rotDrag(e){
  if(!rotating||!selected) return;
  const rect=selected.getBoundingClientRect(); const cx=rect.left+rect.width/2; const cy=rect.top+rect.height/2;
  const ang=Math.atan2(e.clientY-cy, e.clientX-cx)*180/Math.PI; const deg=Math.round(rotateBase+(ang-rotateStart));
  selected.dataset.rotate=deg; selected.style.transform=`rotate(${deg}deg)`;
  $("#rotateSlider") && ($("#rotateSlider").value = deg);
  $("#rotateNum") && ($("#rotateNum").value = deg);
}
function rotStop(){ rotating=false; document.removeEventListener("mousemove",rotDrag); document.removeEventListener("mouseup",rotStop); updateCanvasSize(); }

/* ===== image resize (IMG + inline SVG) ===== */
function startImageResize(e){
  if(!selected?.classList.contains("image")) return;
  const el = selected.querySelector("img, svg");
  if(!el) return;
  const w = (el.tagName.toLowerCase()==="img")
           ? el.offsetWidth
           : parseFloat(el.getAttribute("width")) || el.getBoundingClientRect().width;
  const h = (el.tagName.toLowerCase()==="img")
           ? el.offsetHeight
           : parseFloat(el.getAttribute("height")) || el.getBoundingClientRect().height;

  resizing = true;
  resizeStart = { x: e.clientX, y: e.clientY };
  resizeBase  = { w, h };
  document.addEventListener("mousemove", resizeMove);
  document.addEventListener("mouseup",   resizeStop);
}
function resizeMove(e){
  if(!resizing || !selected) return;
  const el = selected.querySelector("img, svg");
  if(!el) return;

  const dx = e.clientX - resizeStart.x;
  const newW = Math.max(1, resizeBase.w + dx);
  const aspect = resizeBase.h / resizeBase.w;

  if (el.tagName.toLowerCase() === "img") {
    el.style.width  = newW + "px";
    el.style.height = Math.round(newW * aspect) + "px";
  } else {
    el.setAttribute("width",  String(newW));
    el.setAttribute("height", String(Math.round(newW * aspect)));
  }
}
function resizeStop(){ resizing=false; document.removeEventListener("mousemove",resizeMove); document.removeEventListener("mouseup",resizeStop); updateCanvasSize(); }

/* ===== text box resize (Figma-like wrapping) ===== */
function startTextBoxResize(e){
  if(!selected?.classList.contains("text")) return;
  textResizing = true;
  textResizeStartX = e.clientX;
  const currentW = +selected.dataset.boxW || selected.getBoundingClientRect().width || 320;
  textResizeBaseW = currentW;
  document.addEventListener("mousemove", textBoxResizeMove);
  document.addEventListener("mouseup",   textBoxResizeStop, { once:true });
}
function textBoxResizeMove(e){
  if(!textResizing || !selected) return;
  const dx = e.clientX - textResizeStartX;
  const newW = Math.max(40, textResizeBaseW + dx);
  selected.dataset.boxW = String(newW);
  rerender();
}
function textBoxResizeStop(){
  textResizing = false;
  document.removeEventListener("mousemove", textBoxResizeMove);
}

/* ===== background rect/circle resize for text ===== */
let bgResizing=false, bgResizeStart={x:0,y:0}, bgResizeBase={w:0,h:0,r:0};
function startBgResize(e){
  if(!selected?.classList.contains("text")) return;
  const shape = selected.dataset.bgShape || "none";
  if(shape === "none") return;
  e.stopPropagation();

  bgResizing = true;
  bgResizeStart = { x: e.clientX, y: e.clientY };

  if (shape === "rect"){
    bgResizeBase.w = +selected.dataset.bgRectW || 420;
    bgResizeBase.h = +selected.dataset.bgRectH || 240;
  } else if (shape === "circle"){
    bgResizeBase.r = +selected.dataset.bgRadius || 180;
  }

  document.addEventListener("mousemove", bgResizeMove);
  document.addEventListener("mouseup",   bgResizeStop, { once:true });
}
function bgResizeMove(e){
  if(!bgResizing || !selected) return;
  const shape = selected.dataset.bgShape || "none";
  const dx = e.clientX - bgResizeStart.x;
  const dy = e.clientY - bgResizeStart.y;

  if (shape === "rect"){
    const newW = Math.max(20, Math.round(bgResizeBase.w + dx));
    const newH = Math.max(20, Math.round(bgResizeBase.h + dy));
    selected.dataset.bgRectW = String(newW);
    selected.dataset.bgRectH = String(newH);
  } else if (shape === "circle"){
    const delta = Math.max(dx, dy);
    const newR = Math.max(10, Math.round(bgResizeBase.r + delta));
    selected.dataset.bgRadius = String(newR);
  }
  rerender();
}
function bgResizeStop(){
  bgResizing = false;
  document.removeEventListener("mousemove", bgResizeMove);
}

/* ---------- CENTER WHOLE DESIGN ---------- */
function centerItem(n){
  const r = n.getBoundingClientRect();
  const cx = (canvas.clientWidth  - r.width ) / 2;
  const cy = (canvas.clientHeight - r.height) / 2;
  n.style.left = Math.max(0, cx) + "px";
  n.style.top  = Math.max(0, cy) + "px";
}
function centerDesign(){
  const items = $$(".item", canvas);
  if(!items.length) return;

  const cRect = canvas.getBoundingClientRect();
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  items.forEach(n=>{
    const r = n.getBoundingClientRect();
    const x = r.left - cRect.left;
    const y = r.top  - cRect.top;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + r.width);
    maxY = Math.max(maxY, y + r.height);
  });
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);
  const bboxCx = minX + bboxW/2;
  const bboxCy = minY + bboxH/2;

  const targetCx = canvas.clientWidth/2;
  const targetCy = canvas.clientHeight/2;

  const dx = targetCx - bboxCx;
  const dy = targetCy - bboxCy;

  snapshot();
  items.forEach(n=>{
    const left = parseFloat(n.style.left||0);
    const top  = parseFloat(n.style.top ||0);
    n.style.left = (left + dx) + "px";
    n.style.top  = (top  + dy) + "px";
  });

  updateCanvasSize();
}
$("#btnCenter")?.addEventListener("click", centerDesign);
$("#btnCenterDesign")?.addEventListener("click", centerDesign);

/* ---------- toolbar + actions ---------- */
const fileInputEl = $("#hiddenFile");
$("#btnAddText")?.addEventListener("click",()=>{ snapshot(); createText("Edit this text"); });
fileInputEl?.addEventListener("change",(e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const rd=new FileReader(); rd.onload=ev=>{ snapshot(); createImage(ev.target.result); };
  rd.readAsDataURL(f); fileInputEl.value="";
});
$("#btnUpload")?.addEventListener("click",()=>fileInputEl?.click());

/* ========= UNIVERSAL EXPORT HELPERS ========= */
async function urlToDataURL(url){
  if (!url || url.startsWith("data:")) return url;
  url = url.replace(/^url\((['"]?)(.*?)\1\)$/, "$2");
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch (_) {
    return url; // best-effort fallback
  }
}

async function inlineNodeImages(root){
  const promises = [];

  root.querySelectorAll("img").forEach(img => {
    promises.push((async () => {
      if (!img.src) return;
      try { img.src = await urlToDataURL(img.src); } catch(_) {}
    })());
  });

  root.querySelectorAll("svg").forEach(svg => {
    const vb = svg.getAttribute("viewBox");
    if (vb && (!svg.getAttribute("width") || !svg.getAttribute("height"))) {
      const [, , w, h] = vb.split(/\s+/).map(parseFloat);
      if (w && h) { svg.setAttribute("width", w); svg.setAttribute("height", h); }
    }
    svg.querySelectorAll("image").forEach(imgEl => {
      const href = imgEl.getAttribute("href") || imgEl.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href) return;
      promises.push((async ()=>{
        try {
          const data = await urlToDataURL(href);
          imgEl.setAttribute("href", data);
          imgEl.setAttributeNS("http://www.w3.org/1999/xlink","href", data);
        } catch(_) {}
      })());
    });
  });

  root.querySelectorAll("*").forEach(node => {
    const cs = getComputedStyle(node);
    const bg = cs.backgroundImage;
    if (bg && bg !== "none" && /url\(/i.test(bg)) {
      promises.push((async ()=>{
        const parts = bg.split(/,\s*/);
        const converted = await Promise.all(parts.map(async p => `url("${await urlToDataURL(p)}")`));
        node.style.backgroundImage = converted.join(", ");
      })());
    }
  });

  await Promise.all(promises);
}

function buildExportRootOnlyItems(){
  const items = $$(".item", canvas);
  if (!items.length) return null;

  const cRect = canvas.getBoundingClientRect();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  items.forEach(n => {
    const r = n.getBoundingClientRect();
    const x = r.left - cRect.left;
    const y = r.top  - cRect.top;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + r.width);
    maxY = Math.max(maxY, y + r.height);
  });

  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.ceil(maxX);
  maxY = Math.ceil(maxY);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);

  const wrap = document.createElement("div");
  wrap.style.position="fixed"; wrap.style.left="-10000px"; wrap.style.top="0";
  wrap.style.width=w+"px"; wrap.style.height=h+"px"; wrap.style.background="transparent";

  const exportRoot = document.createElement("div");
  exportRoot.style.position="relative";
  exportRoot.style.width=w+"px"; exportRoot.style.height=h+"px";
  exportRoot.style.background="transparent";

  items.forEach(n => {
    const clone = n.cloneNode(true);
    clone.classList.remove("selected");
    clone.querySelector(".handles")?.remove();
    clone.querySelector(".layer-menu")?.remove();
    clone.style.border     = "0";
    clone.style.padding    = "0";
    clone.style.background = "transparent";
    clone.querySelectorAll(".img-wrap").forEach(wrap => { wrap.style.background = "transparent"; });

    const r = n.getBoundingClientRect();
    const x = r.left - cRect.left - minX;
    const y = r.top  - cRect.top  - minY;
    clone.style.left     = x + "px";
    clone.style.top      = y + "px";
    clone.style.position = "absolute";

    exportRoot.appendChild(clone);
  });

  wrap.appendChild(exportRoot);
  document.body.appendChild(wrap);
  return {wrap, exportRoot};
}

/* ====== FONT PRELOAD HELPERS (for correct export) ====== */
function ensureFontLink(family){
  if (!family) return;
  const famKey = family.trim().replace(/\s+/g,'+');
  const id = `gf-${famKey.toLowerCase()}`;
  if (document.getElementById(id)) return;
  const href = `https://fonts.googleapis.com/css2?family=${famKey}:wght@100..900&display=swap`;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function ensureAllDesignFontsReady() {
  const fams = new Set();
  const sizes = new Set();

  $$(".item.text", canvas).forEach(n => {
    const f = n.dataset.fontFamily || "Lily Script One";
    const sz = +(n.dataset.fontSize || 64);
    fams.add(f);
    sizes.add(sz);
  });

  fams.forEach(ensureFontLink);

  if (document.fonts && document.fonts.load) {
    const loads = [];
    fams.forEach(f => {
      sizes.forEach(sz => {
        loads.push(document.fonts.load(`${sz}px "${f}"`));
        loads.push(document.fonts.load(`700 ${sz}px "${f}"`));
      });
    });
    try { await Promise.all(loads); } catch(_) {}
    try { await document.fonts.ready; } catch(_) {}
  }
}

/* ========= SAVE IMAGE (only the design) ========= */
async function saveImageOnlyDesign(){
  try {
    // Load all fonts used so the export matches exactly
    await ensureAllDesignFontsReady();

    const items = $$(".item", canvas);
    if (!items.length) {
      alert("Nothing to export.");
      return;
    }

    // Hide handles/menus so they don’t appear
    const hidden = [];
    $$(".handles,.layer-menu", canvas).forEach(h => { hidden.push(h); h.style.display = "none"; });

    // Find bounding box of all items
    const cRect = canvas.getBoundingClientRect();
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    items.forEach(n=>{
      const r=n.getBoundingClientRect();
      const x=r.left-cRect.left, y=r.top-cRect.top;
      minX=Math.min(minX,x); minY=Math.min(minY,y);
      maxX=Math.max(maxX,x+r.width); maxY=Math.max(maxY,y+r.height);
    });
    minX=Math.floor(minX); minY=Math.floor(minY);
    maxX=Math.ceil(maxX); maxY=Math.ceil(maxY);
    const w=Math.max(1,maxX-minX), h=Math.max(1,maxY-minY);

    // Build export root containing only items
    const wrap=document.createElement("div");
    wrap.style.position="fixed"; wrap.style.left="-9999px"; wrap.style.top="0";
    wrap.style.width=w+"px"; wrap.style.height=h+"px";

    const exportRoot=document.createElement("div");
    exportRoot.style.position="relative";
    exportRoot.style.width=w+"px"; exportRoot.style.height=h+"px";
    exportRoot.style.background="transparent";

    items.forEach(n=>{
      const clone=n.cloneNode(true);
      clone.classList.remove("selected");
      clone.querySelector(".handles")?.remove();
      clone.querySelector(".layer-menu")?.remove();
      const r=n.getBoundingClientRect();
      const x=r.left-cRect.left-minX, y=r.top-cRect.top-minY;
      clone.style.left=x+"px"; clone.style.top=y+"px"; clone.style.position="absolute";
      exportRoot.appendChild(clone);
    });

    wrap.appendChild(exportRoot);
    document.body.appendChild(wrap);

    // Inline any <img> or <svg> images
    await inlineNodeImages(exportRoot);

    // Safety: wait one more time in case SVG text reflowed
    await ensureAllDesignFontsReady();

    // Render to canvas
    const outCanvas = await html2canvas(exportRoot, {
      backgroundColor: null, // keep transparent
      scale: 2,
      useCORS: true
    });

    document.body.removeChild(wrap);
    hidden.forEach(h=>h.style.display="");

    // Download PNG
    const a=document.createElement("a");
    a.href=outCanvas.toDataURL("image/png");
    a.download="design.png";
    a.click();
  } catch (err) {
    console.error(err);
    alert("Save failed: " + err.message);
  }
}
window.saveImage = saveImageOnlyDesign;
$("#btnSave")?.addEventListener("click", saveImageOnlyDesign);
$('[data-action="save-image"]')?.addEventListener("click", saveImageOnlyDesign);

/* ---------- CREATE IMAGE / TEXT ---------- */
const DEFAULT_SHAPE_SIZE = 260;

function createImage(src){
  hidePlaceholder();
  seq++;

  const n = document.createElement("div");
  n.className = "item image";
  n.dataset.rotate = "0";

  if (typeof src === "string" && src.startsWith("data:image/svg+xml")) {
    const svgText = decodeURIComponent(src.replace(/^data:image\/svg\+xml;utf8,/, ""));
    n.innerHTML = `<div class="img-wrap" style="background:transparent;">${svgText}</div>`;
  } else {
    n.innerHTML = `<div class="img-wrap" style="background:transparent;"><img alt="art"/></div>`;
    const img = n.querySelector("img");
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = src;
  }

  canvas.appendChild(n);
  rebind(); select(n);

  requestAnimationFrame(() => {
    const el = n.querySelector("img, svg");
    if (el) {
      if (el.tagName.toLowerCase() === "svg") {
        
        // Give default size to SVG art so it isn't tiny
        if (!el.getAttribute("width"))  el.setAttribute("width",  String(DEFAULT_SHAPE_SIZE));
        if (!el.getAttribute("height")) el.setAttribute("height", String(DEFAULT_SHAPE_SIZE));
      }
      if (el.tagName.toLowerCase() === "img" && !el.complete) {
        el.addEventListener("load", () => { centerItem(n); updateCanvasSize(); }, { once: true });
      } else {
        centerItem(n);
        updateCanvasSize();
      }
    } else {
      centerItem(n);
      updateCanvasSize();
    }
  });
}

function createText(txt){
  hidePlaceholder();
  seq++;
  const n=document.createElement("div");
  n.className="item text";
  n.style.left="0px";
  n.style.top ="0px";
  n.dataset.content=txt; n.dataset.fontFamily="Lily Script One"; n.dataset.fontSize="64";
  n.dataset.fill="#ffffff"; n.dataset.stroke="#00ffff"; n.dataset.strokeWidth="0";
  n.dataset.anchor="start"; n.dataset.shape="straight"; n.dataset.curve="120"; n.dataset.rotate="0";
  n.dataset.bgShape="none"; n.dataset.bgColor="#ffffff"; n.dataset.bgOpacity="0";
  n.dataset.bgRectW="420"; n.dataset.bgRectH="240"; n.dataset.bgRadius="180";
  n.dataset.boxW="360";
  n.innerHTML=textSVG(`t${seq}`,txt, optionsFromNode(n), n);
  canvas.appendChild(n);
  rebind(); select(n);

  requestAnimationFrame(()=>{
    rerender();
    requestAnimationFrame(()=>{ centerItem(n); updateCanvasSize(); });
  });
}

/* ========= text SVG (with wrapping for straight) ========= */
const measCanvas = document.createElement("canvas");
const measCtx = measCanvas.getContext("2d");

function optionsFromNode(n){
  return {
    fontFamily:n.dataset.fontFamily, fontSize:+n.dataset.fontSize, fill:n.dataset.fill,
    stroke:n.dataset.stroke, strokeWidth:+n.dataset.strokeWidth, anchor:n.dataset.anchor,
    shape:n.dataset.shape, curve:+n.dataset.curve,
    bgShape:n.dataset.bgShape, bgColor:n.dataset.bgColor, bgOpacity:+n.dataset.bgOpacity,
    bgRectW:+n.dataset.bgRectW, bgRectH:+n.dataset.bgRectH, bgRadius:+n.dataset.bgRadius,
    boxW:+(n.dataset.boxW||0)
  };
}

function measureTextWidth(text, family, size){
  measCtx.font = `${size}px "${family}", system-ui, sans-serif`;
  return measCtx.measureText(text).width;
}

function wrapLines(text, family, size, maxWidth){
  measCtx.font = `${size}px "${family}", system-ui, sans-serif`;
  const words = (text || "").replace(/\s+/g, " ").trim().split(" ");
  if (maxWidth <= 0 || words.length === 0) return [text || ""];
  const lines = [];
  let line = "";

  for (let i=0; i<words.length; i++){
    const tryLine = line ? (line + " " + words[i]) : words[i];
    if (measureTextWidth(tryLine, family, size) <= maxWidth){
      line = tryLine;
    } else {
      if (line) lines.push(line);
      line = words[i];
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textSVG(id,text,o,nodeForWrap){
  const pad = Math.max(12, o.fontSize*0.4);
  const lineH = o.fontSize * 1.2;

  let lines = [];
  let blockW = 0;
  let blockH = 0;

  if (o.shape === "straight"){
    const wrapLimit = nodeForWrap ? computeWrapLimit(nodeForWrap) : Infinity;
    const desiredBoxW = Math.max(40, o.boxW || 0);
    const effectiveWrapW = Math.max(40, Math.min(desiredBoxW, wrapLimit));

    lines = wrapLines(text, o.fontFamily, o.fontSize, effectiveWrapW);
    blockW = Math.max(1, Math.max(...lines.map(l => measureTextWidth(l, o.fontFamily, o.fontSize))));
    blockH = Math.max(lineH * lines.length, lineH);
    var renderW = Math.max(effectiveWrapW, blockW);
  }

  let sW=0,sH=0;
  if(o.bgShape==="rect" && o.bgOpacity>0){ sW=Math.max(0,o.bgRectW); sH=Math.max(0,o.bgRectH); }
  if(o.bgShape==="circle" && o.bgOpacity>0){ const r=Math.max(0,o.bgRadius); sW=sH=2*r; }

  let cW = Math.max((o.shape==="straight" ? (renderW + pad*2) : 0), sW || 0);
  let cH = Math.max((o.shape==="straight" ? (blockH + pad*2) : 0), sH || 0);

  if (o.shape !== "straight"){
    const estW = Math.max(o.fontSize*0.6*(text?.length||0), o.fontSize*2);
    const estH = o.fontSize*1.2;
    cW = Math.max(cW, estW + pad*2);
    cH = Math.max(cH, estH + pad*2);
  }

  const w=Math.ceil(Math.max(1,cW));
  const h=Math.ceil(Math.max(1,cH));
  const cx=w/2, cy=h/2;

  let defs="", bg="", body="";
  if(o.bgShape==="rect" && o.bgOpacity>0){
    const x=cx-(sW||cW)/2, y=cy-(sH||cH)/2;
    bg=`<rect x="${x}" y="${y}" width="${sW}" height="${sH}" rx="${Math.min(16,pad)}" fill="${o.bgColor}" fill-opacity="${o.bgOpacity}"/>`;
  }
  if(o.bgShape==="circle" && o.bgOpacity>0){
    const r=sW/2;
    bg=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.bgColor}" fill-opacity="${o.bgOpacity}"/>`;
  }

  if(o.shape==="straight"){
    const anchor = (o.anchor==="middle" ? "middle" : (o.anchor==="end" ? "end" : "start"));
    let x;
    if (anchor === "start")      x = cx - (renderW/2);
    else if (anchor === "middle")x = cx;
    else                         x = cx + (renderW/2);

    const startY = cy - (lineH*(lines.length-1))/2;
    const tspans = lines.map((ln,i)=>
      `<tspan x="${x}" y="${startY + i*lineH}">${escapeHTML(ln)}</tspan>`
    ).join("");

    body=`<text text-anchor="${anchor}" dominant-baseline="middle"
      font-family="${o.fontFamily}" font-size="${o.fontSize}" fill="${o.fill}"
      stroke="${o.stroke}" stroke-width="${o.strokeWidth}"
      stroke-linejoin="round" stroke-linecap="round" paint-order="stroke">${tspans}</text>`;
  } else if(o.shape==="arcUp"||o.shape==="arcDown"){
    const r=o.curve, sweep=(o.shape==="arcUp")?0:1, startX=cx-r, endX=cx+r, y=cy, pid=`p-${id}`;
    defs=`<defs><path id="${pid}" d="M ${startX} ${y} A ${r} ${r} 0 0 ${sweep} ${endX} ${y}"/></defs>`;
    body=`<text font-family="${o.fontFamily}" font-size="${o.fontSize}" fill="${o.fill}"
      stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke">
      <textPath href="#${pid}" startOffset="50%" text-anchor="middle">${escapeHTML(text)}</textPath></text>`;
  } else {
    const d=o.curve, r=d/2, pid=`p-${id}`;
    defs=`<defs><path id="${pid}" d="M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 ${d},0 a ${r},${r} 0 1,1 -${d},0"/></defs>`;
    body=`<text font-family="${o.fontFamily}" font-size="${o.fontSize}" fill="${o.fill}"
      stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke">
      <textPath href="#${pid}" startOffset="25%">${escapeHTML(text)}</textPath></text>`;
  }

  return `<svg class="text-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${bg}${body}</svg>`;
}

function rerender(){
  if(!selected || !selected.classList.contains("text")) return;
  const o=optionsFromNode(selected);
  selected.innerHTML=textSVG(`t${Date.now()}`, selected.dataset.content||"", o, selected);
  selected.style.transform=`rotate(${selected.dataset.rotate||0}deg)`;
  // handles only for the selected node
  ensureHandles(selected);
  updateCanvasSize();
}

/* auto-grow canvas (never shrinks) */
function updateCanvasSize(pad=60){
  const items=$$(".item",canvas);
  if(!items.length){
    canvas.style.minWidth  = stage.clientWidth + "px";
    canvas.style.minHeight = stage.clientHeight + "px";
    sizeCanvasToStage();
    return;
  }
  let maxX=0,maxY=0;
  items.forEach(n=>{
    const w=n.getBoundingClientRect().width;
    const h=n.getBoundingClientRect().height;
    const left=n.offsetLeft, top=n.offsetTop;
    maxX=Math.max(maxX,left+w+pad);
    maxY=Math.max(maxY,top +h+pad);
  });
  canvas.style.minWidth = Math.max(stage.clientWidth,  maxX) + "px";
  canvas.style.minHeight= Math.max(stage.clientHeight, maxY) + "px";
  sizeCanvasToStage();
}

/* ========= UI wiring ========= */
const textContent=$("#textContent");
const addTextBtn=$("#addTextBtn");
const fontFamily=$("#fontFamily"), fontPreview=$("#fontPreview");
const fillChip=$("#fillChip"), fillName=$("#fillName");
const rotateSlider=$("#rotateSlider"), rotateNum=$("#rotateNum");
const outlineSlider=$("#outlineSlider"), strokeChip=$("#strokeChip"), strokeName=$("#strokeName");
const fontSizeSlider=$("#fontSizeSlider"), fontSize=$("#fontSize");

/* Alignment buttons */
const alL=$("#alL"), alC=$("#alC"), alR=$("#alR");
function setAlign(a){
  alL?.classList.toggle("active", a==='start');
  alC?.classList.toggle("active", a==='middle');
  alR?.classList.toggle("active", a==='end');

  if(selected?.classList.contains("text")){
    selected.dataset.anchor=a;
    if (activeEditor){
      activeEditor.style.textAlign = (a==="middle"?"center":a==="end"?"right":"left");
      const width  = activeEditor.clientWidth;
      const boxW   = selected.getBoundingClientRect().width || width;
      let leftPos = selected.offsetLeft;
      if (a === "middle") leftPos = selected.offsetLeft + (boxW - width)/2;
      if (a === "end")    leftPos = selected.offsetLeft + (boxW - width);
      activeEditor.style.left = Math.max(0,leftPos) + "px";
    }
    rerender();
  }
}
alL?.addEventListener("click",()=>setAlign("start"));
alC?.addEventListener("click",()=>setAlign("middle"));
alR?.addEventListener("click",()=>setAlign("end"));

/* background refs */
const bgToggleRow=$("#bgToggleRow");
const bgOptions=$("#bgOptions");
const bgShape=$("#bgShape");
const bgColor=$("#bgColor");
const bgOpacity=$("#bgOpacity");
const bgOpacityNum=$("#bgOpacityNum");
const rectDims=$("#rectDims");
const circleDims=$("#circleDims");
const bgRectW=$("#bgRectW"), bgRectWNum=$("#bgRectWNum");
const bgRectH=$("#bgRectH"), bgRectHNum=$("#bgRectHNum");
const bgRadius=$("#bgRadius"), bgRadiusNum=$("#bgRadiusNum");

/* palette */
const PALETTE=["#000000","#FFFFFF","#FF3333","#00FFFF","#FFFF00","#00FF00","#0000FF","#FF69B4","#C0C0C0"];
let paletteTarget="fill", paletteSelected=null;

function buildPalette(curr){
  const grid=$("#paletteGrid"); if(!grid) return;
  grid.innerHTML=""; paletteSelected=(curr||"#ffffff").toLowerCase();
  const wc=$("#whiteChk"); if(wc) wc.checked=(paletteSelected==="#ffffff");
  PALETTE.forEach(hex=>{
    const sw=document.createElement("div"); sw.className="swatch"; sw.style.background=hex;
    if(hex.toLowerCase()===paletteSelected) sw.classList.add("selected");
    sw.addEventListener("click",()=>{
      $$(".swatch",grid).forEach(s=>s.classList.remove("selected"));
      sw.classList.add("selected");
      const wch=$("#whiteChk"); if(wch) wch.checked=(hex.toLowerCase()==="#ffffff");
      paletteSelected=hex.toLowerCase();
    });
    grid.appendChild(sw);
  });
}
$("#whiteChk")?.addEventListener("change",e=>{
  if(e.target.checked){
    paletteSelected="#ffffff";
    $$(".swatch",$("#paletteGrid")||document.createElement("div")).forEach(s=>s.classList.remove("selected"));
  }
});
$("#paletteDone")?.addEventListener("click",()=>{
  if(!selected?.classList.contains("text")){ closeModal("#colorModal"); return; }
  const hex=paletteSelected||("#ffffff");
  if(paletteTarget==='fill'){
    selected.dataset.fill=hex; if(fillChip){ fillChip.style.background=hex; if(fillName) fillName.textContent=nameColor(hex); }
  } else {
    selected.dataset.stroke=hex; if(strokeChip){ strokeChip.style.background=hex; if(strokeName) strokeName.textContent=nameColor(hex); }
  }
  rerender(); closeModal("#colorModal");
});
fillChip?.addEventListener("click",()=>{ paletteTarget='fill'; const t=$("#paletteTitle"); if(t) t.textContent="Font Colors"; buildPalette(selected?.dataset.fill||"#ffffff"); openModal("#colorModal"); });
strokeChip?.addEventListener("click",()=>{ paletteTarget='stroke'; const t=$("#paletteTitle"); if(t) t.textContent="Outline Colors"; buildPalette(selected?.dataset.stroke||"#00ffff"); openModal("#colorModal"); });

/* add text */
addTextBtn?.addEventListener("click",()=>{
  const val=(textContent?.value||"").trim() || "New Text";
  snapshot(); createText(val);
});

/* sync panel with selection */
function syncPanel(){
  const isText = selected && selected.classList.contains("text");

  if (textContent) textContent.value = isText ? (selected.dataset.content || "") : "";
  const fam = isText ? selected.dataset.fontFamily : "Lily Script One";
  if (fontFamily){ fontFamily.value=fam; if(fontPreview){ fontPreview.style.fontFamily=fam; fontPreview.textContent=fam; } }

  const fill   = isText ? selected.dataset.fill   : "#ffffff";
  const stroke = isText ? selected.dataset.stroke : "#00ffff";
  const rot    = isText ? +(selected.dataset.rotate||0) : 0;
  const sw     = isText ? +(selected.dataset.strokeWidth||0) : 0;
  const fs     = isText ? +(selected.dataset.fontSize||64) : 64;
  const anch   = isText ? (selected.dataset.anchor || "start") : "start";

  if (fillChip){ fillChip.style.background=fill; if(fillName) fillName.textContent=nameColor(fill); }
  if (strokeChip){ strokeChip.style.background=stroke; if(strokeName) strokeName.textContent=nameColor(stroke); }
  if (rotateSlider) rotateSlider.value=rot;
  if (rotateNum) rotateNum.value=rot;
  if (outlineSlider) outlineSlider.value=sw;

  if (fontSizeSlider) fontSizeSlider.value=fs;
  if (fontSize) fontSize.value=fs;

  alL?.classList.toggle("active", anch==='start');
  alC?.classList.toggle("active", anch==='middle');
  alR?.classList.toggle("active", anch==='end');

  const bShape = isText? selected.dataset.bgShape : "none";
  const bColor = isText? selected.dataset.bgColor : "#ffffff";
  const bOp    = isText? +selected.dataset.bgOpacity : 0;
  const bW     = isText? +selected.dataset.bgRectW : 420;
  const bH     = isText? +selected.dataset.bgRectH : 240;
  const bR     = isText? +selected.dataset.bgRadius : 180;

  if (bgShape)  bgShape.value=bShape;
  if (bgColor)  bgColor.value=bColor;
  if (bgOpacity){ bgOpacity.value=bOp; if(bgOpacityNum) bgOpacityNum.value=bOp; }

  if (bgRectW){ bgRectW.value=bW; if(bgRectWNum) bgRectWNum.value=bW; }
  if (bgRectH){ bgRectH.value=bH; if(bgRectHNum) bgRectHNum.value=bH; }
  if (bgRadius){ bgRadius.value=bR; if(bgRadiusNum) bgRadiusNum.value=bR; }

  toggleBgEditor(bShape);
  if (rectDims)   rectDims.style.display   = (bShape==="rect")   ? "grid" : "none";
  if (circleDims) circleDims.style.display = (bShape==="circle") ? "grid" : "none";
}

/* font & rotation, outline, etc. */
fontFamily?.addEventListener("change",()=>{
  if(fontPreview){ fontPreview.style.fontFamily=fontFamily.value; fontPreview.textContent=fontFamily.value; }
  if(selected?.classList.contains("text")){
    selected.dataset.fontFamily=fontFamily.value;
    ensureFontLink(fontFamily.value); // make sure stylesheet is present
    if(activeEditor){ activeEditor.style.fontFamily = fontFamily.value; }
    rerender();
  }
});
rotateSlider?.addEventListener("input",e=>{ if(rotateNum) rotateNum.value=e.target.value; if(selected){ selected.dataset.rotate=e.target.value; selected.style.transform=`rotate(${e.target.value}deg)`; updateCanvasSize(); }});
rotateNum?.addEventListener("input",e=>{ if(rotateSlider) rotateSlider.value=e.target.value; if(selected){ selected.dataset.rotate=e.target.value; selected.style.transform=`rotate(${e.target.value}deg)`; updateCanvasSize(); }});
outlineSlider?.addEventListener("input",e=>{ if(selected?.classList.contains("text")){ selected.dataset.strokeWidth=e.target.value; rerender(); }});

/* link size slider/num */
function linkPair(rangeEl,numEl,key){
  const set=v=>{ rangeEl.value=numEl.value=v; if(selected?.classList.contains("text")){ selected.dataset[key]=v; if(key==="fontSize" && activeEditor){ activeEditor.style.fontSize = v + "px"; } rerender(); } };
  rangeEl.addEventListener("input",e=>set(e.target.value));
  numEl.addEventListener("input", e=>set(e.target.value));
}
if (fontSizeSlider && fontSize) linkPair(fontSizeSlider,fontSize,"fontSize");

/* BG toggle row only opens when shape != none */
bgToggleRow?.addEventListener("click",()=>{
  if(!bgOptions) return;
  if(bgShape?.value==="none"){ bgOptions.style.display="none"; return; }
  bgOptions.style.display = (bgOptions.style.display==="none" || !bgOptions.style.display) ? "block" : "none";
});
function toggleBgEditor(shapeVal){
  if(!bgOptions) return;
  if(shapeVal==="none"){
    bgOptions.style.display="none";
    const s=$("#bgStatus"); if(s) s.textContent="Off";
  }else{
    bgOptions.style.display="block";
    const s=$("#bgStatus"); if(s) s.textContent=shapeVal[0].toUpperCase()+shapeVal.slice(1);
  }
}

/* background controls */
bgShape?.addEventListener("change",()=>{
  if(!selected?.classList.contains("text")) return;
  selected.dataset.bgShape=bgShape.value;
  if(bgShape.value!=="none" && (+selected.dataset.bgOpacity||0)===0){
    selected.dataset.bgOpacity=1; if(bgOpacity){ bgOpacity.value=1; if(bgOpacityNum) bgOpacityNum.value=1; }
  }
  toggleBgEditor(bgShape.value);
  if(rectDims)   rectDims.style.display   = (bgShape.value==="rect")   ? "grid" : "none";
  if(circleDims) circleDims.style.display = (bgShape.value==="circle") ? "grid" : "none";
  rerender();
});
bgColor?.addEventListener("input",()=>{ if(!selected?.classList.contains("text")) return; selected.dataset.bgColor=bgColor.value; rerender(); });
bgOpacity?.addEventListener("input",()=>{ if(bgOpacityNum) bgOpacityNum.value=bgOpacity.value; if(!selected?.classList.contains("text")) return; selected.dataset.bgOpacity=bgOpacity.value; rerender(); });
bgOpacityNum?.addEventListener("input",()=>{ let v=Math.max(0,Math.min(1,parseFloat(bgOpacityNum.value||0))); if(bgOpacity) bgOpacity.value=v; if(!selected?.classList.contains("text")) return; selected.dataset.bgOpacity=v; rerender(); });

if (bgRectW && bgRectWNum) linkPair(bgRectW,bgRectWNum,"bgRectW");
if (bgRectH && bgRectHNum) linkPair(bgRectH,bgRectHNum,"bgRectH");
if (bgRadius && bgRadiusNum) linkPair(bgRadius,bgRadiusNum,"bgRadius");

/* shapes modal */
function chooseShape(s){
  ["shStraight","shArcUp","shArcDown","shCircle"].forEach(id=>$("#"+id)?.classList.remove("active"));
  if(s==="straight") $("#shStraight")?.classList.add("active");
  if(s==="arcUp") $("#shArcUp")?.classList.add("active");
  if(s==="arcDown") $("#shArcDown")?.classList.add("active");
  if(s==="circle") $("#shCircle")?.classList.add("active");
  if(selected){ selected.dataset.shape=s; rerender(); }
}
$("#shStraight")?.addEventListener("click",()=>chooseShape("straight"));
$("#shArcUp")?.addEventListener("click",()=>chooseShape("arcUp"));
$("#shArcDown")?.addEventListener("click",()=>chooseShape("arcDown"));
$("#shCircle")?.addEventListener("click",()=>chooseShape("circle"));
$("#curveSlider")?.addEventListener("input",e=>{ const n=$("#curveNum"); if(n) n.value=e.target.value; });
$("#curveNum")?.addEventListener("input",e=>{ const s=$("#curveSlider"); if(s) s.value=e.target.value; });
$("#curveSlider")?.addEventListener("change",()=>{ if(selected){ selected.dataset.curve=$("#curveSlider").value; rerender(); }});
$("#curveNum")?.addEventListener("change",()=>{ if(selected){ selected.dataset.curve=$("#curveNum").value; rerender(); }});

/* canvas clicks / delete / actions */
canvas?.addEventListener("click",(e)=>{
  if(e.target===canvas || e.target.classList.contains("placeholder")) {
    deselect();
    closeAllLayerMenus();
  }
});
document.addEventListener("keydown",(e)=>{
  if(e.key==="Delete" && selected){
    snapshot();
    closeAllLayerMenus();
    selected.remove();
    selected=null;
    updateCanvasSize();
    maybeShowPlaceholder();
  }
});

/* init */
maybeShowPlaceholder();
rebind();
normalizeZ();
updateCanvasSize();
$$(".x[data-close]")?.forEach(btn=>{ btn.addEventListener("click",()=>closeModal(btn.dataset.close)); });

/* expose for other scripts if needed */
window.createText = createText;
window.createImage = createImage;

/* === Art Library (categories) — add-only (modal) === */
const ART_LIBRARY = {
  shapes: {
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><polygon points="128,12 156,96 244,96 172,148 198,232 128,180 58,232 84,148 12,96 100,96" fill="#FFD54F" stroke="#333" stroke-width="8"/></svg>`,
    heart:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128 224s-80-48-104-96c-16-32 0-80 48-80 32 0 48 24 56 40 8-16 24-40 56-40 48 0 64 48 48 80-24 48-104 96-104 96z" fill="#FF6B81" stroke="#333" stroke-width="8"/></svg>`,
    circle:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="96" fill="#4FC3F7" stroke="#333" stroke-width="8"/></svg>`,
    square:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect x="40" y="40" width="176" height="176" rx="18" fill="#B39DDB" stroke="#333" stroke-width="8"/></svg>`,
    triangle:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><polygon points="128,24 232,220 24,220" fill="#81C784" stroke="#333" stroke-width="8"/></svg>`
  },
  emoji: {
    smile:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="110" fill="#FFEB3B" stroke="#333" stroke-width="8"/><circle cx="92" cy="100" r="12"/><circle cx="164" cy="100" r="12"/><path d="M80 154 q48 44 96 0" stroke="#333" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`,
    cool:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="110" fill="#FFEB3B" stroke="#333" stroke-width="8"/><rect x="70" y="92" width="48" height="20" rx="6" fill="#333"/><rect x="138" y="92" width="48" height="20" rx="6" fill="#333"/><rect x="118" y="100" width="20" height="6" fill="#333"/><path d="M80 160 q48 28 96 0" stroke="#333" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`,
    heartEyes:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="110" fill="#FFEB3B" stroke="#333" stroke-width="8"/><path d="M88 94 l12 -12 12 12 -12 12 z" fill="#E91E63"/><path d="M156 94 l12 -12 12 12 -12 12 z" fill="#E91E63"/><path d="M80 154 q48 44 96 0" stroke="#333" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`
  },
  nature: {
    tree:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><polygon points="128,32 196,132 60,132" fill="#66BB6A" stroke="#333" stroke-width="8"/><rect x="116" y="132" width="24" height="60" fill="#8D6E63" stroke="#333" stroke-width="6"/></svg>`,
    mountain:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><polygon points="32,124 96,36 160,124" fill="#90A4AE" stroke="#333" stroke-width="6"/><polygon points="96,36 124,72 68,72" fill="#ECEFF1"/></svg>`,
    sun:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="48" fill="#FFEB3B" stroke="#333" stroke-width="8"/><g stroke="#333" stroke-width="8"><line x1="128" y1="12" x2="128" y2="48"/><line x1="128" y1="244" x2="128" y2="208"/><line x1="12" y1="128" x2="48" y1="128"/><line x1="244" y1="128" x2="208" y1="128"/><line x1="52" y1="52" x2="76" y1="76"/><line x1="204" y1="52" x2="180" y1="76"/><line x1="52" y1="204" x2="76" y1="180"/><line x1="204" y1="204" x2="180" y1="180"/></g></svg>`
  },
  vehicles: {
    car:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><rect x="28" y="60" width="200" height="52" rx="10" fill="#90CAF9" stroke="#333" stroke-width="6"/><rect x="64" y="30" width="96" height="40" rx="8" fill="#BBDEFB" stroke="#333" stroke-width="6"/><circle cx="76" cy="120" r="16" fill="#333"/><circle cx="176" cy="120" r="16" fill="#333"/></svg>`,
    truck:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><rect x="16" y="60" width="140" height="56" rx="8" fill="#A5D6A7" stroke="#333" stroke-width="6"/><rect x="156" y="72" width="80" height="44" rx="8" fill="#C8E6C9" stroke="#333" stroke-width="6"/><circle cx="64" cy="128" r="16" fill="#333"/><circle cx="176" cy="128" r="16" fill="#333"/></svg>`,
    bike:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><circle cx="64" cy="116" r="28" fill="none" stroke="#333" stroke-width="6"/><circle cx="180" cy="116" r="28" fill="none" stroke="#333" stroke-width="6"/><path d="M64 116 L110 80 L162 80 L180 116" stroke="#333" stroke-width="6" fill="none"/><circle cx="110" cy="80" r="6" fill="#333"/></svg>`
  },
  animals: {
    paw:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="70" cy="90" r="26" fill="#BDBDBD"/><circle cx="120" cy="68" r="26" fill="#BDBDBD"/><circle cx="168" cy="68" r="26" fill="#BDBDBD"/><circle cx="210" cy="90" r="26" fill="#BDBDBD"/><ellipse cx="138" cy="140" rx="60" ry="44" fill="#9E9E9E"/></svg>`,
    fish:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><ellipse cx="120" cy="78" rx="80" ry="40" fill="#80DEEA" stroke="#333" stroke-width="6"/><polygon points="180,78 232,48 232,108" fill="#4DD0E1" stroke="#333" stroke-width="6"/><circle cx="92" cy="72" r="6" fill="#333"/></svg>`,
    bird:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 156"><path d="M16,96 C80,40 176,40 240,96" fill="none" stroke="#333" stroke-width="10"/><path d="M70,96 q40,-40 80,0" fill="none" stroke="#333" stroke-width="8"/></svg>`
  },
  roadsigns: {
    stop:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><polygon points="88,16 168,16 240,88 240,168 168,240 88,240 16,168 16,88" fill="#E53935" stroke="#333" stroke-width="8"/><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-size="80" font-family="Inter, Arial" fill="#fff" font-weight="700">STOP</text></svg>`,
    yield:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 222"><polygon points="128,8 248,214 8,214" fill="#FDD835" stroke="#333" stroke-width="8"/><polygon points="128,36 216,198 40,198" fill="#fff"/></svg>`,
    arrowRight:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128"><rect x="12" y="44" width="180" height="40" rx="8" fill="#FFEE58" stroke="#333" stroke-width="6"/><polygon points="192,24 244,64 192,104" fill="#FFEE58" stroke="#333" stroke-width="6"/></svg>`
  }
};

(function wireArtModal(){
  const btn = $("#btnArt");
  if (!btn) return;

  // FIX: Properly check if modal exists
  const modalExists = !!document.querySelector("#artModal");
  if (!modalExists){
    if (!btn.dataset.boundArtFallback){
      btn.dataset.boundArtFallback = "1";
      btn.addEventListener("click", ()=>{
        const choice = (prompt("Add Art (fallback): star / heart / circle","star")||"star").trim().toLowerCase();
        snapshot(); createImage(svgToDataUrl((ART_LIBRARY.shapes[choice]||ART_LIBRARY.shapes.star)));
      });
    }
    return;
  }

  if (btn.dataset.boundArtModal) return;
  btn.dataset.boundArtModal = "1";
  btn.addEventListener("click", ()=>{ initArtModal(); openModal("#artModal"); });

  let artSelected = {cat:null, key:null};

  function buildArtCategories(){
    const itemGrid = $("#artItemGrid");
    const catGrid  = $("#artCatGrid");
    const backBtn  = $("#artBackBtn");
    const addBtn   = $("#artAddBtn");
    if(!itemGrid || !catGrid || !backBtn || !addBtn) return;

    itemGrid.style.display="none";
    catGrid.style.display="grid";
    backBtn.style.display="none";
    addBtn.disabled = true;
    artSelected = {cat:null, key:null};
  }

  function buildArtItems(cat, query=""){
    const grid = $("#artItemGrid");
    const catGrid = $("#artCatGrid");
    const backBtn = $("#artBackBtn");
    const addBtn  = $("#artAddBtn");
    if(!grid || !catGrid || !backBtn || !addBtn) return;

    grid.innerHTML = "";
    const entries = Object.entries(ART_LIBRARY[cat]||{}).filter(([k,_]) => k.toLowerCase().includes(query));
    entries.forEach(([key, svg])=>{
      const tile = document.createElement("button");
      tile.className = "art-tile"; tile.innerHTML = svg; tile.title = key;
      tile.addEventListener("click", ()=>{
        $$(".art-tile",grid).forEach(t=>t.classList.remove("selected"));
        tile.classList.add("selected");
        artSelected = {cat, key};
        addBtn.disabled = false;
      });
      grid.appendChild(tile);
    });
    catGrid.style.display="none";
    grid.style.display="grid";
    backBtn.style.display="inline-flex";
  }

  function initArtModal(){
    const itemGrid = $("#artItemGrid");
    const addBtn = $("#artAddBtn");
    const backBtn = $("#artBackBtn");
    const search = $("#artSearch");
    if(!itemGrid || !addBtn || !backBtn || !search) return;

    if (!itemGrid.dataset.bound){
      $$(".cat-card")?.forEach(btn=>{
        btn.addEventListener("click", ()=> buildArtItems(btn.dataset.cat, (search.value||"").trim().toLowerCase()) );
      });
      search.addEventListener("input", ()=>{
        if ($("#artItemGrid")?.style.display !== "none" && artSelected.cat){
          buildArtItems(artSelected.cat, (search.value||"").trim().toLowerCase());
        }
      });
      backBtn.addEventListener("click", buildArtCategories);
      addBtn.addEventListener("click", ()=>{
        if(!artSelected.cat || !artSelected.key) return;
        const svg = (ART_LIBRARY[artSelected.cat]||{})[artSelected.key];
        if (!svg) return;
        const src = svgToDataUrl(svg);
        snapshot(); createImage(src);
        closeModal("#artModal");
      });
      itemGrid.dataset.bound = "1";
    }
    buildArtCategories();
  }
})();

/* utils for art */
function svgToDataUrl(svg){
  const cleaned = (svg||"").replace(/\s{2,}/g,' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}
