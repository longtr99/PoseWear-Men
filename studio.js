'use strict';
(function(){
  const A = window.APP;
  if(!A) return;
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const esc = A.esc, toast = A.toast;
  const LS = k => { try{ return JSON.parse(localStorage.getItem('pw_' + k) || 'null'); }catch(e){ return null; } };
  const SV = (k, v) => { try{ localStorage.setItem('pw_' + k, JSON.stringify(v)); }catch(e){} };

  // ---- Providers (BYOK, matching PoseWear) ----
  const PROV = {
    openai:   { name:'OpenAI', base:'https://api.openai.com/v1', model:'gpt-image-1', models:['gpt-image-1','gpt-image-1-mini','gpt-image-2'] },
    gemini:   { name:'Gemini', base:'https://generativelanguage.googleapis.com/v1beta', model:'gemini-2.5-flash-image', models:['gemini-2.5-flash-image','gemini-3-pro-image-preview','gemini-3.1-flash-image'] },
    seedream: { name:'Doubao Seedream', base:'https://ark.cn-beijing.volces.com/api/v3', model:'doubao-seedream-4-0-250828', models:['doubao-seedream-4-0-250828','doubao-seedream-4-5-251128'] },
    custom:   { name:'Custom / xAI', base:'', model:'gpt-image-1', models:['gpt-image-1','grok-imagine-image-2.0','gemini-2.5-flash-image','flux-kontext-pro'] }
  };
  const cfg = Object.assign({ prov:'openai', base:'', key:'', model:'', field:'image[]', proto:'edits', proxy:false }, LS('wbCfg') || {});

  // ---- Male Model & Look Presets (VI/EN) ----
  const CHARS = [
    ['vn_man',   'Nam Việt / Đông Á', 'East Asian Male',  'an adult East Asian man in his mid-20s, modern short black hair, clean-shaven, lean athletic build', 'một người đàn ông Đông Á khoảng 25 tuổi, tóc đen ngắn hiện đại, gương mặt gọn gàng, vóc dáng cân đối'],
    ['west_man', 'Nam Âu Mỹ',         'Western Male',     'an adult Caucasian man in his late 20s, textured brown hair, neatly trimmed light stubble, tall athletic build', 'một người đàn ông Âu Mỹ khoảng 28 tuổi, tóc nâu tỉa gọn, râu mỏng nam tính, dáng cao khỏe khoắn'],
    ['gym_man',  'Nam Thể hình',      'Athletic Male',    'an adult fit muscular man in his late 20s, broad shoulders, sharp jawline, short tapered haircut', 'một người đàn ông thể hình săn chắc khoảng 28 tuổi, vai rộng, đường hàm rõ nét, tóc cắt gọn'],
    ['anime_man','Nam Anime',         'Anime Male',       'an adult anime-style handsome young man, sharp stylish dark hair, tall athletic proportions, clean cel-shaded illustration', 'nhân vật nam phong cách anime trưởng thành, tóc tối sắc sảo, tỷ lệ cao ráo, nét vẽ sạch'],
    ['custom',   'Tùy chỉnh',         'Custom',           '', '']
  ];
  const STYLES = [
    ['keep',   'Giữ chất ảnh gốc', 'Keep Photo Look', 'photorealistic, matching the original photo quality', 'ảnh chân thực khớp chất lượng ảnh gốc'],
    ['studio', 'Studio Lookbook',  'Editorial Studio','clean high-end menswear fashion studio, soft key light, seamless neutral grey backdrop, editorial lookbook photo', 'studio thời trang nam cao cấp, ánh sáng mềm, phông xám trung tính, phong cách lookbook'],
    ['street', 'Đường phố Street', 'Urban Street',    'candid city street-style menswear photo, natural daylight, shallow depth of field, 85mm lens', 'ảnh street style đô thị tự nhiên, ánh sáng ban ngày, xóa phông nhẹ ống kính 85mm'],
    ['ecom',   'Thương mại nền trắng','E-com White',  'e-commerce menswear catalog photo, pure white background, crisp even studio lighting, full body', 'ảnh thương mại điện tử nền trắng tinh, ánh sáng đều, khung hình rõ nét'],
    ['film',   'Film 35mm ấm',     '35mm Film',       '35mm analog film photograph, warm tones, subtle natural grain, golden hour light', 'ảnh phim 35mm tông ấm, hạt phim nhẹ, ánh nắng giờ vàng'],
    ['anime',  'Minh họa Anime',   'Anime Art',       'high-quality anime illustration, clean line art, crisp cel shading', 'minh họa anime chất lượng cao, nét sạch, đổ bóng sắc nét']
  ];

  const W = {
    mode: LS('wbMode') || 'tryon',
    persons: [],
    garments: [],
    poses: [],
    char: LS('wbChar') || 'vn_man',
    charTxt: LS('wbCharTxt') || '',
    style: LS('wbStyle') || 'keep',
    bm: LS('wbBm') || 'each',
    pl: LS('wbPl') || 'en',
    keepBg: LS('wbKeepBg') ?? true,
    busy: null,
    dirty: false,
    results: [],
    ri: 0,
    cmp: true,
    hist: []
  };

  // ---- Utilities ----
  const isVi = () => A.isVi();
  const isGen = () => W.mode === 'gen';
  const hasPerson = () => W.persons.length > 0;
  const normBase = b => (b || '').trim().replace(/\/+$/, '');
  const modelOf = () => (cfg.model || '').trim() || PROV[cfg.prov].model;
  const proto = () => cfg.prov === 'openai' ? 'edits' : cfg.prov === 'custom' ? cfg.proto : cfg.prov;
  function rootUrl(){
    const b = normBase(cfg.base) || PROV[cfg.prov].base;
    if(cfg.prov === 'gemini') return /\/v1(beta|alpha)?$/.test(b) ? b : b + '/v1beta';
    if(cfg.prov === 'seedream') return b;
    return /\/v\d+$/.test(b) ? b : b + '/v1';
  }
  function loadImg(src){
    return new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = () => rej(new Error(isVi()?'Không đọc được ảnh':'Failed to load image'));
      i.src = src;
    });
  }
  async function toJpeg(src, max){
    const i = await loadImg(src);
    const nw = i.naturalWidth || 900, nh = i.naturalHeight || 1200;
    const s = Math.min(1, (max || 1536) / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * s)), h = Math.max(1, Math.round(nh * s));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(i, 0, 0, w, h);
    return new Promise((res, rej) => c.toBlob(b => b ? res({ blob: b, w, h }) : rej(new Error('JPEG encode failed')), 'image/jpeg', 0.92));
  }
  async function assetBlob(a){
    if(a.kind === 'file') return a.blob;
    const it = A.ITEMS[a.k];
    if(!it) throw new Error('Reference item missing');
    const src = it.angles ? it.angles[a.ai ?? (it.ai || 0)].i : (it.i || it.m || it.t);
    return (await toJpeg(src, 1280)).blob;
  }
  const blobToB64 = b => new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result.split(',')[1]); f.readAsDataURL(b); });
  const dataURL = async b => 'data:' + (b.type || 'image/jpeg') + ';base64,' + await blobToB64(b);
  const nJobs = () => (W.poses.length > 1 && W.bm === 'each' ? W.poses.length : 1) * (+$('#wbN').value || 1);

  // ---- Men's Prompt Composer (EN / VI) ----
  function poseDesc(p, en){
    const it = A.ITEMS[p.k];
    if(!it) return '';
    const a = it.angles ? (it.angles[p.ai ?? (it.ai || 0)] || it.angles[0]) : null;
    if(en) return `${it.en}${a ? ` (${a.promptEn || a.en})` : ''}`;
    return `${it.vi}${a ? ` (góc ${a.vi})` : ''}`;
  }

  function compose(poseSet){
    const en = W.pl === 'en';
    const P = W.persons.length, G = W.garments.length;
    const ps = poseSet || W.poses, np = ps.length, sheet = np > 1;
    const style = STYLES.find(s => s[0] === W.style) || STYLES[0];
    const ch = CHARS.find(c => c[0] === W.char) || CHARS[0];
    const ex = ($('#wbExtra').value || '').trim();
    const gi = W.garments.map(g => g.kind === 'lib' && A.ITEMS[g.k]).filter(Boolean);

    let n = 0;
    const rng = c => {
      if(!c) return null;
      const a = n + 1, b = n + c; n = b;
      return a === b ? (en ? `image ${a}` : `ảnh số ${a}`) : (en ? `images ${a}-${b}` : `ảnh số ${a}-${b}`);
    };
    const rP = rng(P), rG = rng(G), rS = rng(np);
    const L = [];

    if(en){
      L.push(P
        ? `Menswear ${isGen()?'editorial generation':'virtual try-on'} using reference images. ${rP} ${P>1?'show':'shows'} the adult male subject${G?`; ${rG} ${G>1?'show':'shows'} the men's outfit`:''}${np?`; ${rS} ${np>1?'are':'is'} 3D male mannequin pose reference${np>1?'s':''}`:''}.`
        : `Menswear fashion image generation from reference images.${G?` ${rG} ${G>1?'show':'shows'} the men's outfit.`:''}${np?` ${rS} ${np>1?'are':'is'} 3D male mannequin pose reference${np>1?'s':''}.`:''}`);
      L.push(P
        ? 'Subject: the adult man from the reference photo. Preserve his exact face, identity, hairstyle, skin tone, and masculine build.'
        : `Subject: ${(W.char==='custom' ? W.charTxt : ch[3]) || ch[3]}.`);
      if(G) L.push(`Outfit: dress the male subject in the complete outfit from ${rG}, faithfully matching garment cut, fabric texture, color, layering, and footwear${gi.length?': '+gi.map(x=>x.en).join('; '):''}. Replace original clothing completely; never render the hanger or blank mannequin.`);
      if(np) L.push((sheet && W.bm === 'sheet' ? `Pose: create ${np} clean panels in one image, matching each pose reference with consistent male identity and outfit: ` : 'Pose: ') + ps.map((p,i) => (sheet && W.bm === 'sheet' ? `(${i+1}) ` : '') + poseDesc(p, true)).join('; ') + '. Use the mannequin only for body posture, limb angles, weight balance and camera perspective; never draw mannequin lines, red dots, or grids.');
      else if(P) L.push('Pose: preserve the original standing/sitting posture and camera framing.');
      L.push(`Look: ${P && W.keepBg && !isGen() ? 'keep the original photo background and natural lighting; ' : ''}${style[3]}. Natural fabric drape, realistic creases and shadows, crisp detail. No text, watermark, or borders.`);
      if(ex) L.push('Additional: ' + ex);
    } else {
      L.push(P
        ? `Ảnh ${isGen()?'tạo mẫu thời trang nam':'thử đồ nam AI'} dựa trên ảnh tham chiếu. ${rP} là ảnh người mẫu nam${G?`; ${rG} là trang phục nam`:''}${np?`; ${rS} là khung tư thế nam 3D`:''}.`
        : `Tạo ảnh thời trang nam từ ảnh tham chiếu.${G?` ${rG} là bộ trang phục nam.`:''}${np?` ${rS} là khung tư thế nam 3D.`:''}`);
      L.push(P
        ? 'Nhân vật: giữ nguyên 100% gương mặt, kiểu tóc, màu da và tỷ lệ cơ thể nam tính từ ảnh gốc.'
        : `Nhân vật: ${(W.char==='custom' ? W.charTxt : ch[4]) || ch[4]}.`);
      if(G) L.push(`Trang phục: mặc cho mẫu nam bộ đồ từ ${rG}, giữ chính xác phom dáng, màu sắc, chất liệu vải, lớp áo và giày${gi.length?': '+gi.map(x=>x.vi).join('; '):''}. Thay toàn bộ đồ cũ, không vẽ móc treo.`);
      if(np) L.push((sheet && W.bm === 'sheet' ? `Tư thế: chia ${np} khung hình đều nhau trong cùng 1 ảnh, giữ đồng nhất gương mặt và trang phục: ` : 'Tư thế: ') + ps.map((p,i) => (sheet && W.bm === 'sheet' ? `(${i+1}) ` : '') + poseDesc(p, false)).join('; ') + '. Chỉ lấy dáng cơ thể và góc máy từ hình khối 3D, không vẽ đường lưới hay điểm khớp.');
      else if(P) L.push('Tư thế: giữ nguyên tư thế và góc máy của ảnh gốc.');
      L.push(`Bối cảnh & ánh sáng: ${P && W.keepBg && !isGen() ? 'giữ nguyên nền và ánh sáng ảnh gốc; ' : ''}${style[4]}. Nếp vải tự nhiên, độ chi tiết cao, không chữ, không watermark.`);
      if(ex) L.push('Yêu cầu thêm: ' + ex);
    }
    return L.join('\n');
  }

  function reprompt(force){
    if(force || !W.dirty){
      $('#wbPrompt').value = compose();
      W.dirty = false;
    }
  }

  // ---- Neutralizer (Reduce False Safety Blocks) ----
  function neutralize(prompt){
    const frame = W.pl === 'vi'
      ? 'Ảnh lookbook thương mại điện tử thời trang nam chuyên nghiệp, nhân vật là nam giới trưởng thành mặc đầy đủ trang phục gọn gàng, tư thế tự nhiên lịch sự trong bối cảnh studio hoặc đời thường.\n'
      : 'Professional e-commerce menswear lookbook photograph for a clothing catalog. The subject is an adult man, fully clothed in the exact reference garments, keeping natural posture in a tasteful studio or lifestyle setting.\n';
    return frame + prompt;
  }

  // ---- Render Studio UI ----
  function pickRow(a, type, idx){
    const it = a.kind === 'lib' && A.ITEMS[a.k];
    const src = it ? (type === 'pose' ? it.angles[a.ai ?? (it.ai || 0)].t : A.thumbOf(it)) : a.url;
    const t = it ? A.titleOf(it) : (a.name || (isVi()?'Ảnh tải lên':'Uploaded'));
    const sub = it
      ? (type === 'pose' ? `${it.no || ''} · ${isVi()?it.angles[a.ai??0].vi:it.angles[a.ai??0].en}` : (isVi()?it.catVi:it.catEn))
      : (isVi()?'Ảnh cục bộ':'Local image');
    const angSel = type === 'pose' && it && it.angles && it.angles.length > 1
      ? `<select data-ang="${idx}">${it.angles.map((x,j) => `<option value="${j}" ${j===(a.ai??(it.ai||0))?'selected':''}>${esc(isVi()?x.vi:x.en)}</option>`).join('')}</select>`
      : '';
    return `<div class="pick"><img src="${esc(src)}" alt="${esc(t)}"><div><b>${esc(t)}</b><small>${esc(sub)}</small></div>${angSel}<button type="button" class="rmx" data-rm="${type}" data-i="${idx}">×</button></div>`;
  }

  function render(){
    const G = isGen();
    $$('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === W.mode));
    $('#stLead').textContent = G
      ? (isVi()?'Chọn kiểu mẫu nam + trang phục + tư thế để tạo ảnh lookbook hoàn toàn mới.':'Pick a male model preset, outfit & pose to generate a fresh editorial shot.')
      : (isVi()?'Tải ảnh chân dung/toàn thân nam lên, chọn bộ đồ nam & tư thế để thử đồ AI.':'Upload a male photo, pick a menswear outfit & pose for virtual try-on.');
    $('#s1T').textContent = G ? (isVi()?'Mẫu nam / Mặt tham chiếu':'Male Model / Face Ref') : (isVi()?'Ảnh người mẫu nam':'Subject Male Photo');
    $('#s1R').textContent = G ? (isVi()?'Tùy chọn':'Optional') : (isVi()?'Bắt buộc':'Required');

    $('#wbPersons').innerHTML = W.persons.map((p,i) => `<div class="pp"><img src="${p.url}" alt="Person ${i+1}"><small>${p.w}×${p.h}</small><button type="button" class="x" data-rmp="${i}">×</button></div>`).join('');
    $('#wbDrop').classList.toggle('mini', W.persons.length > 0);
    $('#wbDrop').hidden = W.persons.length >= 3;
    $('#wbChar').hidden = !G || hasPerson();
    $('#wbChars').innerHTML = CHARS.map(c => `<button type="button" class="chip ${W.char===c[0]?'on':''}" data-char="${c[0]}">${esc(isVi()?c[1]:c[2])}</button>`).join('');
    $('#wbCharTxt').hidden = W.char !== 'custom';
    $('#wbCharTxt').value = W.charTxt;

    $('#wbG').innerHTML = W.garments.length
      ? W.garments.map((g,i) => pickRow(g, 'costume', i)).join('')
      : `<button type="button" class="empty0" data-pick="costume"><span><b>${isVi()?'Chọn trang phục nam':'Select Menswear Outfit'}</b><small>${isVi()?'Chọn từ 24+ outfit hoặc bấm Tải ảnh đồ':'Pick from library or upload local photo'}</small></span></button>`;

    $('#wbPo').innerHTML = W.poses.length
      ? W.poses.map((p,i) => pickRow(p, 'pose', i)).join('')
      : `<button type="button" class="empty0" data-pick="pose"><span><b>${isVi()?'Chọn tư thế nam (tùy chọn)':'Select Male Pose (optional)'}</b><small>${G?(isVi()?'Không chọn sẽ để AI tự chọn dáng':'Random posture if omitted'):(isVi()?'Không chọn sẽ giữ nguyên dáng ảnh gốc':'Keeps original posture if omitted')}</small></span></button>`;

    $('#wbBatch').hidden = W.poses.length < 2;
    $$('[data-bm]').forEach(b => b.classList.toggle('on', b.dataset.bm === W.bm));
    const singlePose = W.poses.length === 1 && A.ITEMS[W.poses[0].k] && (A.ITEMS[W.poses[0].k].angles || []).length > 1;
    $('#wbAllAng').hidden = !singlePose;

    $('#wbStyles').innerHTML = STYLES.map(s => `<button type="button" class="chip ${W.style===s[0]?'on':''}" data-style="${s[0]}">${esc(isVi()?s[1]:s[2])}</button>`).join('');
    $('#wbKeepBg').checked = W.keepBg;
    $('#wbKeepBg').closest('label').hidden = G || !hasPerson();
    $$('[data-pl]').forEach(b => b.classList.toggle('on', b.dataset.pl === W.pl));

    const hasKey = !!cfg.key;
    $('#wbDot').className = 'dot' + (hasKey ? ' on' : '');
    $('#wbProv').textContent = hasKey ? `${PROV[cfg.prov].name} · ${modelOf()}` : (isVi()?'Chưa cấu hình API':'API Not Configured');
    $('#wbOnb').hidden = hasKey;

    const doneFlags = [G ? true : hasPerson(), W.garments.length > 0, W.poses.length > 0];
    $$('.step[data-s]').forEach(el => el.classList.toggle('done', !!doneFlags[+el.dataset.s - 1]));

    const jobs = nJobs();
    $('#wbEst').textContent = isVi() ? `Sẽ tạo ${jobs} ảnh` : `Will generate ${jobs} image(s)`;
    const need = [!G && !hasPerson() && (isVi()?'tải ảnh nam':'upload photo'), !W.garments.length && (isVi()?'chọn trang phục':'pick outfit')].filter(Boolean);
    $('#wbHint').textContent = !hasKey ? (isVi()?'Cần nhập API Key để chạy':'API Key required to generate') : (isVi()?'~20–40 giây / ảnh':'~20–40s per image');
    if(!W.busy){
      $('#wbGo').disabled = !!need.length;
      $('#wbGo').textContent = need.length ? (isVi()?'Vui lòng ':'Please ') + need.join(' & ') : A.tStr('st_go');
    }
    reprompt();
  }

  // ---- Uploads inside Studio ----
  async function addPersons(files){
    const imgs = [...files].filter(f => /^image\//.test(f.type));
    if(!imgs.length) return toast(isVi()?'Vui lòng chọn file ảnh':'Please choose image files');
    for(const f of imgs){
      if(W.persons.length >= 3){ toast(isVi()?'Tối đa 3 ảnh người mẫu':'Max 3 subject photos'); break; }
      const u = URL.createObjectURL(f);
      try{
        const r = await toJpeg(u, 1536);
        W.persons.push({ blob: r.blob, url: URL.createObjectURL(r.blob), w: r.w, h: r.h });
      }catch(err){ toast(err.message); }
      finally{ URL.revokeObjectURL(u); }
    }
    render();
  }
  async function addPortraitItem(it){
    if(W.persons.length >= 3) return toast(isVi()?'Tối đa 3 ảnh người mẫu':'Max 3 subject photos');
    try{
      const r = await toJpeg(A.bigOf(it), 1536);
      W.persons.push({ blob: r.blob, url: URL.createObjectURL(r.blob), w: r.w, h: r.h, k: it.k });
      render();
      toast(isVi()?'Đã thêm khuôn mặt mẫu nam':'Added male portrait reference');
    }catch(err){ toast(err.message); }
  }

  const drop = $('#wbDrop');
  drop.onclick = () => $('#wbFile').click();
  drop.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); $('#wbFile').click(); } };
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addPersons(e.dataTransfer.files));
  $('#wbFile').onchange = e => { addPersons(e.target.files); e.target.value = ''; };

  $('#wbGFile').onchange = async e => {
    const fs = [...e.target.files].filter(f => /^image\//.test(f.type));
    e.target.value = '';
    if(!fs.length) return;
    W.garments = W.garments.filter(g => g.kind === 'file');
    for(const f of fs.slice(0, 2)){
      const u = URL.createObjectURL(f);
      try{
        const r = await toJpeg(u, 1280);
        W.garments.push({ kind:'file', blob:r.blob, url:URL.createObjectURL(r.blob), name:f.name });
      }catch(err){ toast(err.message); }
      finally{ URL.revokeObjectURL(u); }
    }
    render();
  };

  document.addEventListener('paste', e => {
    if(document.body.classList.contains('studio') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
      const fs = [...e.clipboardData.files].filter(f => /^image\//.test(f.type));
      if(fs.length) addPersons(fs);
    }
  });

  // ---- Studio Clicks & Changes ----
  $('#studio').addEventListener('click', e => {
    const t = e.target; let b;
    if((b = t.closest('[data-rm]'))){
      const i = +b.dataset.i;
      if(b.dataset.rm === 'pose') W.poses.splice(i, 1); else W.garments.splice(i, 1);
      render();
    } else if((b = t.closest('[data-rmp]'))){
      W.persons.splice(+b.dataset.rmp, 1); render();
    } else if((b = t.closest('[data-pick]'))){
      openPicker(b.dataset.pick);
    } else if((b = t.closest('[data-pl]'))){
      W.pl = b.dataset.pl; SV('wbPl', W.pl); reprompt(true); render();
    } else if((b = t.closest('[data-mode]'))){
      W.mode = b.dataset.mode; SV('wbMode', W.mode);
      if(W.mode === 'gen' && W.style === 'keep') W.style = 'studio';
      W.dirty = false; render();
    } else if((b = t.closest('[data-char]'))){
      W.char = b.dataset.char; SV('wbChar', W.char); render();
    } else if((b = t.closest('[data-style]'))){
      W.style = b.dataset.style; SV('wbStyle', W.style); render();
    } else if((b = t.closest('[data-bm]'))){
      W.bm = b.dataset.bm; SV('wbBm', W.bm); render();
    }
  });

  $('#studio').addEventListener('change', e => {
    const s = e.target.closest('[data-ang]');
    if(s){ W.poses[+s.dataset.ang].ai = +s.value; render(); }
    if(e.target.id === 'wbN') render();
    if(e.target.id === 'wbKeepBg'){ W.keepBg = e.target.checked; SV('wbKeepBg', W.keepBg); render(); }
  });

  $('#wbCharTxt').oninput = e => { W.charTxt = e.target.value; SV('wbCharTxt', W.charTxt); reprompt(); };
  $('#wbAllAng').onclick = () => {
    const p = W.poses[0], it = A.ITEMS[p.k];
    if(!it || !it.angles) return;
    W.poses = it.angles.slice(0, 5).map((_, i) => ({ kind:'lib', k:p.k, ai:i }));
    toast(isVi()?`Đã mở đủ ${W.poses.length} góc máy 3D`:`Expanded ${W.poses.length} 3D angles`);
    render();
  };
  $('#wbPrompt').oninput = () => { W.dirty = true; };
  $('#wbExtra').oninput = () => reprompt();
  $('#wbReP').onclick = () => { reprompt(true); toast(isVi()?'Đã cập nhật Prompt theo lựa chọn hiện tại':'Rebuilt prompt'); };
  $('#wbCopyP').onclick = () => A.copyText($('#wbPrompt').value, 'Studio Prompt');

  // ---- Picker Modal ----
  let pkType = 'costume';
  function openPicker(type){
    pkType = type;
    $('#pkT').textContent = type === 'pose'
      ? (isVi()?'Chọn tư thế nam (tối đa 6)':'Pick Male Poses (up to 6)')
      : type === 'portrait'
        ? (isVi()?'Chọn mặt/tóc nam tham chiếu':'Pick Male Portrait Reference')
        : (isVi()?'Chọn trang phục nam':'Pick Menswear Outfit');
    $('#pkDone').hidden = type !== 'pose';
    $('#pk').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#pkQ').value = '';
    drawPicker();
    setTimeout(() => $('#pkQ').focus(), 40);
  }
  function drawPicker(){
    const q = $('#pkQ').value.toLowerCase().trim();
    const list = (A.DATA[pkType] || []).filter(it => !q || (A.titleOf(it) + ' ' + it.en + ' ' + (it.catVi || '') + ' ' + (it.catEn || '')).toLowerCase().includes(q));
    const sel = new Set(W.poses.map(p => p.k));
    $('#pkG').innerHTML = list.length
      ? list.map(it => `<button type="button" data-pkk="${esc(it.k)}" class="${sel.has(it.k)?'on':''}"><img loading="lazy" src="${esc(A.thumbOf(it))}" alt="${esc(A.titleOf(it))}"><span>${esc(A.titleOf(it))}</span></button>`).join('')
      : `<p class="fine">${isVi()?'Không tìm thấy mục nào':'No matching items'}</p>`;
  }
  const closePicker = () => { $('#pk').hidden = true; document.body.style.overflow = ''; render(); };
  $('#pkQ').oninput = drawPicker;
  $('#pkX').onclick = closePicker;
  $('#pkDone').onclick = closePicker;
  $('#pk').onclick = e => {
    if(e.target.id === 'pk') return closePicker();
    const b = e.target.closest('[data-pkk]');
    if(!b) return;
    const k = b.dataset.pkk;
    if(pkType === 'pose'){
      const idx = W.poses.findIndex(p => p.k === k);
      if(idx >= 0) W.poses.splice(idx, 1);
      else if(W.poses.length >= 6) return toast(isVi()?'Tối đa 6 tư thế':'Max 6 poses');
      else W.poses.push({ kind:'lib', k, ai: A.ITEMS[k].ai || 0 });
      b.classList.toggle('on', idx < 0);
    } else if(pkType === 'portrait'){
      closePicker(); addPortraitItem(A.ITEMS[k]);
    } else {
      W.garments = [{ kind:'lib', k }];
      closePicker();
    }
  };

  // ---- API Config Modal ----
  function cfgFill(){
    $$('[name=prov]').forEach(r => r.checked = r.value === cfg.prov);
    const P = PROV[cfg.prov];
    $('#cfBase').value = cfg.base;
    $('#cfBase').placeholder = P.base || 'https://your-relay.com/v1';
    $('#cfKey').value = cfg.key;
    $('#cfModel').value = cfg.model;
    $('#cfModel').placeholder = P.model;
    $('#cfModels').innerHTML = P.models.map(m => `<option value="${m}">`).join('');
    $('#cfProto').value = cfg.proto;
    $('#cfField').value = cfg.field;
    $('#cfProtoW').hidden = cfg.prov !== 'custom';
    $('#cfFieldW').hidden = !(cfg.prov === 'custom' && cfg.proto === 'edits');
    $('#cfProxy').checked = cfg.proxy;
    $('#cfHelp').textContent = ({
      openai: isVi()?'Tạo Key tại platform.openai.com/api-keys (gpt-image-1 cần tổ chức đã xác minh).':'Create key at platform.openai.com/api-keys.',
      gemini: isVi()?'Lấy API Key miễn phí tại Google AI Studio (aistudio.google.com/apikey).':'Get key at Google AI Studio (aistudio.google.com/apikey).',
      seedream: isVi()?'Dùng API Key từ Volcengine Ark; nên bật chuyển tiếp /api/proxy nếu gặp lỗi CORS.':'Uses Volcengine Ark key; enable /api/proxy for CORS.',
      custom: isVi()?'Nhập Base URL (kết thúc bằng /v1) và chọn đúng Protocol của dịch vụ trung chuyển.':'Enter OpenAI-compatible Base URL & select protocol.'
    })[cfg.prov] || '';
    $('#cfMsg').textContent = '';
    $('#cfMsg').className = 'fine';
  }
  function cfgRead(){
    return {
      prov: ($('[name=prov]:checked') || {}).value || 'openai',
      base: $('#cfBase').value.trim(),
      key: $('#cfKey').value.trim(),
      model: $('#cfModel').value.trim(),
      proto: $('#cfProto').value,
      field: $('#cfField').value,
      proxy: $('#cfProxy').checked
    };
  }
  function cfMsg(t, bad){ const m = $('#cfMsg'); m.textContent = t; m.className = 'fine ' + (bad ? 'bad' : 'good'); }
  const openCfg = () => { cfgFill(); $('#cfg').hidden = false; document.body.style.overflow = 'hidden'; };
  const closeCfg = () => { $('#cfg').hidden = true; document.body.style.overflow = ''; };
  $('#wbCfg').onclick = openCfg;
  $('#wbOnbGo').onclick = openCfg;
  $('#cfgX').onclick = closeCfg;
  $('#cfg').onclick = e => { if(e.target.id === 'cfg') closeCfg(); };
  $$('[name=prov]').forEach(r => r.onchange = () => {
    const o = cfgRead();
    Object.assign(cfg, o, { base:'', model:'' });
    if(o.prov === 'seedream') cfg.proxy = true;
    cfgFill();
  });
  $('#cfProto').onchange = () => { cfg.proto = $('#cfProto').value; $('#cfFieldW').hidden = cfg.proto !== 'edits'; };
  $('#cfEye').onclick = () => { const k = $('#cfKey'); k.type = k.type === 'password' ? 'text' : 'password'; $('#cfEye').textContent = k.type === 'password' ? (isVi()?'Hiện':'Show') : (isVi()?'Ẩn':'Hide'); };
  $('#cfSave').onclick = () => {
    const o = cfgRead();
    if(o.prov === 'custom' && !o.base) return cfMsg(isVi()?'Cần nhập Base URL cho Custom Relay':'Base URL required for Custom relay', true);
    Object.assign(cfg, o); SV('wbCfg', cfg); render(); closeCfg();
    toast(isVi()?'Đã lưu cài đặt API trên trình duyệt':'API settings saved locally');
  };
  $('#cfClr').onclick = () => { cfg.key = ''; $('#cfKey').value = ''; SV('wbCfg', cfg); render(); cfMsg(isVi()?'Đã xóa API Key khỏi thiết bị':'Key cleared from browser'); };

  // ---- Provider API Calls ----
  const OFF_HOST = /^(api\.openai\.com|generativelanguage\.googleapis\.com|ark\.[a-z0-9-]+\.(volces|bytepluses)\.com)$/;
  const authHeaders = () => cfg.prov === 'gemini' ? { 'x-goog-api-key': cfg.key } : { Authorization: 'Bearer ' + cfg.key };
  function callAPI(url, opts){
    let hn = ''; try{ hn = new URL(url).hostname; }catch(e){}
    const isCustom = cfg.prov === 'custom' || !OFF_HOST.test(hn);
    if(!cfg.proxy && !isCustom) return fetch(url, opts);
    const h = new Headers(opts.headers || {});
    h.set('x-target-url', url);
    if(isCustom) h.set('x-proxy-custom', '1');
    return fetch('/api/proxy', Object.assign({}, opts, { headers: h }));
  }

  $('#cfTest').onclick = async () => {
    const o = cfgRead();
    if(!o.key) return cfMsg(isVi()?'Vui lòng nhập API Key trước':'Please enter an API Key first', true);
    const old = Object.assign({}, cfg);
    Object.assign(cfg, o);
    cfMsg(isVi()?'Đang kiểm tra kết nối...':'Testing connection...');
    try{
      const isGem = cfg.prov === 'gemini';
      const url = isGem ? `${rootUrl()}/models/${encodeURIComponent(modelOf())}` : `${rootUrl()}/models`;
      const r = await callAPI(url, { method:'GET', headers:authHeaders() });
      const j = await r.json().catch(() => null);
      if(!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
      cfMsg(isVi()?`Kết nối thành công tới ${PROV[cfg.prov].name} (${modelOf()})!`:`Connected to ${PROV[cfg.prov].name} (${modelOf()})!`);
    }catch(err){
      cfMsg((isVi()?'Lỗi kết nối: ':'Connection failed: ') + err.message, true);
    } finally { Object.assign(cfg, old); }
  };

  const AR_SIZE = { auto:null, '2:3':'1024x1536', '3:4':'1024x1536', '9:16':'1024x1536', '1:1':'1024x1024', '4:3':'1536x1024', '16:9':'1536x1024' };
  const SD_SIZE = { auto:'1728x2304', '2:3':'1664x2496', '3:4':'1728x2304', '9:16':'1440x2560', '1:1':'2048x2048', '4:3':'2304x1728', '16:9':'2560x1440' };
  const b64ToBlob = async d => (await fetch('data:image/png;base64,' + d)).blob();

  async function extractOpenAIImg(j){
    const d = j && j.data && j.data[0];
    if(!d) throw new Error((j && j.error && j.error.message) || 'No image data returned');
    if(d.b64_json) return b64ToBlob(d.b64_json);
    let r = await fetch(d.url).catch(() => null);
    if(!r || !r.ok) r = await fetch('/api/proxy', { headers:{ 'x-target-url': d.url, 'x-proxy-kind': 'image' } }).catch(() => null);
    if(r && r.ok) return r.blob();
    throw new Error('Could not fetch result image URL: ' + d.url);
  }

  async function genOnce(imgs, prompt, sig){
    const ar = $('#wbAR').value, m = modelOf(), P = proto();
    if(P === 'gemini'){
      const parts = [{ text: prompt }];
      for(const b of imgs) parts.push({ inline_data:{ mime_type: b.type || 'image/jpeg', data: await blobToB64(b) } });
      const gc = { responseModalities:['TEXT','IMAGE'] };
      if(ar !== 'auto') gc.imageConfig = { aspectRatio: ar };
      const r = await callAPI(`${rootUrl()}/models/${encodeURIComponent(m)}:generateContent`, {
        method:'POST', signal:sig, headers:Object.assign({'Content-Type':'application/json'}, authHeaders()),
        body: JSON.stringify({ contents:[{ role:'user', parts }], generationConfig:gc })
      });
      const j = await r.json().catch(() => null);
      if(!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
      const ps = ((j && j.candidates) || []).flatMap(c => (c.content && c.content.parts) || []);
      const im = ps.find(p => (p.inlineData || p.inline_data || {}).data);
      if(!im) throw new Error('Model returned no image (possibly filtered or text-only response).');
      const d = im.inlineData || im.inline_data;
      return { blob: await (await fetch(`data:${d.mimeType||d.mime_type||'image/png'};base64,${d.data}`)).blob() };
    }
    if(P === 'seedream' || P === 'json'){
      const body = { model:m, prompt, n:1, size: P==='seedream'?(SD_SIZE[ar]||SD_SIZE.auto):(AR_SIZE[ar]||'1024x1536'), response_format:'b64_json' };
      if(imgs.length) body.image = await Promise.all(imgs.map(dataURL));
      const r = await callAPI(`${rootUrl()}/images/generations`, {
        method:'POST', signal:sig, headers:Object.assign({'Content-Type':'application/json'}, authHeaders()), body:JSON.stringify(body)
      });
      const j = await r.json().catch(() => null);
      if(!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
      return { blob: await extractOpenAIImg(j) };
    }
    if(P === 'xai'){
      const body = { model:m, prompt, n:1, response_format:'b64_json' };
      if(ar !== 'auto') body.aspect_ratio = ar;
      const used = imgs.slice(0, 5);
      if(used.length){
        const us = await Promise.all(used.map(dataURL));
        if(us.length === 1) body.image = { url: us[0] }; else body.images = us.map(u => ({ url: u }));
      }
      const r = await callAPI(`${rootUrl()}/images/${used.length?'edits':'generations'}`, {
        method:'POST', signal:sig, headers:Object.assign({'Content-Type':'application/json'}, authHeaders()), body:JSON.stringify(body)
      });
      const j = await r.json().catch(() => null);
      if(!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
      return { blob: await extractOpenAIImg(j) };
    }
    // OpenAI images/edits multipart
    const fd = new FormData();
    fd.append('model', m); fd.append('prompt', prompt); fd.append('n', '1');
    fd.append('size', AR_SIZE[ar] || 'auto');
    const fld = cfg.prov === 'custom' ? cfg.field : 'image[]';
    imgs.forEach((b, i) => fd.append(fld, b, `ref-${i+1}.jpg`));
    const r = await callAPI(`${rootUrl()}/images/edits`, { method:'POST', signal:sig, headers:authHeaders(), body:fd });
    const j = await r.json().catch(() => null);
    if(!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
    return { blob: await extractOpenAIImg(j) };
  }

  // ---- IndexedDB History ----
  let hdbp;
  const hdb = () => hdbp || (hdbp = new Promise((res, rej) => {
    const q = indexedDB.open('pw-men-studio-hist', 1);
    q.onupgradeneeded = () => { if(!q.result.objectStoreNames.contains('h')) q.result.createObjectStore('h', { keyPath:'t' }); };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  }));
  const htx = async (m, fn) => {
    const d = await hdb();
    return new Promise((res, rej) => {
      const t = d.transaction('h', m), q = fn(t.objectStore('h'));
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error);
    });
  };
  async function saveHist(rec){
    try{
      await htx('readwrite', s => s.put(rec));
      const keys = await htx('readonly', s => s.getAllKeys());
      if(keys.length > 30) await htx('readwrite', s => keys.slice(0, keys.length - 30).forEach(k => s.delete(k)));
    }catch(e){}
  }
  let histUrls = [];
  async function renderHist(){
    let list = [];
    try{ list = (await htx('readonly', s => s.getAll())) || []; }catch(e){}
    list.sort((a,b) => b.t - a.t);
    histUrls.forEach(URL.revokeObjectURL); histUrls = [];
    W.hist = list;
    $('#wbHist').innerHTML = list.length
      ? list.map(r => {
          const u = URL.createObjectURL(r.after); histUrls.push(u);
          return `<button type="button" data-ht="${r.t}"><img src="${u}" alt="History"><i data-hdel="${r.t}">×</i></button>`;
        }).join('')
      : `<p class="fine" style="margin:0">${isVi()?'Chưa có lịch sử tạo ảnh':'No generation history yet'}</p>`;
  }

  // ---- Results & Run ----
  const resMap = new Map();
  const objUrl = b => { if(!resMap.has(b)) resMap.set(b, URL.createObjectURL(b)); return resMap.get(b); };
  function setSplit(x){ $('#wbCmp').style.setProperty('--x', x + '%'); $('#wbRange').value = x; }
  $('#wbRange').oninput = e => setSplit(e.target.value);

  function showResult(i){
    const r = W.results[i];
    if(!r) return;
    W.ri = i;
    const hasB = !!r.before;
    $('#wbAfter').src = objUrl(r.after);
    if(hasB) $('#wbBefore').src = objUrl(r.before);
    $('#wbCmp').hidden = false;
    $('#wbCmp').classList.toggle('solo', !hasB || !W.cmp);
    $('#wbCmpT').hidden = !hasB;
    $('#wbPh0').hidden = true;
    $('#wbErr').hidden = true;
    $('#wbOutAct').hidden = false;
    $('#wbZip').hidden = W.results.length < 2;
    $('#wbMeta').textContent = `${(PROV[r.prov]||{}).name || r.prov} · ${r.model}`;
    setSplit(50);
    const R = $('#wbRes');
    R.hidden = W.results.length < 2;
    R.innerHTML = W.results.map((x,j) => `<button type="button" data-ri="${j}" class="${j===i?'on':''}"><img src="${objUrl(x.after)}" alt="Res ${j+1}"></button>`).join('');
  }

  let tick;
  async function runGen(){
    if(!cfg.key){ toast(isVi()?'Vui lòng cài đặt API Key trước':'Please configure API Key first'); return openCfg(); }
    if(!isGen() && !hasPerson()) return toast(isVi()?'Cần tải ảnh mẫu nam trước':'Upload a male photo first');
    if(!W.garments.length) return toast(isVi()?'Cần chọn trang phục nam':'Select a menswear outfit first');

    const ac = new AbortController();
    W.busy = ac;
    $('#wbErr').hidden = true; $('#wbWarn').hidden = true;
    $('#wbBusy').hidden = false; $('#wbGo').disabled = true;
    const t0 = Date.now();
    let pr = 0.05;
    tick = setInterval(() => {
      pr = Math.min(0.92, pr + (0.92 - pr) * 0.04);
      $('#wbProg').style.transform = `scaleX(${pr})`;
      $('#wbTime').textContent = Math.round((Date.now() - t0) / 1000) + 's';
    }, 250);

    try{
      $('#wbStage1').textContent = isVi()?'Đang chuẩn bị ảnh tham chiếu (SVG -> JPEG)...':'Preparing reference images...';
      const pb = W.persons.map(p => p.blob);
      const gb = await Promise.all(W.garments.map(assetBlob));
      const sets = W.poses.length > 1 && W.bm === 'each' ? W.poses.map(p => [p]) : [W.poses];
      const n = +$('#wbN').value || 1;
      const jobs = [];
      sets.forEach(s => { for(let i=0;i<n;i++) jobs.push(s); });

      const got = [];
      for(let j = 0; j < jobs.length; j++){
        if(ac.signal.aborted) throw Object.assign(new Error('Aborted'), { name:'AbortError' });
        $('#wbStage1').textContent = isVi()?`AI đang vẽ (${j+1}/${jobs.length})...`:`Generating (${j+1}/${jobs.length})...`;
        const poseBlobs = await Promise.all(jobs[j].map(assetBlob));
        const basePrompt = W.dirty && sets.length === 1 ? $('#wbPrompt').value.trim() : compose(jobs[j]);
        const finalPrompt = $('#wbNeutral').checked ? neutralize(basePrompt) : basePrompt;
        const r = await genOnce([...pb, ...gb, ...poseBlobs], finalPrompt, ac.signal);
        const rec = { t: Date.now() + j, prov: cfg.prov, model: modelOf(), prompt: finalPrompt, before: pb[0] || null, after: r.blob };
        got.push(rec);
        await saveHist(rec);
        W.results = got.slice();
        showResult(got.length - 1);
      }
      await renderHist();
      toast(isVi()?`Hoàn tất ${got.length} ảnh!`:`Generated ${got.length} image(s)!`);
    }catch(err){
      if(err.name === 'AbortError'){
        toast(isVi()?'Đã hủy tạo ảnh':'Cancelled');
      } else {
        $('#wbErr').hidden = false;
        $('#wbErr').innerHTML = `<b>${isVi()?'Lỗi tạo ảnh AI':'Generation Error'}</b><p>${esc(err.message)}</p>
          <div class="row"><button type="button" class="sm" id="wbRetry">${isVi()?'Thử lại':'Retry'}</button><button type="button" class="sm ghost" id="wbOpenCfgErr">${isVi()?'Kiểm tra API':'Check API'}</button></div>`;
      }
    } finally {
      clearInterval(tick);
      $('#wbBusy').hidden = true;
      W.busy = null;
      render();
    }
  }

  $('#wbStage').addEventListener('click', e => {
    if(e.target.id === 'wbRetry') runGen();
    if(e.target.id === 'wbOpenCfgErr') openCfg();
  });
  $('#wbGo').onclick = runGen;
  $('#wbAgain').onclick = runGen;
  $('#wbStop').onclick = () => W.busy && W.busy.abort();
  $('#wbRes').onclick = e => { const b = e.target.closest('[data-ri]'); if(b) showResult(+b.dataset.ri); };
  $('#wbCmpT').onclick = () => { W.cmp = !W.cmp; showResult(W.ri); };
  $('#wbDl').onclick = () => {
    const r = W.results[W.ri];
    if(r) A.dlBlob(r.after, `posewear-men-studio-${Date.now()}.png`);
  };
  $('#wbZip').onclick = async () => {
    if(!window.makeZip || !W.results.length) return;
    const files = W.results.map((r,i) => ({ name:`posewear-men-${i+1}.png`, blob:r.after }));
    A.dlBlob(await window.makeZip(files), `posewear-men-studio-${files.length}.zip`);
  };
  $('#wbUse').onclick = async () => {
    const r = W.results[W.ri]; if(!r) return;
    const x = await toJpeg(objUrl(r.after), 1536);
    W.persons = [{ blob:x.blob, url:URL.createObjectURL(x.blob), w:x.w, h:x.h }];
    W.mode = 'tryon'; render();
    toast(isVi()?'Đã dùng kết quả làm ảnh gốc mới':'Set result as new subject photo');
  };
  $('#wbHist').onclick = async e => {
    const del = e.target.closest('[data-hdel]');
    if(del){
      e.stopPropagation();
      const t = +del.dataset.hdel;
      const oldRec = W.hist.find(x => x.t === t);
      await htx('readwrite', s => s.delete(t));
      await renderHist();
      if(oldRec) toast(isVi()?'Đã xóa 1 mục lịch sử':'Deleted history item', async () => { await saveHist(oldRec); renderHist(); });
      return;
    }
    const b = e.target.closest('[data-ht]');
    if(!b) return;
    const r = W.hist.find(x => x.t === +b.dataset.ht);
    if(r){ W.results = [r]; showResult(0); }
  };
  $('#wbHClr').onclick = async () => {
    if(!W.hist.length) return;
    const old = W.hist.slice();
    await htx('readwrite', s => s.clear());
    await renderHist();
    toast(isVi()?'Đã xóa lịch sử Studio':'Cleared Studio history', async () => { for(const r of old) await saveHist(r); renderHist(); });
  };

  addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      if(!$('#pk').hidden) closePicker();
      else if(!$('#cfg').hidden) closeCfg();
    }
  });

  // Expose Studio bridge
  window.WB = {
    async show(){ await renderHist(); render(); },
    render,
    async pick(it){
      if(it.type === 'pose'){
        if(!W.poses.some(p => p.k === it.k)){
          if(W.poses.length >= 6) W.poses.shift();
          W.poses.push({ kind:'lib', k:it.k, ai:it.ai || 0 });
        }
        toast(isVi()?`Đã đưa tư thế vào Studio (${W.poses.length})`:`Added pose to Studio (${W.poses.length})`);
      } else if(it.type === 'portrait'){
        await addPortraitItem(it);
      } else {
        W.garments = [{ kind:'lib', k:it.k }];
        toast(isVi()?'Đã chọn trang phục vào Studio':'Selected outfit for Studio');
      }
      A.setTab('studio');
    }
  };
})();
