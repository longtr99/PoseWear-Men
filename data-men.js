'use strict';
// PoseWear Men v1.0 · Parametric 3D Male Mannequin SVG Engine + Men's Outfits + Men's Portraits (VI/EN)
(function(){
  const ANG_META = [
    { key: 'front', vi: 'Chính diện', en: 'Front view', promptEn: 'front view, eye-level camera', yaw: 0, pitch: 5 },
    { key: 'diag',  vi: 'Góc 3/4',    en: '3/4 view',   promptEn: 'three-quarter view, slight angle', yaw: 34, pitch: 8 },
    { key: 'side',  vi: 'Góc nghiêng',en: 'Side view',  promptEn: 'side profile view', yaw: 82, pitch: 4 },
    { key: 'high',  vi: 'Từ trên',    en: 'High angle', promptEn: 'high-angle shot looking down', yaw: 18, pitch: 34 },
    { key: 'low',   vi: 'Từ dưới',    en: 'Low angle',  promptEn: 'low-angle heroic shot looking up', yaw: -16, pitch: -24 }
  ];

  // ---- 3D -> 2D Male Mannequin Renderer ----
  // Coordinates: x (left/right, +right), y (up/down, 0=ground, 175=head top), z (depth, +toward camera)
  function project(pt, yawDeg, pitchDeg, upperOnly){
    const yr = yawDeg * Math.PI / 180;
    const pr = pitchDeg * Math.PI / 180;
    const cy = upperOnly ? 132 : 90;
    const x0 = pt[0], y0 = pt[1] - cy, z0 = pt[2];
    // Rotate around Y (yaw)
    const x1 = x0 * Math.cos(yr) + z0 * Math.sin(yr);
    const z1 = -x0 * Math.sin(yr) + z0 * Math.cos(yr);
    // Rotate around X (pitch)
    const y2 = y0 * Math.cos(pr) - z1 * Math.sin(pr);
    const z2 = y0 * Math.sin(pr) + z1 * Math.cos(pr);
    const fov = upperOnly ? 320 : 380;
    const dist = upperOnly ? 260 : 370;
    const scale = fov / (dist - z2);
    const sx = 150 + x1 * scale;
    const sy = (upperOnly ? 205 : 210) - y2 * scale;
    return { x: sx, y: sy, z: z2, s: scale };
  }

  function svgUri(svg){
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function r1(n){ return Math.round(n * 10) / 10; }

  function renderPoseSVG(pose, angIdx){
    const ang = ANG_META[angIdx] || ANG_META[0];
    const upper = pose.lineKey === 'upper';
    const J = pose.joints;
    const P = {};
    for(const k in J) P[k] = project(J[k], ang.yaw, ang.pitch, upper);

    // Painter's depth primitives
    const elems = [];

    // Ground grid & shadow (skip if upper-only)
    let bgExtra = '';
    if(!upper){
      const gPts = [[-55,0,-40],[55,0,-40],[55,0,40],[-55,0,40]].map(pt => project(pt, ang.yaw, ang.pitch, false));
      const gPath = gPts.map((p,i)=>(i?'L':'M')+r1(p.x)+','+r1(p.y)).join(' ')+' Z';
      const sh = project([pose.shadowX||0, 0, pose.shadowZ||0], ang.yaw, ang.pitch, false);
      const rx = r1(36 * sh.s), ry = r1(Math.max(7, 13 * Math.abs(Math.sin(ang.pitch*Math.PI/180) + 0.32) * sh.s));
      bgExtra = `<path d="${gPath}" fill="#f4f5f7" stroke="#e4e6eb" stroke-width="1"/>
        <ellipse cx="${r1(sh.x)}" cy="${r1(sh.y)}" rx="${rx}" ry="${ry}" fill="rgba(17,24,39,0.09)"/>`;
    }

    // Optional prop (chair / wall / steps / dumbbell)
    if(pose.prop === 'chair'){
      const seat = [[-22,46,-18],[22,46,-18],[22,46,16],[-22,46,16]].map(pt=>project(pt,ang.yaw,ang.pitch,upper));
      const legs = [[[-20,46,-16],[-20,0,-16]],[[20,46,-16],[20,0,-16]],[[-20,46,14],[-20,0,14]],[[20,46,14],[20,0,14]]];
      const legSvg = legs.map(([a,b])=>{
        const pa=project(a,ang.yaw,ang.pitch,upper), pb=project(b,ang.yaw,ang.pitch,upper);
        return `<line x1="${r1(pa.x)}" y1="${r1(pa.y)}" x2="${r1(pb.x)}" y2="${r1(pb.y)}" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>`;
      }).join('');
      const sPath = seat.map((p,i)=>(i?'L':'M')+r1(p.x)+','+r1(p.y)).join(' ')+' Z';
      elems.push({ z: -30, svg: legSvg + `<path d="${sPath}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.4"/>` });
    } else if(pose.prop === 'wall'){
      const wPts = [[-50,0,-24],[50,0,-24],[50,185,-24],[-50,185,-24]].map(pt=>project(pt,ang.yaw,ang.pitch,upper));
      const wPath = wPts.map((p,i)=>(i?'L':'M')+r1(p.x)+','+r1(p.y)).join(' ')+' Z';
      elems.push({ z: -45, svg: `<path d="${wPath}" fill="rgba(226,232,240,0.45)" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4 4"/>` });
    } else if(pose.prop === 'steps'){
      const st1 = [[-36,36,-16],[36,36,-16],[36,36,12],[-36,36,12]].map(pt=>project(pt,ang.yaw,ang.pitch,upper));
      const st2 = [[-36,18,12],[36,18,12],[36,18,32],[-36,18,32]].map(pt=>project(pt,ang.yaw,ang.pitch,upper));
      elems.push({ z: -32, svg: `<path d="${st1.map((p,i)=>(i?'L':'M')+r1(p.x)+','+r1(p.y)).join(' ')} Z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1.2"/><path d="${st2.map((p,i)=>(i?'L':'M')+r1(p.x)+','+r1(p.y)).join(' ')} Z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.2"/>` });
    }

    // Helper to add limb capsule
    function addLimb(k1, k2, rStart, rEnd, tone){
      const a = P[k1], b = P[k2];
      if(!a || !b) return;
      const z = (a.z + b.z) / 2;
      const w1 = rStart * a.s, w2 = rEnd * b.s;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const p1x = a.x + nx * w1, p1y = a.y + ny * w1;
      const p2x = b.x + nx * w2, p2y = b.y + ny * w2;
      const p3x = b.x - nx * w2, p3y = b.y - ny * w2;
      const p4x = a.x - nx * w1, p4y = a.y - ny * w1;
      const fill = tone === 'back' ? '#d1d5db' : tone === 'mid' ? '#e5e7eb' : '#f8fafc';
      const stroke = tone === 'back' ? '#475569' : '#1e293b';
      const d = `M${r1(p1x)},${r1(p1y)} L${r1(p2x)},${r1(p2y)} L${r1(p3x)},${r1(p3y)} L${r1(p4x)},${r1(p4y)} Z`;
      elems.push({
        z,
        svg: `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.7" stroke-linejoin="round"/>
              <circle cx="${r1(a.x)}" cy="${r1(a.y)}" r="${r1(w1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>
              <circle cx="${r1(b.x)}" cy="${r1(b.y)}" r="${r1(w2)}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`
      });
    }

    // Male V-Tapered Ribcage & Pelvis Blocks
    function addTorso(){
      const ls = P.ls, rs = P.rs, w = P.w, lh = P.lh, rh = P.rh, c = P.c, n = P.n;
      const zTorso = (ls.z + rs.z + w.z) / 3;
      const chestPoly = [
        [ls.x, ls.y], [rs.x, rs.y],
        [w.x + (rs.x - ls.x)*0.33, w.y],
        [w.x - (rs.x - ls.x)*0.33, w.y]
      ];
      const cPath = chestPoly.map((p,i)=>(i?'L':'M')+r1(p[0])+','+r1(p[1])).join(' ')+' Z';
      // Centerline + pec guide for male anatomical clarity
      const midTopX = (ls.x + rs.x)/2, midTopY = (ls.y + rs.y)/2;
      const guide = `<line x1="${r1(midTopX)}" y1="${r1(midTopY)}" x2="${r1(w.x)}" y2="${r1(w.y)}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="${r1(ls.x*0.82+rs.x*0.18)}" y1="${r1(c.y)}" x2="${r1(rs.x*0.82+ls.x*0.18)}" y2="${r1(c.y)}" stroke="#94a3b8" stroke-width="1"/>`;
      elems.push({ z: zTorso + 0.5, svg: `<path d="${cPath}" fill="#f1f5f9" stroke="#0f172a" stroke-width="1.9" stroke-linejoin="round"/>${guide}` });

      // Pelvis block (narrower than shoulders for male proportions)
      const zPelv = (lh.z + rh.z + w.z) / 3;
      const pelvPoly = [
        [w.x - (rs.x - ls.x)*0.33, w.y],
        [w.x + (rs.x - ls.x)*0.33, w.y],
        [rh.x + (rh.x - lh.x)*0.12, rh.y + 4*rh.s],
        [(lh.x+rh.x)/2, (lh.y+rh.y)/2 + 9*rh.s],
        [lh.x - (rh.x - lh.x)*0.12, lh.y + 4*lh.s]
      ];
      const pPath = pelvPoly.map((p,i)=>(i?'L':'M')+r1(p[0])+','+r1(p[1])).join(' ')+' Z';
      elems.push({ z: zPelv, svg: `<path d="${pPath}" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>` });

      // Neck
      addLimb('n', 'h', 5.2, 4.8, 'mid');
    }

    // Angular Male Head with gaze direction cross
    function addHead(){
      const h = P.h;
      const rx = 9.5 * h.s, ry = 12.2 * h.s;
      const yawRad = (ang.yaw + (pose.headYaw || 0)) * Math.PI / 180;
      const faceX = Math.sin(yawRad) * rx * 0.65;
      const faceVis = Math.cos(yawRad) > -0.25;
      const cross = faceVis
        ? `<line x1="${r1(h.x+faceX)}" y1="${r1(h.y-ry*0.7)}" x2="${r1(h.x+faceX)}" y2="${r1(h.y+ry*0.85)}" stroke="#ff2442" stroke-width="1.2" opacity="0.75"/>
           <line x1="${r1(h.x-rx*0.7)}" y1="${r1(h.y+ry*0.05)}" x2="${r1(h.x+rx*0.7)}" y2="${r1(h.y+ry*0.05)}" stroke="#ff2442" stroke-width="1.2" opacity="0.75"/>`
        : '';
      elems.push({
        z: h.z + 2,
        svg: `<ellipse cx="${r1(h.x)}" cy="${r1(h.y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>${cross}`
      });
    }

    // Add all limbs (front/back shading based on z)
    const lArmTone = (P.le.z < P.re.z) ? 'back' : 'front';
    const rArmTone = (P.re.z < P.le.z) ? 'back' : 'front';
    const lLegTone = (P.lk.z < P.rk.z) ? 'back' : 'front';
    const rLegTone = (P.rk.z < P.lk.z) ? 'back' : 'front';

    addTorso();
    addHead();
    // Arms (broad male upper arm, defined forearm)
    addLimb('ls', 'le', 6.4, 5.1, lArmTone);
    addLimb('le', 'lha', 4.9, 3.6, lArmTone);
    addLimb('rs', 're', 6.4, 5.1, rArmTone);
    addLimb('re', 'rha', 4.9, 3.6, rArmTone);
    // Legs (if not upper-only, or still draw upper thigh)
    addLimb('lh', 'lk', 8.6, 6.2, lLegTone);
    addLimb('rh', 'rk', 8.6, 6.2, rLegTone);
    if(!upper){
      addLimb('lk', 'la', 6.0, 4.2, lLegTone);
      addLimb('la', 'lf', 4.0, 3.4, lLegTone);
      addLimb('rk', 'ra', 6.0, 4.2, rLegTone);
      addLimb('ra', 'rf', 4.0, 3.4, rLegTone);
    }

    // Joint accent dots (subtle red/slate anatomical markers)
    ['ls','rs','le','re','lh','rh','lk','rk'].forEach(k=>{
      if(upper && (k==='lk'||k==='rk')) return;
      const p = P[k];
      if(!p) return;
      elems.push({ z: p.z + 1.5, svg: `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="2.2" fill="#ff2442" opacity="0.85"/>` });
    });

    elems.sort((a,b) => a.z - b.z);
    const bodySvg = elems.map(e => e.svg).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
      <rect width="300" height="400" fill="#fafafa"/>
      <g stroke="#f0f1f4" stroke-width="1">
        <line x1="150" y1="24" x2="150" y2="376"/>
        <line x1="24" y1="200" x2="276" y2="200"/>
      </g>
      ${bgExtra}
      ${bodySvg}
      <g font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10" fill="#94a3b8">
        <text x="16" y="384">${pose.no} · ${ang.en.toUpperCase()}</text>
      </g>
    </svg>`;
    return svgUri(svg);
  }

  // ---- Men's Outfit Vector Illustration Renderer ----
  const COL_HEX = {
    black: '#1f2328', white: '#f8fafc', navy: '#1e3a5f', charcoal: '#374151',
    grey: '#9ca3af', beige: '#d6c5ae', khaki: '#b8a07e', olive: '#556b2f',
    brown: '#6b4423', denim: '#3b648f', burgundy: '#6e1d2f', cream: '#f3ede2',
    green: '#2d5a43', blue: '#2b6cb0', sand: '#c8b69e', tan: '#b58457', red: '#c53030'
  };

  function renderOutfitSVG(o){
    const cTop = COL_HEX[o.pal[0]] || '#1f2328';
    const cIn  = COL_HEX[o.pal[1]] || '#f8fafc';
    const cBot = COL_HEX[o.pal[2]] || '#374151';
    const cSh  = COL_HEX[o.pal[3]] || '#111827';
    const strokeTop = o.pal[0]==='white'||o.pal[0]==='cream' ? '#94a3b8' : '#0f172a';
    const strokeBot = o.pal[2]==='white'||o.pal[2]==='cream' ? '#94a3b8' : '#0f172a';

    // Top silhouette variations
    let topSvg = '';
    if(o.sil === 'suit' || o.sil === 'blazer'){
      topSvg = `
        <path d="M108,76 L192,76 L222,94 L232,196 L204,200 L196,126 L194,228 L106,228 L104,126 L96,200 L68,196 L78,94 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="132,76 150,152 168,76" fill="${cIn}" stroke="#94a3b8" stroke-width="1.2"/>
        <path d="M132,76 L118,128 L150,152 L182,128 L168,76" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>
        ${o.sil==='suit' ? `<polygon points="146,84 154,84 156,144 150,152 144,144" fill="${o.accent||'#ff2442'}"/>` : ''}
        <circle cx="150" cy="172" r="3" fill="rgba(255,255,255,0.5)"/>
        <circle cx="150" cy="194" r="3" fill="rgba(255,255,255,0.5)"/>
        <rect x="164" y="118" width="16" height="4" rx="1" fill="#ffffff" opacity="0.7"/>`;
    } else if(o.sil === 'coat'){
      topSvg = `
        <path d="M106,74 L194,74 L224,94 L234,206 L206,210 L198,132 L202,296 L98,296 L102,132 L94,210 L66,206 L76,94 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="132,74 150,150 168,74" fill="${cIn}" stroke="#94a3b8" stroke-width="1.2"/>
        <line x1="150" y1="150" x2="150" y2="296" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        <rect x="108" y="218" width="24" height="5" rx="2" fill="rgba(0,0,0,0.2)"/>
        <rect x="168" y="218" width="24" height="5" rx="2" fill="rgba(0,0,0,0.2)"/>`;
    } else if(o.sil === 'hoodie'){
      topSvg = `
        <path d="M122,62 Q150,48 178,62 L188,82 L112,82 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2"/>
        <path d="M104,80 L196,80 L232,102 L238,200 L206,204 L198,130 L196,222 L104,222 L102,130 L94,204 L62,200 L68,102 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M118,176 L182,176 L188,210 L112,210 Z" fill="rgba(0,0,0,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>
        <line x1="140" y1="84" x2="140" y2="122" stroke="#e2e8f0" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="160" y1="84" x2="160" y2="122" stroke="#e2e8f0" stroke-width="2.2" stroke-linecap="round"/>`;
    } else if(o.sil === 'jacket'){
      topSvg = `
        <path d="M104,78 L196,78 L228,96 L236,196 L206,200 L196,128 L194,218 L106,218 L104,128 L94,200 L64,196 L72,96 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
        <rect x="132" y="78" width="36" height="140" fill="${cIn}" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="132" y1="78" x2="132" y2="218" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
        <line x1="168" y1="78" x2="168" y2="218" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
        <rect x="110" y="114" width="16" height="18" rx="2" fill="rgba(0,0,0,0.15)"/>
        <rect x="174" y="114" width="16" height="18" rx="2" fill="rgba(0,0,0,0.15)"/>`;
    } else if(o.sil === 'shirt'){
      topSvg = `
        <path d="M110,76 L190,76 L220,94 L228,196 L202,198 L194,126 L192,224 L108,224 L106,126 L98,198 L72,196 L80,94 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="128,76 150,98 172,76" fill="${cIn}" stroke="${strokeTop}" stroke-width="1.4"/>
        <line x1="150" y1="98" x2="150" y2="224" stroke="${strokeTop}" stroke-width="1.2" opacity="0.4"/>
        <circle cx="150" cy="122" r="2.2" fill="${strokeTop}" opacity="0.6"/>
        <circle cx="150" cy="148" r="2.2" fill="${strokeTop}" opacity="0.6"/>
        <circle cx="150" cy="174" r="2.2" fill="${strokeTop}" opacity="0.6"/>`;
    } else { // tee / sport / knit
      const shortSleeve = o.sil === 'tee' || o.sil === 'sport';
      topSvg = shortSleeve
        ? `<path d="M112,78 L188,78 L224,104 L210,146 L192,134 L192,222 L108,222 L108,134 L90,146 L76,104 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
           <path d="M132,78 Q150,94 168,78" fill="none" stroke="${cIn}" stroke-width="3"/>`
        : `<path d="M112,76 L188,76 L222,96 L230,198 L204,200 L194,128 L192,224 L108,224 L106,128 L96,200 L70,198 L78,96 Z" fill="${cTop}" stroke="${strokeTop}" stroke-width="2.2" stroke-linejoin="round"/>
           <rect x="132" y="64" width="36" height="18" rx="4" fill="${cTop}" stroke="${strokeTop}" stroke-width="2"/>`;
    }

    // Bottom silhouette
    let botSvg = '';
    if(o.bot === 'shorts'){
      botSvg = `<path d="M108,226 L192,226 L202,312 L158,312 L150,268 L142,312 L98,312 Z" fill="${cBot}" stroke="${strokeBot}" stroke-width="2.2" stroke-linejoin="round"/>`;
    } else if(o.bot === 'cargo'){
      botSvg = `<path d="M108,226 L192,226 L202,372 L158,372 L150,274 L142,372 L98,372 Z" fill="${cBot}" stroke="${strokeBot}" stroke-width="2.2" stroke-linejoin="round"/>
        <rect x="98" y="276" width="16" height="32" rx="3" fill="${cBot}" stroke="${strokeBot}" stroke-width="1.6"/>
        <rect x="186" y="276" width="16" height="32" rx="3" fill="${cBot}" stroke="${strokeBot}" stroke-width="1.6"/>`;
    } else {
      botSvg = `<path d="M110,226 L190,226 L196,374 L158,374 L150,276 L142,374 L104,374 Z" fill="${cBot}" stroke="${strokeBot}" stroke-width="2.2" stroke-linejoin="round"/>
        <line x1="128" y1="234" x2="125" y2="366" stroke="rgba(255,255,255,0.16)" stroke-width="1.2"/>
        <line x1="172" y1="234" x2="175" y2="366" stroke="rgba(255,255,255,0.16)" stroke-width="1.2"/>`;
    }

    // Shoes
    const shoeSvg = `
      <rect x="104" y="378" width="38" height="16" rx="7" fill="${cSh}" stroke="#0f172a" stroke-width="1.6"/>
      <rect x="158" y="378" width="38" height="16" rx="7" fill="${cSh}" stroke="#0f172a" stroke-width="1.6"/>
      <line x1="108" y1="391" x2="138" y2="391" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
      <line x1="162" y1="391" x2="192" y2="391" stroke="#ffffff" stroke-width="2" opacity="0.6"/>`;

    // Hanger hook & color swatches
    const swatches = o.pal.map((c,i)=>`<circle cx="${24 + i*16}" cy="24" r="5.5" fill="${COL_HEX[c]||'#333'}" stroke="#cbd5e1" stroke-width="1"/>`).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
      <rect width="300" height="420" fill="#f7f7f8"/>
      <path d="M144,44 a6,6 0 1,1 8,6 L150,58 L112,76 M150,58 L188,76" fill="none" stroke="#94a3b8" stroke-width="2.4" stroke-linecap="round"/>
      ${botSvg}
      ${topSvg}
      ${shoeSvg}
      ${swatches}
      <text x="284" y="28" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10.5" font-weight="600" fill="#64748b">${o.catEn.toUpperCase()}</text>
    </svg>`;
    return svgUri(svg);
  }

  // ---- Men's Portrait / Hairstyle Vector Renderer ----
  function renderPortraitSVG(r){
    const bg = r.bg || '#eef2f6';
    const hair = r.hairCol || '#1f2328';
    const skin = r.skin || '#f1c7a6';
    let hairSvg = '';
    if(r.hStyle === 'undercut'){
      hairSvg = `<path d="M104,140 Q106,82 154,76 Q204,78 202,134 Q188,108 150,112 Q118,110 104,140 Z" fill="${hair}"/>`;
    } else if(r.hStyle === 'sidepart'){
      hairSvg = `<path d="M98,150 Q94,86 150,78 Q206,84 202,148 Q192,114 166,106 Q134,122 98,150 Z" fill="${hair}"/>
        <path d="M166,82 L162,112" stroke="${bg}" stroke-width="2.2" opacity="0.5"/>`;
    } else if(r.hStyle === 'middle'){
      hairSvg = `<path d="M94,162 Q92,84 150,80 Q208,84 206,162 Q188,128 150,114 Q112,128 94,162 Z" fill="${hair}"/>`;
    } else if(r.hStyle === 'buzz'){
      hairSvg = `<path d="M104,136 Q106,92 150,90 Q194,92 196,136 Q178,114 150,114 Q122,114 104,136 Z" fill="${hair}" opacity="0.88"/>`;
    } else if(r.hStyle === 'mullet'){
      hairSvg = `<path d="M90,148 Q92,82 150,78 Q208,82 210,148 L216,222 L192,216 L190,140 Q150,114 110,140 L108,216 L84,222 Z" fill="${hair}"/>`;
    } else if(r.hStyle === 'wavy'){
      hairSvg = `<path d="M92,154 Q88,92 126,80 Q150,68 176,80 Q212,92 208,154 Q188,120 166,126 Q150,112 134,126 Q112,120 92,154 Z" fill="${hair}"/>`;
    } else {
      hairSvg = `<path d="M100,146 Q98,84 150,76 Q202,84 200,146 Q180,108 150,108 Q120,108 100,146 Z" fill="${hair}"/>`;
    }
    const beardSvg = r.beard
      ? `<path d="M110,192 Q150,248 190,192 Q186,232 150,242 Q114,232 110,192 Z" fill="${hair}" opacity="0.35"/>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="300" height="375">
      <rect width="300" height="375" fill="${bg}"/>
      <circle cx="150" cy="175" r="115" fill="rgba(255,255,255,0.45)"/>
      <!-- Shoulders / Crewneck -->
      <path d="M46,375 Q56,282 118,266 L182,266 Q244,282 254,375 Z" fill="${r.shirtCol||'#1e293b'}"/>
      <!-- Neck -->
      <rect x="130" y="226" width="40" height="48" rx="14" fill="${skin}"/>
      <path d="M130,236 Q150,252 170,236 L170,226 L130,226 Z" fill="rgba(0,0,0,0.08)"/>
      <!-- Ears -->
      <ellipse cx="101" cy="172" rx="9" ry="16" fill="${skin}"/>
      <ellipse cx="199" cy="172" rx="9" ry="16" fill="${skin}"/>
      <!-- Jaw / Male Face -->
      <path d="M104,142 Q104,96 150,96 Q196,96 196,142 L192,194 Q188,224 150,236 Q112,224 108,194 Z" fill="${skin}" stroke="rgba(15,23,42,0.12)" stroke-width="1.5"/>
      <!-- Brows & Eyes -->
      <path d="M118,154 L141,152" stroke="${hair}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M159,152 L182,154" stroke="${hair}" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="130" cy="166" rx="5.5" ry="3.5" fill="#1e293b"/>
      <ellipse cx="170" cy="166" rx="5.5" ry="3.5" fill="#1e293b"/>
      <!-- Nose & Mouth -->
      <path d="M150,164 L146,192 L154,193" fill="none" stroke="rgba(15,23,42,0.28)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M136,209 Q150,214 164,209" fill="none" stroke="rgba(15,23,42,0.45)" stroke-width="2.2" stroke-linecap="round"/>
      ${beardSvg}
      ${hairSvg}
      <text x="16" y="358" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.8)">${r.no} · ${r.lenEn.toUpperCase()}</text>
    </svg>`;
    return svgUri(svg);
  }

  // ---- Helper: Build default standing male skeleton & apply overrides ----
  function makeJoints(ov){
    const base = {
      h:[0,166,2], n:[0,150,0], c:[0,134,2], w:[0,104,0],
      ls:[-21,144,0], rs:[21,144,0],
      le:[-26,115,-2], re:[26,115,-2],
      lha:[-24,88,4], rha:[24,88,4],
      lh:[-12,92,0], rh:[12,92,0],
      lk:[-13,48,2], rk:[13,48,2],
      la:[-14,6,-2], ra:[14,6,-2],
      lf:[-15,2,10], rf:[15,2,10]
    };
    return Object.assign({}, base, ov || {});
  }

  // ---- 24 Curated Male Poses ----
  const RAW_POSES = [
    // Standing (6)
    { id:'men_stand_01', no:'MP01', lineKey:'full', lineVi:'Toàn thân · Chuẩn', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing',
      vi:'Đứng tự tin, một tay đút túi quần', en:'confident male contrapposto standing pose, one hand in trouser pocket, relaxed shoulder',
      joints: makeJoints({ h:[2,166,2], ls:[-20,145,2], rs:[22,142,-2], le:[-27,114,-4], lha:[-16,94,8], re:[28,116,-2], rha:[27,88,3], lh:[-10,93,2], rh:[13,90,-1], lk:[-11,48,3], rk:[18,49,7], la:[-11,6,0], ra:[20,6,6], lf:[-12,2,12], rf:[23,2,16] }) },
    { id:'men_stand_02', no:'MP02', lineKey:'full', lineVi:'Toàn thân · Chuẩn', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing',
      vi:'Đứng thoải mái hai tay đút túi', en:'relaxed male standing pose, both hands casually in pockets, weight shifted slightly to one leg',
      joints: makeJoints({ ls:[-21,144,0], rs:[21,144,0], le:[-28,116,-6], re:[28,116,-6], lha:[-15,94,7], rha:[15,94,7], lk:[-15,48,3], rk:[14,48,5], la:[-17,6,-1], ra:[15,6,4], lf:[-19,2,10], rf:[18,2,14] }) },
    { id:'men_stand_03', no:'MP03', lineKey:'full', lineVi:'Toàn thân · Chuẩn', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing',
      vi:'Đứng khoanh tay phong thái doanh nhân', en:'authoritative male standing pose with arms crossed over chest, feet shoulder-width apart',
      joints: makeJoints({ le:[-27,118,8], re:[27,118,8], lha:[12,122,18], rha:[-12,118,16], lk:[-15,48,2], rk:[15,48,2], la:[-17,6,-1], ra:[17,6,-1], lf:[-19,2,11], rf:[19,2,11] }) },
    { id:'men_stand_04', no:'MP04', lineKey:'full', lineVi:'Toàn thân · Đường phố', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing', prop:'wall',
      vi:'Tựa lưng tường, một chân co gác tường', en:'cool male leaning back against wall, one knee bent with foot propped on wall, hands in pockets',
      joints: makeJoints({ h:[0,162,-12], n:[0,147,-14], c:[0,132,-12], w:[0,102,-6], ls:[-21,142,-12], rs:[21,142,-12], le:[-26,114,-14], re:[26,114,-14], lha:[-14,94,-2], rha:[14,94,-2], lh:[-12,90,-2], rh:[12,90,-2], lk:[-12,48,8], la:[-12,6,14], lf:[-12,2,26], rk:[16,56,14], ra:[14,22,-16], rf:[14,18,-20] }) },
    { id:'men_stand_05', no:'MP05', lineKey:'full', lineVi:'Toàn thân · Thời trang', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing',
      vi:'Vắt áo khoác qua vai, ánh nhìn tự tin', en:'editorial male fashion pose, one hand hooked over shoulder holding jacket, other hand relaxed',
      joints: makeJoints({ h:[3,166,3], headYaw:-15, ls:[-20,145,2], rs:[22,143,-2], le:[-32,148,8], lha:[-16,154,-6], re:[27,115,-2], rha:[25,86,4], lk:[-12,48,4], rk:[15,48,0], la:[-13,6,2], ra:[16,6,-4], lf:[-14,2,14], rf:[18,2,8] }) },
    { id:'men_stand_06', no:'MP06', lineKey:'full', lineVi:'Toàn thân · Thời trang', lineEn:'full body, solo male', catVi:'Đứng', catEn:'Standing',
      vi:'Đứng nghiêng quay đầu nhìn qua vai', en:'male standing three-quarter away, looking back over shoulder toward camera, hands relaxed',
      joints: makeJoints({ h:[-4,166,4], headYaw:42, ls:[-16,144,12], rs:[16,144,-12], le:[-20,114,12], lha:[-12,92,14], re:[20,114,-14], rha:[16,86,-10], lh:[-10,92,8], rh:[10,92,-8], lk:[-12,48,12], rk:[12,48,-10], la:[-14,6,10], ra:[14,6,-12], lf:[-10,2,20], rf:[18,2,-2] }) },

    // Sitting (5)
    { id:'men_sit_01', no:'MP07', lineKey:'full', lineVi:'Toàn thân · Chuẩn', lineEn:'full body, solo male', catVi:'Ngồi', catEn:'Sitting', prop:'chair',
      vi:'Ngồi ghế vắt chéo chân lịch lãm', en:'elegant male seated on chair with ankle crossed over knee, one arm resting relaxed, upright posture',
      joints: makeJoints({ h:[0,136,-4], n:[0,120,-6], c:[0,104,-4], w:[0,74,-6], ls:[-21,114,-6], rs:[21,114,-6], le:[-28,86,-2], lha:[-16,64,14], re:[28,84,-4], rha:[22,56,12], lh:[-12,60,-4], rh:[12,60,-4], lk:[-14,58,34], la:[-14,10,32], lf:[-14,4,44], rk:[14,62,32], ra:[-10,56,36], rf:[-18,54,42] }) },
    { id:'men_sit_02', no:'MP08', lineKey:'full', lineVi:'Toàn thân · Đường phố', lineEn:'full body, solo male', catVi:'Ngồi', catEn:'Sitting', prop:'steps',
      vi:'Ngồi bậc thang khuỷu tay đặt lên gối', en:'casual streetwear male sitting on steps, leaning forward with elbows resting on knees, hands clasped',
      joints: makeJoints({ h:[0,118,20], n:[0,104,12], c:[0,90,8], w:[0,64,-4], ls:[-21,100,10], rs:[21,100,10], le:[-20,68,26], re:[20,68,26], lha:[-4,66,38], rha:[4,66,38], lh:[-13,50,-4], rh:[13,50,-4], lk:[-20,56,28], rk:[20,56,28], la:[-18,16,32], ra:[18,6,42], lf:[-18,12,44], rf:[20,2,54] }) },
    { id:'men_sit_03', no:'MP09', lineKey:'full', lineVi:'Toàn thân · Thời trang', lineEn:'full body, solo male', catVi:'Ngồi', catEn:'Sitting', prop:'chair',
      vi:'Ngồi ghế đẩu nghiêng người về trước', en:'male fashion editorial pose seated on studio stool, torso leaning slightly forward, wide confident knee stance',
      joints: makeJoints({ h:[0,130,14], n:[0,114,8], c:[0,98,4], w:[0,70,-4], ls:[-22,110,6], rs:[22,110,6], le:[-26,80,14], re:[26,80,14], lha:[-14,58,28], rha:[14,58,28], lh:[-13,58,-4], rh:[13,58,-4], lk:[-24,56,28], rk:[24,56,28], la:[-20,8,24], ra:[22,8,34], lf:[-22,3,36], rf:[24,3,46] }) },
    { id:'men_sit_04', no:'MP10', lineKey:'full', lineVi:'Toàn thân · Đường phố', lineEn:'full body, solo male', catVi:'Ngồi', catEn:'Sitting',
      vi:'Ngồi sàn một gối dựng, tay gác lên gối', en:'relaxed male sitting on floor, one knee raised with arm draped over knee, other hand propped behind',
      joints: makeJoints({ h:[-4,96,-6], n:[-4,80,-8], c:[-2,66,-6], w:[0,36,-6], ls:[-22,74,-8], rs:[18,74,-6], le:[-32,44,-14], lha:[-34,8,-18], re:[24,62,14], rha:[8,56,34], lh:[-12,18,-4], rh:[12,18,-4], lk:[-24,14,30], la:[-16,8,62], lf:[-18,6,72], rk:[14,48,26], ra:[14,8,38], rf:[16,4,50] }) },
    { id:'men_sit_05', no:'MP11', lineKey:'full', lineVi:'Toàn thân · Chuẩn', lineEn:'full body, solo male', catVi:'Ngồi', catEn:'Sitting', prop:'chair',
      vi:'Ngồi quán cafe chống cằm suy tư', en:'thoughtful male seated casually, one elbow resting forward supporting chin, calm gaze',
      joints: makeJoints({ h:[4,132,12], headYaw:-10, n:[2,116,6], c:[0,100,2], w:[0,72,-6], ls:[-21,110,4], rs:[21,110,6], le:[-24,80,8], lha:[-12,62,22], re:[18,86,26], rha:[8,122,22], lh:[-12,58,-4], rh:[12,58,-4], lk:[-16,56,30], rk:[16,56,30], la:[-16,8,28], ra:[16,8,32], lf:[-16,3,40], rf:[18,3,44] }) },

    // Action & Street (5)
    { id:'men_act_01', no:'MP12', lineKey:'full', lineVi:'Toàn thân · Chuyển động', lineEn:'full body, solo male, dynamic', catVi:'Chuyển động', catEn:'Action',
      vi:'Bước đi street style tự nhiên về phía trước', en:'candid male mid-stride walking forward on city street, natural arm swing, dynamic gait',
      joints: makeJoints({ h:[0,164,8], n:[0,148,5], c:[0,132,4], w:[0,102,2], ls:[-21,142,6], rs:[21,142,-4], le:[-25,114,-8], lha:[-22,92,-16], re:[24,116,12], rha:[18,96,24], lh:[-11,90,4], rh:[11,90,-2], lk:[-12,48,24], la:[-12,10,32], lf:[-12,6,44], rk:[12,46,-16], ra:[12,14,-34], rf:[12,8,-24] }) },
    { id:'men_act_02', no:'MP13', lineKey:'full', lineVi:'Toàn thân · Chuyển động', lineEn:'full body, solo male, dynamic', catVi:'Chuyển động', catEn:'Action',
      vi:'Vừa bước đi vừa xem đồng hồ cổ tay', en:'stylish man walking while checking wristwatch, head angled slightly down, sharp business casual energy',
      joints: makeJoints({ h:[-2,162,10], headYaw:-12, n:[0,147,5], c:[0,132,3], w:[0,102,0], ls:[-21,142,4], rs:[21,142,-2], le:[-26,118,14], lha:[-4,124,26], re:[26,114,-4], rha:[24,88,2], lh:[-11,90,2], rh:[11,90,-2], lk:[-12,48,18], la:[-12,8,24], lf:[-12,4,36], rk:[12,46,-12], ra:[12,10,-24], rf:[12,5,-14] }) },
    { id:'men_act_03', no:'MP14', lineKey:'full', lineVi:'Toàn thân · Thời trang', lineEn:'full body, solo male', catVi:'Chuyển động', catEn:'Action',
      vi:'Đứng chỉnh cổ tay áo / khuy măng sét', en:'sharp suited man adjusting shirt cufflinks, poised arms at waist height, confident editorial stance',
      joints: makeJoints({ h:[2,166,4], headYaw:12, ls:[-21,144,2], rs:[21,144,2], le:[-26,114,10], re:[26,114,10], lha:[-2,108,20], rha:[4,106,22], lk:[-12,48,2], rk:[14,48,4], la:[-13,6,-1], ra:[15,6,3], lf:[-14,2,11], rf:[17,2,14] }) },
    { id:'men_act_04', no:'MP15', lineKey:'full', lineVi:'Toàn thân · Chuyển động', lineEn:'full body, solo male, athletic', catVi:'Chuyển động', catEn:'Action',
      vi:'Chạy bộ thể thao năng động', en:'athletic male running mid-stride, torso leaning forward, bent pumping arms, dynamic sports motion',
      joints: makeJoints({ h:[0,158,18], n:[0,144,12], c:[0,128,8], w:[0,98,-2], ls:[-21,138,14], rs:[21,138,2], le:[-24,114,26], lha:[-14,128,36], re:[24,112,-14], rha:[20,98,-2], lh:[-11,88,2], rh:[11,88,-4], lk:[-12,62,32], la:[-12,24,22], lf:[-12,18,34], rk:[12,48,-24], ra:[12,28,-48], rf:[12,24,-54] }) },
    { id:'men_act_05', no:'MP16', lineKey:'full', lineVi:'Toàn thân · Chuyển động', lineEn:'full body, solo male, dynamic', catVi:'Chuyển động', catEn:'Action',
      vi:'Bật nhảy streetwear góc thấp đầy năng lượng', en:'energetic streetwear male mid-air jump pose, knees tucked dynamically, arms extended for balance',
      joints: makeJoints({ h:[0,174,4], n:[0,158,2], c:[0,142,2], w:[0,114,0], ls:[-22,152,2], rs:[22,152,2], le:[-40,142,10], lha:[-48,160,18], re:[40,136,-6], rha:[48,118,-10], lh:[-12,102,2], rh:[12,102,2], lk:[-18,74,28], la:[-14,38,14], lf:[-14,32,26], rk:[20,66,18], ra:[24,34,-12], rf:[24,26,-4] }) },

    // Gym & Sport (4)
    { id:'men_gym_01', no:'MP17', lineKey:'full', lineVi:'Toàn thân · Thể hình', lineEn:'full body, solo athletic male', catVi:'Thể hình', catEn:'Gym & Sport',
      vi:'Tư thế đứng thể hình chữ V rộng vai', en:'athletic male power stance, broad shoulders squared, feet planted wide, slight forward tension',
      joints: makeJoints({ ls:[-24,144,2], rs:[24,144,2], le:[-34,116,4], re:[34,116,4], lha:[-28,88,10], rha:[28,88,10], lk:[-20,48,4], rk:[20,48,4], la:[-24,6,0], ra:[24,6,0], lf:[-27,2,12], rf:[27,2,12] }) },
    { id:'men_gym_02', no:'MP18', lineKey:'full', lineVi:'Toàn thân · Thể hình', lineEn:'full body, solo athletic male', catVi:'Thể hình', catEn:'Gym & Sport',
      vi:'Đan hai tay sau gáy mở ngực, khoe dáng vai', en:'fit male standing with both hands clasped behind head, elbows flared wide, open chest posture',
      joints: makeJoints({ ls:[-23,146,2], rs:[23,146,2], le:[-38,162,4], re:[38,162,4], lha:[-8,164,-8], rha:[8,164,-8], lk:[-14,48,2], rk:[14,48,2], la:[-16,6,-1], ra:[16,6,-1], lf:[-18,2,11], rf:[18,2,11] }) },
    { id:'men_gym_03', no:'MP19', lineKey:'full', lineVi:'Toàn thân · Thể hình', lineEn:'full body, solo athletic male', catVi:'Thể hình', catEn:'Gym & Sport',
      vi:'Tư thế gập tay tập luyện khỏe khoắn', en:'athletic man mid-curl workout stance, forearms raised with clenched fists, solid core posture',
      joints: makeJoints({ ls:[-23,144,2], rs:[23,144,2], le:[-29,112,6], re:[29,112,6], lha:[-20,128,22], rha:[20,128,22], lk:[-18,48,4], rk:[18,48,4], la:[-20,6,0], ra:[20,6,0], lf:[-22,2,12], rf:[22,2,12] }) },
    { id:'men_gym_04', no:'MP20', lineKey:'full', lineVi:'Toàn thân · Đường phố', lineEn:'full body, solo male, streetwear', catVi:'Thể hình', catEn:'Gym & Sport',
      vi:'Ngồi xổm streetwear góc thấp cá tính', en:'streetwear male deep crouch pose, knees wide, forearms resting on thighs, looking intently at camera',
      joints: makeJoints({ h:[0,104,16], n:[0,88,10], c:[0,74,6], w:[0,48,-10], ls:[-22,84,8], rs:[22,84,8], le:[-26,56,22], re:[26,56,22], lha:[-8,48,34], rha:[8,48,34], lh:[-14,38,-12], rh:[14,38,-12], lk:[-26,48,26], rk:[26,48,26], la:[-20,10,4], ra:[20,10,10], lf:[-22,4,18], rf:[22,4,24] }) },

    // Upper Body (4)
    { id:'men_up_01', no:'MP21', lineKey:'upper', lineVi:'Bán thân · Chân dung', lineEn:'upper body, solo male portrait', catVi:'Bán thân', catEn:'Upper Body',
      vi:'Bán thân tay chạm cằm ánh nhìn trầm tư', en:'male upper-body portrait, hand resting gently near chin, relaxed shoulders, thoughtful gaze',
      joints: makeJoints({ headYaw:-10, le:[-26,114,4], lha:[-18,90,10], re:[22,114,18], rha:[6,154,16] }) },
    { id:'men_up_02', no:'MP22', lineKey:'upper', lineVi:'Bán thân · Thời trang', lineEn:'upper body, solo male portrait', catVi:'Bán thân', catEn:'Upper Body',
      vi:'Đưa một tay chỉnh kính râm cực ngầu', en:'stylish man upper-body pose adjusting sunglasses with one hand, slight head tilt, confident look',
      joints: makeJoints({ headYaw:12, le:[-26,114,2], lha:[-20,88,6], re:[32,128,16], rha:[12,164,14] }) },
    { id:'men_up_03', no:'MP23', lineKey:'upper', lineVi:'Bán thân · Chân dung', lineEn:'upper body, solo male portrait', catVi:'Bán thân', catEn:'Upper Body',
      vi:'Một tay vuốt tóc tự nhiên, phong thái nam tính', en:'candid male portrait running fingers through hair, elbow raised, natural relaxed expression',
      joints: makeJoints({ headYaw:-16, le:[-26,114,2], lha:[-20,88,6], re:[38,154,8], rha:[14,174,8] }) },
    { id:'men_up_04', no:'MP24', lineKey:'upper', lineVi:'Bán thân · Thời trang', lineEn:'upper body, solo male portrait', catVi:'Bán thân', catEn:'Upper Body',
      vi:'Chỉnh ve áo vest / cổ áo sơ mi cận cảnh', en:'close-up male editorial pose gripping jacket lapel with both hands, sharp jawline angle',
      joints: makeJoints({ headYaw:14, le:[-28,116,12], re:[28,116,12], lha:[-12,134,16], rha:[12,134,16] }) }
  ];

  const POSES = RAW_POSES.map(p => ({
    id: p.id,
    no: p.no,
    type: 'pose',
    k: 'p:' + p.id,
    lineKey: p.lineKey,
    lineVi: p.lineVi,
    lineEn: p.lineEn,
    catVi: p.catVi,
    catEn: p.catEn,
    vi: p.vi,
    en: p.en,
    ai: 0,
    angles: ANG_META.map((a, idx) => {
      const uri = renderPoseSVG(p, idx);
      return { key: a.key, vi: a.vi, en: a.en, promptEn: a.promptEn, t: uri, i: uri };
    })
  }));

  // ---- 24 Curated Male Outfits ----
  const RAW_OUTFITS = [
    // Streetwear (4)
    { id:'men_cos_01', catVi:'Streetwear', catEn:'Streetwear', sil:'hoodie', bot:'cargo', pal:['black','white','olive','white'],
      tiVi:'Hoodie đen Oversize + Quần Cargo xanh rêu', tiEn:'Black Oversized Hoodie + Olive Cargo Pants',
      vi:'Áo hoodie đen form rộng phối quần túi hộp màu xanh rêu, giày sneaker trắng cổ thấp, phong cách đường phố hiện đại.',
      en:'men streetwear outfit, oversized black cotton hoodie, olive green relaxed cargo pants, clean white chunky sneakers, urban look',
      cols:['black','olive','white'], items:['hoodie','cargo pants','sneakers'] },
    { id:'men_cos_02', catVi:'Streetwear', catEn:'Streetwear', sil:'jacket', bot:'pants', pal:['denim','white','black','white'],
      tiVi:'Áo khoác Denim wash + Quần ống rộng đen', tiEn:'Washed Denim Jacket + Wide Black Trousers',
      vi:'Áo khoác denim xanh wash lớp ngoài, bên trong áo thun trắng trơn, quần ống rộng màu đen và giày sneaker canvas.',
      en:'men streetwear outfit, washed blue denim trucker jacket, heavyweight white crew-neck t-shirt, wide-leg black trousers, white sneakers',
      cols:['blue','white','black'], items:['jacket','t-shirt','trousers','sneakers'] },
    { id:'men_cos_03', catVi:'Streetwear', catEn:'Streetwear', sil:'jacket', bot:'cargo', pal:['olive','black','charcoal','black'],
      tiVi:'Bomber xanh rêu + Quần Cargo xám đậm', tiEn:'Olive Bomber Jacket + Charcoal Cargo',
      vi:'Áo khoác bomber nylon xanh rêu phối áo thun đen bên trong, quần cargo xám than và bốt cổ thấp màu đen.',
      en:'men streetwear outfit, olive green nylon bomber jacket, black crewneck tee, dark charcoal cargo pants, black combat boots',
      cols:['olive','black','grey'], items:['jacket','cargo pants','boots'] },
    { id:'men_cos_04', catVi:'Streetwear', catEn:'Streetwear', sil:'tee', bot:'shorts', pal:['cream','black','black','white'],
      tiVi:'Áo thun Boxy kem + Quần Short đen thể thao', tiEn:'Cream Boxy Tee + Black Relaxed Shorts',
      vi:'Áo thun boxy màu kem chất cotton dày, quần short đen ngang gối, tất cao cổ và giày sneaker retro.',
      en:'men summer streetwear outfit, heavyweight cream boxy t-shirt, black relaxed knee-length shorts, white crew socks, retro sneakers',
      cols:['cream','black','white'], items:['t-shirt','shorts','sneakers'] },

    // Smart Casual (4)
    { id:'men_cos_05', catVi:'Smart Casual', catEn:'Smart Casual', sil:'blazer', bot:'pants', pal:['navy','white','beige','brown'],
      tiVi:'Blazer xanh Navy + Quần Chinos màu be', tiEn:'Navy Blazer + Beige Chinos',
      vi:'Áo blazer xanh navy không độn vai phối áo thun trắng cổ tròn, quần chinos màu be và giày lười loafer da nâu.',
      en:'men smart casual outfit, unstructured navy blazer, crisp white crewneck t-shirt, tailored beige chinos, brown suede loafers',
      cols:['navy','white','beige','brown'], items:['blazer','t-shirt','trousers','loafers'] },
    { id:'men_cos_06', catVi:'Smart Casual', catEn:'Smart Casual', sil:'shirt', bot:'pants', pal:['blue','white','navy','white'],
      tiVi:'Sơ mi Oxford xanh nhạt + Quần Tây xanh đậm', tiEn:'Light Blue Oxford Shirt + Navy Trousers',
      vi:'Áo sơ mi Oxford xanh dương nhạt xắn tay gọn gàng, phối quần âu xếp ly màu xanh navy và giày sneaker da tối giản trắng.',
      en:'men smart casual outfit, light blue Oxford button-down shirt with rolled sleeves, pleated navy wool trousers, minimalist white leather sneakers',
      cols:['blue','navy','white'], items:['shirt','trousers','sneakers'] },
    { id:'men_cos_07', catVi:'Smart Casual', catEn:'Smart Casual', sil:'knit', bot:'pants', pal:['charcoal','grey','black','black'],
      tiVi:'Áo len cổ lọ xám than + Quần âu đen', tiEn:'Charcoal Turtleneck Knit + Black Trousers',
      vi:'Áo len cổ lọ dệt mịn màu xám than, phối quần âu ống suông màu đen và giày Chelsea boots da bóng.',
      en:'men smart casual autumn outfit, fine-gauge charcoal merino turtleneck sweater, tailored black straight trousers, sleek black leather Chelsea boots',
      cols:['grey','black'], items:['sweater','trousers','boots'] },
    { id:'men_cos_08', catVi:'Smart Casual', catEn:'Smart Casual', sil:'coat', bot:'pants', pal:['beige','cream','brown','brown'],
      tiVi:'Áo khoác Trench màu be + Áo len kem', tiEn:'Beige Trench Coat + Cream Knitwear',
      vi:'Áo khoác măng tô dáng dài màu be phối áo len cổ tròn màu kem, quần tây nâu đất và giày derby da lộn.',
      en:'men smart casual outfit, classic beige trench coat, cream knitted sweater, dark brown pleated trousers, brown suede derby shoes',
      cols:['beige','cream','brown'], items:['coat','sweater','trousers','loafers'] },

    // Suit & Formal (4)
    { id:'men_cos_09', catVi:'Vest / Công sở', catEn:'Suit & Formal', sil:'suit', bot:'pants', pal:['charcoal','white','charcoal','black'], accent:'#1e3a5f',
      tiVi:'Bộ Suit xám than + Sơ mi trắng lịch lãm', tiEn:'Charcoal Tailored Suit + White Dress Shirt',
      vi:'Bộ suit hai mảnh màu xám than cắt may vừa vặn, áo sơ mi trắng cổ cứng, cà vạt lụa xanh navy và giày Oxford da đen.',
      en:'men formal outfit, tailored charcoal grey wool two-piece suit, crisp white dress shirt, dark navy silk tie, polished black Oxford shoes',
      cols:['grey','white','black'], items:['suit','shirt','trousers','loafers'] },
    { id:'men_cos_10', catVi:'Vest / Công sở', catEn:'Suit & Formal', sil:'suit', bot:'pants', pal:['navy','white','navy','brown'], accent:'#6e1d2f',
      tiVi:'Suit xanh Navy đậm + Cà vạt đỏ rượu vang', tiEn:'Deep Navy Suit + Burgundy Tie',
      vi:'Bộ vest doanh nhân xanh navy đậm, sơ mi trắng, cà vạt lụa đỏ burgundy và giày tây da nâu sẫm.',
      en:'men business formal outfit, sharp deep navy tailored suit, white poplin shirt, burgundy silk tie, dark brown leather dress shoes',
      cols:['navy','white','red','brown'], items:['suit','shirt','trousers','loafers'] },
    { id:'men_cos_11', catVi:'Vest / Công sở', catEn:'Suit & Formal', sil:'suit', bot:'pants', pal:['black','black','black','black'], accent:'#111827',
      tiVi:'Suit All-Black tối giản tiệc tối', tiEn:'Monochrome All-Black Evening Suit',
      vi:'Bộ suit đen tuyền phom hiện đại phối áo sơ mi đen không cà vạt, phong cách dự tiệc tối sang trọng.',
      en:'men evening formal outfit, sleek monochrome black tailored suit, black dress shirt unbuttoned at collar, black patent dress shoes',
      cols:['black'], items:['suit','shirt','trousers','boots'] },
    { id:'men_cos_12', catVi:'Vest / Công sở', catEn:'Suit & Formal', sil:'coat', bot:'pants', pal:['brown','white','charcoal','black'],
      tiVi:'Áo choàng dạ nâu Camel + Suit công sở', tiEn:'Camel Wool Overcoat + Business Trousers',
      vi:'Áo khoác dạ dài màu nâu camel khoác ngoài sơ mi trắng và quần âu xám than, chuẩn quý ông mùa đông.',
      en:'men winter formal outfit, tailored camel wool overcoat layered over white shirt and charcoal dress trousers, black leather boots',
      cols:['brown','white','grey','black'], items:['coat','shirt','trousers','boots'] },

    // Sport & Gym (4)
    { id:'men_cos_13', catVi:'Thể thao / Gym', catEn:'Sport & Gym', sil:'sport', bot:'shorts', pal:['black','grey','charcoal','white'],
      tiVi:'Áo tập đen ôm dáng + Quần Short chạy bộ xám', tiEn:'Black Performance Tee + Charcoal Running Shorts',
      vi:'Áo thun thể thao vải thoáng khí màu đen ôm gọn cầu vai, phối quần short chạy bộ xám đậm và giày chạy bộ đế êm trắng.',
      en:'men athletic gym outfit, fitted black moisture-wicking training t-shirt, dark grey athletic running shorts, white performance running sneakers',
      cols:['black','grey','white'], items:['t-shirt','shorts','sneakers'] },
    { id:'men_cos_14', catVi:'Thể thao / Gym', catEn:'Sport & Gym', sil:'hoodie', bot:'pants', pal:['grey','white','grey','white'],
      tiVi:'Bộ nỉ thể thao xám ghi đồng bộ', tiEn:'Heather Grey Matching Tracksuit',
      vi:'Áo hoodie nỉ bông màu xám ghi phối quần jogger bo gấu đồng màu và giày sneaker thể thao trắng.',
      en:'men athleisure outfit, heather grey cotton fleece pullover hoodie, matching slim athletic joggers, crisp white running sneakers',
      cols:['grey','white'], items:['hoodie','trousers','sneakers'] },
    { id:'men_cos_15', catVi:'Thể thao / Gym', catEn:'Sport & Gym', sil:'jacket', bot:'pants', pal:['navy','white','black','white'],
      tiVi:'Áo khoác gió thể thao Navy + Quần Jogger đen', tiEn:'Navy Windbreaker + Black Track Pants',
      vi:'Áo khoác gió thể thao màu xanh navy siêu nhẹ, áo thun trắng bên trong, quần track pants đen và giày sneaker.',
      en:'men sporty outfit, lightweight navy technical windbreaker jacket, white athletic tee, black tapered track pants, white trainers',
      cols:['navy','white','black'], items:['jacket','trousers','sneakers'] },
    { id:'men_cos_16', catVi:'Thể thao / Gym', catEn:'Sport & Gym', sil:'sport', bot:'shorts', pal:['olive','black','black','black'],
      tiVi:'Áo thun thể thao xanh rêu + Short tập đen', tiEn:'Olive Training Top + Black Gym Shorts',
      vi:'Áo tập màu xanh rêu đậm tôn dáng vai ngực, quần short thể thao đen và giày tập gym đế bằng màu đen.',
      en:'men gym outfit, olive green athletic fitted t-shirt, black performance gym shorts, matte black training sneakers',
      cols:['olive','black'], items:['t-shirt','shorts','sneakers'] },

    // Minimalist (4)
    { id:'men_cos_17', catVi:'Tối giản', catEn:'Minimalist', sil:'tee', bot:'pants', pal:['white','white','black','black'],
      tiVi:'Áo thun trắng phom đứng + Quần âu đen tối giản', tiEn:'Crisp White Tee + Black Tailored Trousers',
      vi:'Combo tối giản kinh điển: áo thun trắng cổ tròn vải dày sơ vin gọn với quần tây đen ống suông và giày da đen.',
      en:'men minimalist outfit, crisp heavyweight white crewneck t-shirt neatly tucked into black straight-leg tailored trousers, black leather loafers',
      cols:['white','black'], items:['t-shirt','trousers','loafers'] },
    { id:'men_cos_18', catVi:'Tối giản', catEn:'Minimalist', sil:'shirt', bot:'pants', pal:['cream','white','sand','brown'],
      tiVi:'Sơ mi Linen màu kem + Quần ống suông màu cát', tiEn:'Cream Linen Shirt + Sand Relaxed Trousers',
      vi:'Áo sơ mi vải đũi linen màu kem thoáng nhẹ, phối quần ống suông màu cát biển, phong cách tối giản thanh lịch.',
      en:'men minimalist summer outfit, relaxed cream linen button-up shirt, sand-colored wide-leg linen trousers, brown leather sandals or loafers',
      cols:['cream','beige','brown'], items:['shirt','trousers','loafers'] },
    { id:'men_cos_19', catVi:'Tối giản', catEn:'Minimalist', sil:'knit', bot:'pants', pal:['black','black','charcoal','black'],
      tiVi:'Áo len đen cổ tròn + Quần xám đậm tối giản', tiEn:'Black Crewneck Knit + Charcoal Wool Pants',
      vi:'Áo len dệt trơn màu đen phối quần dạ xám đậm phom suông, tối giản không họa tiết, tôn chiều cao.',
      en:'men minimalist autumn outfit, clean black fine-knit crewneck sweater, dark charcoal straight wool trousers, black minimalist sneakers',
      cols:['black','grey'], items:['sweater','trousers','sneakers'] },
    { id:'men_cos_20', catVi:'Tối giản', catEn:'Minimalist', sil:'coat', bot:'pants', pal:['black','white','black','black'],
      tiVi:'Áo khoác dạ đen dáng dài + Outfit đơn sắc', tiEn:'Long Black Wool Coat + Monochrome Base',
      vi:'Áo khoác dạ dáng dài màu đen tối giản khoác ngoài áo thun trắng và quần âu đen, phong thái thanh lịch hiện đại.',
      en:'men minimalist winter outfit, long black tailored wool overcoat, white mock-neck top, black slim trousers, sleek black leather boots',
      cols:['black','white'], items:['coat','t-shirt','trousers','boots'] },

    // Workwear / Vintage (4)
    { id:'men_cos_21', catVi:'Workwear', catEn:'Workwear', sil:'jacket', bot:'pants', pal:['brown','cream','denim','brown'],
      tiVi:'Áo khoác Canvas nâu đất + Quần Jeans xanh đậm', tiEn:'Brown Canvas Work Jacket + Raw Indigo Jeans',
      vi:'Áo khoác workwear vải canvas màu nâu đất, áo thun kem bên trong, quần jeans denim xanh đậm và giày boots da cổ cao.',
      en:'men workwear outfit, rugged brown duck canvas chore jacket, off-white henley tee, raw indigo straight denim jeans, brown leather work boots',
      cols:['brown','cream','blue'], items:['jacket','jeans','boots'] },
    { id:'men_cos_22', catVi:'Workwear', catEn:'Workwear', sil:'jacket', bot:'cargo', pal:['khaki','white','olive','brown'],
      tiVi:'Áo khoác Field Jacket kaki + Quần túi hộp xanh rêu', tiEn:'Khaki Field Jacket + Olive Utility Pants',
      vi:'Áo khoác 4 túi kiểu quân đội màu kaki phối áo thun trắng, quần utility màu xanh rêu và giày boots da lộn.',
      en:'men vintage workwear outfit, khaki cotton utility field jacket, white crew t-shirt, olive green fatigue pants, brown suede boots',
      cols:['beige','white','olive','brown'], items:['jacket','cargo pants','boots'] },
    { id:'men_cos_23', catVi:'Workwear', catEn:'Workwear', sil:'jacket', bot:'pants', pal:['black','white','denim','black'],
      tiVi:'Áo khoác da Biker đen + Quần Jeans xanh cổ điển', tiEn:'Black Leather Biker Jacket + Classic Blue Jeans',
      vi:'Áo khoác da màu đen dáng biker cá tính, áo thun trắng trơn bên trong, quần jeans xanh cổ điển và boots da đen.',
      en:'men rugged casual outfit, classic black leather biker jacket, white cotton t-shirt, vintage blue straight jeans, black leather boots',
      cols:['black','white','blue'], items:['jacket','t-shirt','jeans','boots'] },
    { id:'men_cos_24', catVi:'Workwear', catEn:'Workwear', sil:'shirt', bot:'pants', pal:['green','cream','brown','brown'],
      tiVi:'Áo Overshirt nhung tăm xanh rêu + Quần nâu cổ điển', tiEn:'Forest Green Corduroy Overshirt + Brown Pants',
      vi:'Áo sơ mi khoác ngoài chất nhung tăm màu xanh đậm phối áo thun kem và quần vải dày màu nâu cổ điển.',
      en:'men vintage workwear outfit, forest green corduroy overshirt worn open over cream tee, warm brown relaxed corduroy trousers, brown boots',
      cols:['green','cream','brown'], items:['shirt','trousers','boots'] }
  ];

  const COSTUMES = RAW_OUTFITS.map(o => {
    const uri = renderOutfitSVG(o);
    return {
      id: o.id,
      type: 'costume',
      k: 'c:' + o.id,
      catVi: o.catVi,
      catEn: o.catEn,
      tiVi: o.tiVi,
      tiEn: o.tiEn,
      vi: o.vi,
      en: o.en,
      cols: o.cols,
      items: o.items,
      t: uri,
      m: uri,
      i: uri
    };
  });

  // ---- 12 Curated Male Portraits / Hairstyles ----
  const RAW_PORTRAITS = [
    { id:'men_por_01', no:'MF01', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'undercut', hairCol:'#1a1d21', skin:'#f0c6a4', bg:'#e8edf2', shirtCol:'#1e293b',
      tiVi:'Undercut vuốt gọn · Studio', tiEn:'Clean Undercut · Studio Portrait',
      vi:'Nam giới châu Á 25 tuổi, kiểu tóc Undercut vuốt gọn hai bên cạo sát, gương mặt góc cạnh tự nhiên, nền studio xám sáng, ánh sáng dịu.',
      en:'adult East Asian man in his mid-20s, clean modern undercut hairstyle, sharp natural jawline, front-facing head-and-shoulders studio portrait, light grey backdrop, soft even lighting, consistent facial features' },
    { id:'men_por_02', no:'MF02', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc trung bình', lenEn:'Medium Hair',
      hStyle:'sidepart', hairCol:'#231f20', skin:'#f3ccb0', bg:'#eceae6', shirtCol:'#0f172a',
      tiVi:'Side Part 7/3 Hàn Quốc · Chính diện', tiEn:'Korean 7/3 Side Part · Front Portrait',
      vi:'Nam giới trẻ 24 tuổi, tóc Side Part rẽ ngôi 7/3 mềm mại chuẩn Hàn Quốc, làn da tự nhiên, ảnh chân dung chính diện ánh sáng ban ngày.',
      en:'young adult East Asian man, Korean 7/3 side-part medium black hair, clean-shaven, natural skin texture, front portrait, soft daylight, face reference' },
    { id:'men_por_03', no:'MF03', secVi:'Đời thường', secEn:'Lifestyle', lenVi:'Tóc trung bình', lenEn:'Medium Hair',
      hStyle:'middle', hairCol:'#2c221e', skin:'#f2cab0', bg:'#e5ebe7', shirtCol:'#334155',
      tiVi:'Middle Part 5/5 rẽ ngôi giữa · Tự nhiên', tiEn:'5/5 Middle Part Curtain Hair · Lifestyle',
      vi:'Nam giới 23 tuổi, kiểu tóc rẽ ngôi giữa 5/5 bồng bềnh tự nhiên, ánh sáng cửa sổ dịu nhẹ trong nhà, phong cách đời thường.',
      en:'young adult Asian man, voluminous 5/5 middle-part curtain hairstyle, relaxed expression, indoor natural window light lifestyle portrait, face reference' },
    { id:'men_por_04', no:'MF04', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'buzz', hairCol:'#1c1f24', skin:'#e2b48d', bg:'#e2e8f0', shirtCol:'#111827',
      tiVi:'Buzz Cut nam tính sắc nét', tiEn:'Sharp Masculine Buzz Cut',
      vi:'Nam giới 28 tuổi, kiểu tóc Buzz Cut cạo gọn nam tính, đường hàm rõ nét, ánh sáng studio tương phản nhẹ.',
      en:'adult man in his late 20s, sharp masculine buzz cut, defined jawline, clean-shaven, crisp studio portrait lighting, face reference' },
    { id:'men_por_05', no:'MF05', secVi:'Đời thường', secEn:'Lifestyle', lenVi:'Tóc dài / Mullet', lenEn:'Long / Mullet',
      hStyle:'mullet', hairCol:'#1b1b1f', skin:'#f0c8a8', bg:'#eae6ef', shirtCol:'#1f2937',
      tiVi:'Wolf Cut / Mullet Nam cá tính', tiEn:'Modern Male Wolf Cut / Mullet',
      vi:'Nam giới 24 tuổi, kiểu tóc Wolf Cut / Mullet tỉa layer cá tính, đuôi tóc dài nhẹ sau gáy, phong cách thời trang đường phố.',
      en:'stylish young adult man, layered modern male wolf cut mullet hairstyle, black hair, editorial street lifestyle portrait, consistent facial features' },
    { id:'men_por_06', no:'MF06', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'sidepart', hairCol:'#3b281c', skin:'#e8bc9a', bg:'#ebe7e0', shirtCol:'#1e3a5f', beard:true,
      tiVi:'Classic Taper + Râu quai nón nhẹ · Âu Mỹ', tiEn:'Classic Taper + Light Beard · Western Male',
      vi:'Nam giới Âu Mỹ 30 tuổi, tóc nâu đậm cắt Classic Taper gọn gàng kèm râu quai nón cắt tỉa chỉn chu, phong thái trưởng thành.',
      en:'adult Caucasian man in his early 30s, dark brown classic taper haircut, neatly trimmed short beard, mature masculine features, studio headshot, face reference' },
    { id:'men_por_07', no:'MF07', secVi:'Đời thường', secEn:'Lifestyle', lenVi:'Tóc trung bình', lenEn:'Medium Hair',
      hStyle:'wavy', hairCol:'#2b1e16', skin:'#f1c9aa', bg:'#f0ebe3', shirtCol:'#374151',
      tiVi:'Tóc uốn xoăn sóng nhẹ Wavy Perm', tiEn:'Soft Wavy Perm Medium Hair',
      vi:'Nam giới 25 tuổi, tóc nâu hạt dẻ uốn xoăn lơi tự nhiên, gương mặt thân thiện, ánh sáng tự nhiên ngoài trời.',
      en:'adult East Asian man in his mid-20s, soft wavy perm chestnut brown medium hair, natural warm outdoor daylight portrait, consistent face reference' },
    { id:'men_por_08', no:'MF08', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'undercut', hairCol:'#16181d', skin:'#d9a67e', bg:'#e4e9ed', shirtCol:'#0f172a', beard:true,
      tiVi:'Slick Back vuốt ngược doanh nhân', tiEn:'Executive Slick Back · Sharp Portrait',
      vi:'Nam giới 32 tuổi, tóc vuốt ngược Slick Back bóng mượt, ánh mắt tự tin điềm đạm, chân dung doanh nhân chuyên nghiệp.',
      en:'adult man in his early 30s, sleek slicked-back dark hair, groomed short stubble, composed executive expression, studio portrait lighting, face reference' },
    { id:'men_por_09', no:'MF09', secVi:'Đời thường', secEn:'Lifestyle', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'default', hairCol:'#1f2328', skin:'#ecc29f', bg:'#e9eef2', shirtCol:'#2d5a43',
      tiVi:'Textured Crop cắt gọn trẻ trung', tiEn:'Textured Crop · Youthful Casual',
      vi:'Nam giới 22 tuổi, kiểu tóc Textured Crop mái ngắn tỉa lớp gọn gàng, phong cách năng động trẻ trung.',
      en:'young adult Asian man in his early 20s, modern textured crop haircut with short fringe, athletic clean look, casual daylight portrait, face reference' },
    { id:'men_por_10', no:'MF10', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc trung bình', lenEn:'Medium Hair',
      hStyle:'wavy', hairCol:'#4a3728', skin:'#f4cfb4', bg:'#f1ede8', shirtCol:'#475569',
      tiVi:'Short Quiff nâu trầm · Thời trang', tiEn:'Warm Brown Short Quiff · Lookbook',
      vi:'Nam giới 27 tuổi, tóc nâu trầm tạo kiểu Short Quiff tự nhiên có độ phồng nhẹ, ánh sáng lookbook thời trang.',
      en:'adult man in his late 20s, warm brown short quiff hairstyle with natural volume, fashion lookbook portrait lighting, clean neutral background, face reference' },
    { id:'men_por_11', no:'MF11', secVi:'Đời thường', secEn:'Lifestyle', lenVi:'Tóc dài / Mullet', lenEn:'Long / Mullet',
      hStyle:'mullet', hairCol:'#201e1f', skin:'#e8be9c', bg:'#e6eceb', shirtCol:'#18181b', beard:true,
      tiVi:'Tóc dài nghệ sĩ buộc hờ / Layer dài', tiEn:'Artistic Long Layered Hair',
      vi:'Nam giới 29 tuổi, tóc đen dài tỉa tầng lãng tử, râu mỏng nam tính, ánh sáng chiều ấm áp.',
      en:'adult man in his late 20s, artistic shoulder-length layered black hair, light stubble, warm golden-hour lifestyle portrait, consistent facial features' },
    { id:'men_por_12', no:'MF12', secVi:'Chân dung chính diện', secEn:'Front Portrait', lenVi:'Tóc ngắn', lenEn:'Short Hair',
      hStyle:'default', hairCol:'#181b20', skin:'#eac09d', bg:'#ebeff4', shirtCol:'#1e293b',
      tiVi:'Ivy League cổ điển gọn gàng', tiEn:'Classic Ivy League Haircut',
      vi:'Nam giới 26 tuổi, kiểu tóc Ivy League gọn gàng thanh lịch kiểu cổ điển, ảnh chính diện sắc nét.',
      en:'adult East Asian man in his mid-20s, classic Ivy League short haircut, neat side taper, clean-shaven, sharp studio front portrait, face reference' }
  ];

  const PORTRAITS = RAW_PORTRAITS.map(r => {
    const uri = renderPortraitSVG(r);
    return {
      id: r.id,
      no: r.no,
      type: 'portrait',
      k: 'r:' + r.id,
      secVi: r.secVi,
      secEn: r.secEn,
      lenVi: r.lenVi,
      lenEn: r.lenEn,
      tiVi: r.tiVi,
      tiEn: r.tiEn,
      vi: r.vi,
      en: r.en,
      t: uri,
      m: uri,
      i: uri
    };
  });

  window.POSEWEAR_MEN_DATA = {
    ANG_META,
    POSES,
    COSTUMES,
    PORTRAITS,
    renderPoseSVG,
    renderOutfitSVG,
    renderPortraitSVG
  };
})();
