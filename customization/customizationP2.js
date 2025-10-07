/* =====================================================
   COMPLETE INDOOR SIGNAGE TEMPLATES
   Copy this ENTIRE file and replace your old templates
   ===================================================== */

/* ===== TEMPLATE 1: ELEVATOR SIGN ===== */
(function(){
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  function setData(n, obj){
    Object.entries(obj || {}).forEach(([k,v])=>{ if (v !== undefined && v !== null) n.dataset[k]=String(v); });
  }
  function place(n, x, y){
    if(!n) return;
    n.style.left = (x|0) + "px";
    n.style.top  = (y|0) + "px";
  }
  function toDataUrl(svg){
    return (typeof svgToDataUrl === "function")
      ? svgToDataUrl(svg)
      : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  function apply_elevator(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    const bgW = 380, bgH = 420;
    const bgX = 100, bgY = 50;

    const bgSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${bgW}" height="${bgH}" viewBox="0 0 ${bgW} ${bgH}">
        <defs>
          <linearGradient id="elevBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1565C0" stop-opacity="1"/>
            <stop offset="100%" stop-color="#0D47A1" stop-opacity="1"/>
          </linearGradient>
          <filter id="elevShadow">
            <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.4" flood-color="#000000"/>
          </filter>
        </defs>
        <rect width="${bgW}" height="${bgH}" rx="20" fill="url(#elevBg)" 
          stroke="#FFFFFF" stroke-width="8" filter="url(#elevShadow)"/>
        <rect x="10" y="10" width="${bgW-20}" height="${bgH-20}" rx="16" 
          fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      </svg>`;

    createImage(toDataUrl(bgSVG), { noCenter: true });
    setData(selected, { role:"elevator-bg", editable:"1", name:"Elevator Background" });
    place(selected, bgX, bgY);

    const doorsSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200">
        <defs>
          <linearGradient id="doorGrad" x1="0" y1="0" x2="0.3" y2="0">
            <stop offset="0%" stop-color="#E0E0E0" stop-opacity="1"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1"/>
            <stop offset="100%" stop-color="#D0D0D0" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect x="10" y="20" width="70" height="160" rx="6" fill="url(#doorGrad)" 
          stroke="#B0B0B0" stroke-width="3"/>
        <rect x="15" y="25" width="60" height="150" rx="4" fill="none" 
          stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <rect x="100" y="20" width="70" height="160" rx="6" fill="url(#doorGrad)" 
          stroke="#B0B0B0" stroke-width="3"/>
        <rect x="105" y="25" width="60" height="150" rx="4" fill="none" 
          stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <rect x="72" y="95" width="8" height="30" rx="4" fill="#909090"/>
        <rect x="100" y="95" width="8" height="30" rx="4" fill="#909090"/>
      </svg>`;

    createImage(toDataUrl(doorsSVG), { noCenter: true });
    setData(selected, { role:"elevator-icon", editable:"1", name:"Elevator Icon" });
    place(selected, bgX + 100, bgY + 40);

    const arrowsSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
        <g opacity="1">
          <path d="M 30 50 L 60 20 L 90 50" stroke="#FFFFFF" stroke-width="10" 
            fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="60" y1="25" x2="60" y2="60" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
        </g>
      </svg>`;

    createImage(toDataUrl(arrowsSVG), { noCenter: true });
    setData(selected, { role:"elevator-arrow", editable:"1", name:"Direction Arrow" });
    place(selected, bgX + 130, bgY + 270);

    createText("ELEVATOR", {
      noCenter: true,
      role: "elevator-text",
      editable: "1",
      name: "Elevator Text",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 700,
      fontSize: 52,
      fill: "#FFFFFF",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 4,
      boxW: 340
    });
    place(selected, bgX + bgW/2, bgY + 370);
    finalizeText(selected);

    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { "elevator": apply_elevator };
  const id = qsParam("template");
  if (id && REG[id]){
    requestAnimationFrame(()=> requestAnimationFrame(()=> REG[id]()));
  }
})();

/* ===== TEMPLATE 2: MEETING ROOM SIGN ===== */
(function(){
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  function setData(n, obj){
    Object.entries(obj || {}).forEach(([k,v])=>{
      if (v !== undefined && v !== null) n.dataset[k]=String(v);
    });
  }
  function place(n, x, y){
    if(!n) return;
    n.style.left = (x|0) + "px";
    n.style.top  = (y|0) + "px";
  }
  function toDataUrl(svg){
    return (typeof svgToDataUrl === "function")
      ? svgToDataUrl(svg)
      : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  function apply_meetingroom(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    const roomName = qsParam("name") || "Conference Room A";
    const capacity = qsParam("capacity") || "Seats 12";
    const bgW = 540, bgH = 280;
    const bgX = 50, bgY = 60;

    const bgSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${bgW}" height="${bgH}" viewBox="0 0 ${bgW} ${bgH}">
        <defs>
          <linearGradient id="meetingBg" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stop-color="#37474F" stop-opacity="1"/>
            <stop offset="100%" stop-color="#263238" stop-opacity="1"/>
          </linearGradient>
          <filter id="meetingShadow">
            <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.4" flood-color="#000000"/>
          </filter>
        </defs>
        <rect width="${bgW}" height="${bgH}" rx="18" fill="url(#meetingBg)" 
          stroke="#FFFFFF" stroke-width="6" filter="url(#meetingShadow)"/>
        <rect x="8" y="8" width="${bgW-16}" height="${bgH-16}" rx="14" 
          fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      </svg>`;

    createImage(toDataUrl(bgSVG), { noCenter: true });
    setData(selected, { role:"meeting-bg", editable:"1", name:"Meeting Room Background" });
    place(selected, bgX, bgY);

    const tableSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="140" height="100" viewBox="0 0 140 100">
        <ellipse cx="70" cy="35" rx="60" ry="18" fill="#8D6E63" fill-opacity="1" stroke="#6D4C41" stroke-width="2"/>
        <rect x="10" y="35" width="120" height="8" fill="#795548" fill-opacity="1"/>
        <rect x="20" y="43" width="8" height="40" rx="2" fill="#6D4C41" fill-opacity="1"/>
        <rect x="112" y="43" width="8" height="40" rx="2" fill="#6D4C41" fill-opacity="1"/>
        <g opacity="0.9">
          <circle cx="30" cy="20" r="6" fill="#FFFFFF"/>
          <rect x="27" y="26" width="6" height="12" rx="2" fill="#FFFFFF"/>
          <circle cx="110" cy="20" r="6" fill="#FFFFFF"/>
          <rect x="107" y="26" width="6" height="12" rx="2" fill="#FFFFFF"/>
        </g>
      </svg>`;

    createImage(toDataUrl(tableSVG), { noCenter: true });
    setData(selected, { role:"meeting-icon", editable:"1", name:"Table Icon" });
    place(selected, bgX + 40, bgY + 50);

    createText(roomName.toUpperCase(), {
      noCenter: true,
      role: "meeting-name",
      editable: "1",
      name: "Room Name",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 700,
      fontSize: 56,
      fill: "#FFFFFF",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 2,
      boxW: 480
    });
    place(selected, bgX + bgW/2, bgY + 60);
    finalizeText(selected);

    createText(capacity, {
      noCenter: true,
      role: "meeting-capacity",
      editable: "1",
      name: "Capacity",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 500,
      fontSize: 36,
      fill: "#B0BEC5",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 1,
      boxW: 480
    });
    place(selected, bgX + bgW/2, bgY + 220);
    finalizeText(selected);

    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { "meetingroom": apply_meetingroom };
  const id = qsParam("template");
  if (id && REG[id]){
    requestAnimationFrame(()=> requestAnimationFrame(()=> REG[id]()));
  }
})();

/* ===== TEMPLATE 3: RECEPTION/WELCOME SIGN ===== */
(function(){
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  function setData(n, obj){
    Object.entries(obj || {}).forEach(([k,v])=>{
      if (v !== undefined && v !== null) n.dataset[k]=String(v);
    });
  }
  function place(n, x, y){
    if(!n) return;
    n.style.left = (x|0) + "px";
    n.style.top  = (y|0) + "px";
  }
  function toDataUrl(svg){
    return (typeof svgToDataUrl === "function")
      ? svgToDataUrl(svg)
      : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  function apply_reception(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    const mainText = qsParam("main") || "RECEPTION";
    const subtitle = qsParam("sub") || "Please Check In";
    const bgW = 560, bgH = 300;
    const bgX = 50, bgY = 50;

    const bgSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${bgW}" height="${bgH}" viewBox="0 0 ${bgW} ${bgH}">
        <defs>
          <linearGradient id="recepBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#00796B" stop-opacity="1"/>
            <stop offset="100%" stop-color="#004D40" stop-opacity="1"/>
          </linearGradient>
          <filter id="recepShadow">
            <feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity="0.4" flood-color="#000000"/>
          </filter>
        </defs>
        <rect width="${bgW}" height="${bgH}" rx="20" fill="url(#recepBg)" 
          stroke="#FFFFFF" stroke-width="8" filter="url(#recepShadow)"/>
        <rect x="10" y="10" width="${bgW-20}" height="${bgH-20}" rx="16" 
          fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
      </svg>`;

    createImage(toDataUrl(bgSVG), { noCenter: true });
    setData(selected, { role:"reception-bg", editable:"1", name:"Reception Background" });
    place(selected, bgX, bgY);

    const deskSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="30" r="16" fill="#FFFFFF" fill-opacity="1"/>
        <path d="M 50 50 C 30 50 20 60 20 75 L 80 75 C 80 60 70 50 50 50 Z" 
          fill="#FFFFFF" fill-opacity="1"/>
        <circle cx="50" cy="85" r="10" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <text x="50" y="92" font-family="Arial" font-size="16" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">i</text>
      </svg>`;

    createImage(toDataUrl(deskSVG), { noCenter: true });
    setData(selected, { role:"reception-icon", editable:"1", name:"Reception Icon" });
    place(selected, bgX + 60, bgY + 30);

    const arrowSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <path d="M 30 10 L 30 40 M 15 30 L 30 45 L 45 30" 
          stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" 
          stroke-linejoin="round" fill="none" opacity="0.8"/>
      </svg>`;

    createImage(toDataUrl(arrowSVG), { noCenter: true });
    setData(selected, { role:"reception-arrow", editable:"1", name:"Arrow" });
    place(selected, bgX + 450, bgY + 40);

    createText(mainText.toUpperCase(), {
      noCenter: true,
      role: "reception-main",
      editable: "1",
      name: "Main Text",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 800,
      fontSize: 72,
      fill: "#FFFFFF",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 6,
      boxW: 500
    });
    place(selected, bgX + bgW/2, bgY + 120);
    finalizeText(selected);

    createText(subtitle, {
      noCenter: true,
      role: "reception-subtitle",
      editable: "1",
      name: "Subtitle",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 400,
      fontSize: 40,
      fill: "#B2DFDB",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 2,
      boxW: 500
    });
    place(selected, bgX + bgW/2, bgY + 220);
    finalizeText(selected);

    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { "reception": apply_reception };
  const id = qsParam("template");
  if (id && REG[id]){
    requestAnimationFrame(()=> requestAnimationFrame(()=> REG[id]()));
  }
})();

/* ===== Templates Loader (DIRECTIONAL WOOD SIGN - All Items Editable) ===== */
(function () {
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  const place = (n,x,y)=>{ if(!n) return; n.style.left=(x|0)+'px'; n.style.top=(y|0)+'px'; };
  const setData = (n,obj)=>Object.entries(obj||{}).forEach(([k,v])=>{ if(v!=null) n.dataset[k]=String(v); });
  const toDataUrl = (svg) => (typeof svgToDataUrl==="function") ? svgToDataUrl(svg) : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  function ensureFontLink(family){
    if (!family) return;
    const famKey = family.trim().replace(/\s+/g,'+');
    const id = `gf-${famKey.toLowerCase()}`;
    if (document.getElementById(id)) return;
    const href = `https://fonts.googleapis.com/css2?family=${famKey}:wght@100..900&display=swap`;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet"; link.href = href;
    document.head.appendChild(link);
  }
  ensureFontLink("Montserrat");

  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  const arrowSVG = (r=52, ink="#1A1A1A") => {
    const s = r*2+10, c=s/2;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
        <defs>
          <filter id="arrowShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <circle cx="${c}" cy="${c}" r="${r}" fill="${ink}" fill-opacity="1" 
          stroke="rgba(255,255,255,0.5)" stroke-width="3" filter="url(#arrowShadow)"/>
        <path d="M ${c-20} ${c-26} L ${c+22} ${c} L ${c-20} ${c+26} Z" 
          fill="#FFFFFF" fill-opacity="1"/>
      </svg>`;
  };

  const panelSVG = (W=920,H=500,R=28) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="woodGrain" x1="0" y1="0" x2="1.2" y2="0.15">
          <stop offset="0" stop-color="#A67C52" stop-opacity="1"/>
          <stop offset=".25" stop-color="#C69563" stop-opacity="1"/>
          <stop offset=".5" stop-color="#D4A574" stop-opacity="1"/>
          <stop offset=".75" stop-color="#C89560" stop-opacity="1"/>
          <stop offset="1" stop-color="#9D7042" stop-opacity="1"/>
        </linearGradient>
        <pattern id="woodTexture" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="url(#woodGrain)"/>
          <path d="M12 0v24" stroke="rgba(0,0,0,.1)" stroke-width="2"/>
          <path d="M6 0v24M18 0v24" stroke="rgba(0,0,0,.05)" stroke-width="1.5"/>
        </pattern>
        <filter id="woodShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.4" flood-color="#000000"/>
        </filter>
      </defs>
      <rect x="18" y="18" width="${W-36}" height="${H-36}" rx="${R}" 
        fill="url(#woodTexture)" fill-opacity="1"
        stroke="#6B4E3D" stroke-width="5" filter="url(#woodShadow)"/>
      <rect x="26" y="26" width="${W-52}" height="${H-52}" rx="${R-8}" fill="none" 
        stroke="rgba(255,255,255,.3)" stroke-width="3"/>
    </svg>`;

  function apply_woodsign(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    let line1 = (qsParam("l1") || "CONFERENCE ROOM").toUpperCase();
    let line2 = (qsParam("l2") || "RESTROOMS").toUpperCase();
    const ink = (qsParam("ink") || "#1A1A1A").trim();

    const PANEL_W = 920, PANEL_H = 500;
    const signX = 60, signY = 50;
    const PAD = 65;

    const ARROW_R = 52;
    const ARROW_SPACE = 140;
    
    const contentX = signX + PAD + ARROW_SPACE;
    const contentW = PANEL_W - PAD*2 - ARROW_SPACE;
    
    const ROW_H = (PANEL_H - PAD*2) / 2;
    const row1Y = signY + PAD + ROW_H * 0.42;
    const row2Y = signY + PAD + ROW_H + ROW_H * 0.42;
    
    const arrowX = signX + PAD + 18;

    // 1. Panel (editable background)
    createImage(toDataUrl(panelSVG(PANEL_W, PANEL_H, 28)), { noCenter: true });
    setData(selected, { role:"panel", editable:"1", name:"Wood Panel" });
    place(selected, signX, signY);

    // 2. Top Arrow (editable icon)
    createImage(toDataUrl(arrowSVG(ARROW_R, ink)), { noCenter: true });
    setData(selected, { role:"arrow-top", editable:"1", name:"Top Arrow" });
    place(selected, arrowX, signY + PAD + ROW_H/2 - ARROW_R - 5);

    // 3. Bottom Arrow (editable icon)
    createImage(toDataUrl(arrowSVG(ARROW_R, ink)), { noCenter: true });
    setData(selected, { role:"arrow-bottom", editable:"1", name:"Bottom Arrow" });
    place(selected, arrowX, signY + PAD + ROW_H + ROW_H/2 - ARROW_R - 5);

    // 4. Divider (editable separator)
    const divY = signY + PAD + ROW_H;
    const divSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${contentW}" height="6">
      <rect width="${contentW}" height="6" rx="3" fill="${ink}" opacity="0.4"/></svg>`;
    createImage(toDataUrl(divSVG), { noCenter: true });
    setData(selected, { role:"divider", editable:"1", name:"Divider Line" });
    place(selected, contentX, divY - 3);

    const textBase = {
      noCenter: true,
      fontFamily: "Montserrat, Arial, sans-serif",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 3,
      fill: ink,
      stroke: "none",
      strokeWidth: 0,
      shape: "straight",
      anchor: "left",
      boxW: contentW,
      editable: "1"
    };

    // 5. Top text (editable)
    createText(line1, Object.assign({}, textBase, { fontSize: 72, role:"text-top", name:"Top Text" }));
    place(selected, contentX, row1Y);
    finalizeText(selected);

    // 6. Bottom text (editable)
    createText(line2, Object.assign({}, textBase, { fontSize: 72, role:"text-bottom", name:"Bottom Text" }));
    place(selected, contentX, row2Y);
    finalizeText(selected);

    // ✅ Make all items interactive and properly layered
    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { woodsign: apply_woodsign };
  const id = qsParam("template");
  if (id && REG[id]) requestAnimationFrame(()=>requestAnimationFrame(()=>REG[id]()));

  /* ===== NEW TEMPLATE 1: OFFICE DIRECTORY SIGN ===== */
(function(){
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  const place = (n,x,y)=>{ if(!n) return; n.style.left=(x|0)+'px'; n.style.top=(y|0)+'px'; };
  const setData = (n,obj)=>Object.entries(obj||{}).forEach(([k,v])=>{ if(v!=null) n.dataset[k]=String(v); });
  const toDataUrl = (svg) => (typeof svgToDataUrl==="function") ? svgToDataUrl(svg) : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  function ensureFontLink(family){
    if (!family) return;
    const famKey = family.trim().replace(/\s+/g,'+');
    const id = `gf-${famKey.toLowerCase()}`;
    if (document.getElementById(id)) return;
    const href = `https://fonts.googleapis.com/css2?family=${famKey}:wght@100..900&display=swap`;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet"; link.href = href;
    document.head.appendChild(link);
  }
  ensureFontLink("Inter");

  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  const frameSVG = (W=700,H=600,R=16) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="metalFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E8E8E8" stop-opacity="1"/>
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#D0D0D0" stop-opacity="1"/>
        </linearGradient>
        <filter id="frameShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity="0.35" flood-color="#000000"/>
        </filter>
      </defs>
      <!-- Outer metal frame -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" 
        fill="url(#metalFrame)" stroke="#A0A0A0" stroke-width="3" filter="url(#frameShadow)"/>
      <!-- Inner white background -->
      <rect x="20" y="20" width="${W-40}" height="${H-40}" rx="${R-8}" 
        fill="#FFFFFF" fill-opacity="1" stroke="#D0D0D0" stroke-width="2"/>
    </svg>`;

  const headerBarSVG = (W=660,H=80) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1565C0" stop-opacity="1"/>
          <stop offset="100%" stop-color="#0D47A1" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" rx="8" fill="url(#headerGrad)" fill-opacity="1"/>
    </svg>`;

  function apply_officedirectory(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    const title = (qsParam("title") || "OFFICE DIRECTORY").toUpperCase();
    const line1 = qsParam("line1") || "Suite 101 - Reception";
    const line2 = qsParam("line2") || "Suite 102 - Conference Room";
    const line3 = qsParam("line3") || "Suite 103 - Executive Office";
    const line4 = qsParam("line4") || "Suite 104 - IT Department";

    const frameW = 700, frameH = 600;
    const frameX = 50, frameY = 40;
    const contentPad = 40;

    const headerW = frameW - contentPad*2;
    const headerH = 80;
    const headerX = frameX + contentPad;
    const headerY = frameY + contentPad;

    const textStartY = headerY + headerH + 50;
    const lineSpacing = 90;

    // 1. Frame
    createImage(toDataUrl(frameSVG(frameW, frameH, 16)), { noCenter: true });
    setData(selected, { role:"directory-frame", editable:"1", name:"Directory Frame" });
    place(selected, frameX, frameY);

    // 2. Header Bar
    createImage(toDataUrl(headerBarSVG(headerW, headerH)), { noCenter: true });
    setData(selected, { role:"directory-header", editable:"1", name:"Header Bar" });
    place(selected, headerX, headerY);

    // 3. Title Text
    createText(title, {
      noCenter: true,
      role: "directory-title",
      editable: "1",
      name: "Title",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 800,
      fontSize: 48,
      fill: "#FFFFFF",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 4,
      boxW: headerW
    });
    place(selected, headerX + headerW/2, headerY + headerH/2 - 24);
    finalizeText(selected);

    // 4-7. Directory Lines
    const dirLines = [line1, line2, line3, line4];
    dirLines.forEach((text, i) => {
      createText(text, {
        noCenter: true,
        role: `directory-line${i+1}`,
        editable: "1",
        name: `Directory Line ${i+1}`,
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 500,
        fontSize: 36,
        fill: "#1A1A1A",
        stroke: "none",
        strokeWidth: 0,
        anchor: "left",
        shape: "straight",
        letterSpacing: 1,
        boxW: headerW
      });
      place(selected, headerX, textStartY + (i * lineSpacing));
      finalizeText(selected);
    });

    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { officedirectory: apply_officedirectory };
  const id = qsParam("template");
  if (id && REG[id]) requestAnimationFrame(()=>requestAnimationFrame(()=>REG[id]()));
})();

/* ===== NEW TEMPLATE 2: ROOM NUMBER PLATE ===== */
(function(){
  function qsParam(name){
    try { return new URL(window.location.href).searchParams.get(name); } catch(_) { return null; }
  }
  const place = (n,x,y)=>{ if(!n) return; n.style.left=(x|0)+'px'; n.style.top=(y|0)+'px'; };
  const setData = (n,obj)=>Object.entries(obj||{}).forEach(([k,v])=>{ if(v!=null) n.dataset[k]=String(v); });
  const toDataUrl = (svg) => (typeof svgToDataUrl==="function") ? svgToDataUrl(svg) : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  function ensureFontLink(family){
    if (!family) return;
    const famKey = family.trim().replace(/\s+/g,'+');
    const id = `gf-${famKey.toLowerCase()}`;
    if (document.getElementById(id)) return;
    const href = `https://fonts.googleapis.com/css2?family=${famKey}:wght@100..900&display=swap`;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet"; link.href = href;
    document.head.appendChild(link);
  }
  ensureFontLink("Roboto");

  function finalizeText(node){
    if (typeof window.rerenderNode==="function") window.rerenderNode(node);
    else if (typeof window.rerender==="function"){ 
      const p=window.selected; 
      window.selected=node; 
      window.rerender(); 
      window.selected=p; 
    }
  }

  // Brushed metal plate background
  const plateSVG = (W=480,H=320) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="brushedMetal" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stop-color="#C0C0C0" stop-opacity="1"/>
          <stop offset="25%" stop-color="#E0E0E0" stop-opacity="1"/>
          <stop offset="50%" stop-color="#F0F0F0" stop-opacity="1"/>
          <stop offset="75%" stop-color="#E0E0E0" stop-opacity="1"/>
          <stop offset="100%" stop-color="#B8B8B8" stop-opacity="1"/>
        </linearGradient>
        <pattern id="brushPattern" width="4" height="200" patternUnits="userSpaceOnUse">
          <rect width="4" height="200" fill="url(#brushedMetal)"/>
          <line x1="2" y1="0" x2="2" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        </pattern>
        <filter id="plateShadow">
          <feDropShadow dx="0" dy="5" stdDeviation="8" flood-opacity="0.4" flood-color="#000000"/>
        </filter>
        <filter id="plateInset">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Main plate -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="12" 
        fill="url(#brushPattern)" fill-opacity="1" 
        stroke="#909090" stroke-width="3" filter="url(#plateShadow)"/>
      <!-- Inner bevel -->
      <rect x="8" y="8" width="${W-16}" height="${H-16}" rx="8" 
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <rect x="10" y="10" width="${W-20}" height="${H-20}" rx="7" 
        fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
      <!-- Mounting screw holes (decorative) -->
      <circle cx="30" cy="30" r="6" fill="rgba(0,0,0,0.2)"/>
      <circle cx="${W-30}" cy="30" r="6" fill="rgba(0,0,0,0.2)"/>
      <circle cx="30" cy="${H-30}" r="6" fill="rgba(0,0,0,0.2)"/>
      <circle cx="${W-30}" cy="${H-30}" r="6" fill="rgba(0,0,0,0.2)"/>
    </svg>`;

  // Accent bar (optional colored stripe)
  const accentBarSVG = (W=420,H=8,color="#1976D2") => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" rx="4" fill="${color}" fill-opacity="1"/>
    </svg>`;

  function apply_roomnumber(){
    if (!window.createText || !window.createImage) return;
    snapshot && snapshot();

    const roomNum = qsParam("number") || "203";
    const roomName = qsParam("name") || "Conference Room";
    const department = qsParam("dept") || "Marketing Department";
    const accentColor = qsParam("accent") || "#1976D2";

    const plateW = 480, plateH = 320;
    const plateX = 80, plateY = 60;

    const accentW = 420, accentH = 8;
    const accentX = plateX + 30;
    const accentY = plateY + 220;

    // 1. Plate Background
    createImage(toDataUrl(plateSVG(plateW, plateH)), { noCenter: true });
    setData(selected, { role:"room-plate", editable:"1", name:"Room Plate" });
    place(selected, plateX, plateY);

    // 2. Room Number (large)
    createText(roomNum, {
      noCenter: true,
      role: "room-number",
      editable: "1",
      name: "Room Number",
      fontFamily: "Roboto, Arial, sans-serif",
      fontWeight: 700,
      fontSize: 110,
      fill: "#2C2C2C",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 4,
      boxW: 420
    });
    place(selected, plateX + plateW/2, plateY + 90);
    finalizeText(selected);

    // 3. Accent Bar
    createImage(toDataUrl(accentBarSVG(accentW, accentH, accentColor)), { noCenter: true });
    setData(selected, { role:"accent-bar", editable:"1", name:"Accent Bar" });
    place(selected, accentX, accentY);

    // 4. Room Name
    createText(roomName.toUpperCase(), {
      noCenter: true,
      role: "room-name",
      editable: "1",
      name: "Room Name",
      fontFamily: "Roboto, Arial, sans-serif",
      fontWeight: 600,
      fontSize: 42,
      fill: "#1A1A1A",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 2,
      boxW: 420
    });
    place(selected, plateX + plateW/2, plateY + 178);
    finalizeText(selected);

    // 5. Department/Subtitle
    createText(department, {
      noCenter: true,
      role: "room-dept",
      editable: "1",
      name: "Department",
      fontFamily: "Roboto, Arial, sans-serif",
      fontWeight: 400,
      fontSize: 28,
      fill: "#5A5A5A",
      stroke: "none",
      strokeWidth: 0,
      anchor: "middle",
      shape: "straight",
      letterSpacing: 1,
      boxW: 420
    });
    place(selected, plateX + plateW/2, plateY + 260);
    finalizeText(selected);

    window.rebind && window.rebind();
    window.normalizeZ && window.normalizeZ();
    updateCanvasSize && updateCanvasSize();
    window.showPanel && window.showPanel("editText");
  }

  const REG = { roomnumber: apply_roomnumber };
  const id = qsParam("template");
  if (id && REG[id]) requestAnimationFrame(()=>requestAnimationFrame(()=>REG[id]()));
})();
})();