'use strict';
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const LS = k => { try{ return JSON.parse(localStorage.getItem('pw_' + k) || 'null'); }catch(e){ return null; } };
  const SV = (k, v) => { try{ localStorage.setItem('pw_' + k, JSON.stringify(v)); }catch(e){} };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Bilingual UI Dictionary (VI / EN) ----
  const I18N = {
    vi: {
      tab_pose: 'Tư thế Nam', tab_cos: 'Trang phục Nam', tab_por: 'Tóc & Mặt Nam',
      tab_stu: 'Thử đồ AI', tab_fav: 'Yêu thích', tab_rec: 'Gần đây',
      btn_upload: '+ Tải ảnh / JSON',
      intro_title: 'PoseWear phiên bản Nam (VI/EN)',
      intro_desc: 'Sẵn 24 tư thế nam 3D SVG (120 góc máy), 24 outfit nam, 12 kiểu tóc/chân dung nam. Hỗ trợ tải thêm ảnh thật hoặc nhập JSON tùy biến và thử đồ AI bằng API Key cá nhân.',
      intro_cta: 'Mở Studio AI',
      search_ph: 'Tìm tư thế, trang phục, màu sắc, kiểu tóc...',
      btn_clear_filter: 'Xóa lọc', btn_exp_fav: 'Xuất JSON', btn_imp_fav: 'Nhập JSON',
      btn_clr: 'Xóa hết', btn_clr_rec: 'Xóa lịch sử', btn_filter: 'Bộ lọc', btn_batch: 'Chọn nhiều',
      sort_def: 'Mặc định', sort_rev: 'Mới nhất / Đảo ngược', sort_fav: 'Ưu tiên Yêu thích', sort_shuf: 'Xáo trộn ngẫu nhiên',
      btn_rand: 'Ngẫu nhiên', btn_reset: 'Đặt lại bộ lọc', btn_copy: 'Copy', btn_cancel: 'Hủy', btn_close: 'Đóng',
      btn_clear_form: 'Xóa biểu mẫu',
      tray_cp_en: 'Copy Prompt Anh', tray_cp_vi: 'Copy mô tả Việt', tray_stu: 'Đưa vào Studio',
      bb_all: 'Chọn tất', bb_fav: 'Yêu thích', bb_unfav: 'Bỏ thích', bb_cp: 'Copy Prompt', bb_zip: 'Tải ZIP', bb_stu: 'Vào Studio', bb_done: 'Xong',
      imp_title: 'Quản lý kho dữ liệu Nam (Tải ảnh / Nhập JSON)',
      imp_tab_img: 'Tải ảnh cục bộ lên', imp_tab_json: 'Nhập / Xuất JSON',
      imp_target: 'Lưu vào mục', imp_cat: 'Phân loại', imp_tivi: 'Tiêu đề tiếng Việt',
      imp_tien: 'English Title / Prompt', imp_descvi: 'Mô tả tiếng Việt (tùy chọn)',
      imp_drop_img: 'Chọn hoặc kéo thả 1 hoặc nhiều ảnh (JPG/PNG/WebP/SVG)',
      imp_drop_sub: 'Lưu vĩnh viễn trong trình duyệt (IndexedDB), dùng được ngay cho Studio & Copy Prompt',
      imp_save_img: 'Lưu ảnh vào thư viện',
      imp_json_help: 'Hỗ trợ nhập file JSON theo định dạng PoseWear Men (VI/EN) hoặc file JSON từ repo GitHub gốc (poses.json, costumes.json, items.json). Hệ thống tự động ánh xạ và chống trùng ID.',
      imp_dl_sample: 'Tải file JSON mẫu', imp_exp_custom: 'Xuất dữ liệu đã thêm', imp_exp_all: 'Xuất toàn bộ kho JSON', imp_clr_custom: 'Xóa dữ liệu tự thêm',
      imp_json_type: 'Mục mặc định nếu JSON không ghi type', imp_json_file: 'Chọn tệp .json từ máy',
      imp_json_paste: 'Hoặc dán trực tiếp nội dung JSON vào đây', imp_run_json: 'Nhập JSON vào thư viện',
      st_mode_tryon: 'Thử đồ từ ảnh thật', st_mode_gen: 'Tạo mẫu nam mới',
      st_pick_por: 'Chọn từ kho', st_drop_p: 'Tải ảnh nam lên hoặc Ctrl+V', st_drop_p_sub: 'JPG / PNG / WebP · Tối đa 3 ảnh',
      st_s2: 'Trang phục nam', st_req: 'Bắt buộc', st_up_cos: 'Tải ảnh đồ', st_pick_cos: 'Chọn từ kho',
      st_s3: 'Tư thế nam (SVG / Ảnh)', st_opt: 'Tùy chọn', st_pick_pose: 'Chọn tư thế',
      st_expand_ang: 'Mở đủ 5 góc máy', st_bm_each: 'Mỗi tư thế 1 ảnh', st_bm_sheet: 'Ghép lưới 1 ảnh',
      st_onb_t: 'Chưa cấu hình API Key (BYOK)', st_onb_p: 'Key lưu cục bộ trong trình duyệt, hỗ trợ OpenAI, Gemini, Seedream và Relay tùy chỉnh. Bạn vẫn có thể tạo & copy Prompt miễn phí.',
      st_cfg_btn: 'Cài đặt API', st_stage_t: 'Khu vực xem kết quả thử đồ AI',
      st_stage_p: 'Chọn ảnh/mẫu nam, trang phục & tư thế rồi bấm Tạo ảnh — hoặc copy Prompt ở cột phải để dùng với Midjourney / Flux / Gemini.',
      st_before: 'Ảnh gốc', st_after: 'Kết quả', st_dl: 'Tải PNG', st_zip: 'Tải ZIP', st_cmp: 'Tắt so sánh',
      st_use_as: 'Dùng làm ảnh gốc', st_again: 'Tạo lại', st_edit: 'Cài đặt',
      st_style_lab: 'Phong cách ánh sáng & bối cảnh', st_ar: 'Tỷ lệ', st_cnt: 'Số ảnh', st_keep_bg: 'Giữ bối cảnh ảnh gốc',
      st_prompt_title: 'Prompt tự động (EN/VI)', st_prompt_sub: 'Bấm copy dùng ngay', st_rep: 'Tạo lại',
      st_neutral: 'Giảm chặn nhầm kiểm duyệt', st_neutral_sub: 'Viết lại mô tả theo văn phong lookbook thương mại trung tính khi gọi API.',
      st_hist: 'Lịch sử tạo (IndexedDB)', st_go: 'Tạo ảnh AI',
      cfg_title: 'Cài đặt API (BYOK · Lưu cục bộ)', cfg_proxy: 'Chuyển tiếp qua /api/proxy (Cloudflare Pages)',
      cfg_proxy_sub: 'Bật khi gặp lỗi CORS (ví dụ Seedream hoặc Relay không mở CORS).',
      cfg_test: 'Kiểm tra kết nối', cfg_clr: 'Xóa Key', cfg_save: 'Lưu cài đặt',
      help_title: 'Phím tắt & Hướng dẫn nhanh', hk_q: 'Tập trung ô tìm kiếm', hk_tabs: 'Chuyển nhanh 6 tab chính',
      hk_rand: 'Mở ngẫu nhiên 1 mẫu', hk_theme: 'Chuyển Sáng / Tối', hk_lang: 'Chuyển nhanh Việt / Anh',
      hk_nav: 'Chuyển ảnh trong Lightbox', hk_ang: 'Đổi 5 góc máy 3D tư thế nam', hk_act: 'Yêu thích / Ghép combo / Copy Prompt',
      foot_about: 'Phiên bản tiếng Việt / Anh dành riêng cho nam giới, xây dựng theo kiến trúc của atuizz/posewear (MIT). Tích hợp sẵn khung hình khối tư thế nam 3D SVG, outfit nam, chân dung tóc nam, công cụ tải ảnh/nhập JSON cục bộ và AI Try-On Studio BYOK.',
      foot_feat: 'Tính năng chính', foot_f1: '• 24 tư thế nam × 5 góc máy 3D SVG (xuất PNG sắc nét)',
      foot_f2: '• 24 outfit nam (Streetwear, Suit, Smart Casual, Gym...)',
      foot_f3: '• Tải ảnh cục bộ & Nhập/Xuất JSON lưu IndexedDB',
      foot_f4: '• Ghép Combo Prompt Anh/Việt 1 chạm cho Midjourney/Flux/Gemini',
      foot_priv: 'Quyền riêng tư & Nguồn',
      foot_priv_p: '100% chạy tĩnh trên trình duyệt (không backend, không thu thập dữ liệu). Ảnh tải lên, lịch sử tạo ảnh và API Key chỉ lưu cục bộ trên thiết bị của bạn. Kiến trúc tham khảo từ dự án mã nguồn mở PoseWear (MIT).',
      all: 'Tất cả', undo: 'Hoàn tác'
    },
    en: {
      tab_pose: 'Men Poses', tab_cos: 'Men Outfits', tab_por: 'Men Portraits',
      tab_stu: 'AI Try-On', tab_fav: 'Favorites', tab_rec: 'Recent',
      btn_upload: '+ Upload / JSON',
      intro_title: 'PoseWear Men Edition (VI/EN)',
      intro_desc: 'Built-in 24 3D SVG male poses (120 camera angles), 24 menswear outfits, and 12 male hair/face references. Upload your own photos or import JSON datasets and use the BYOK AI Try-On Studio.',
      intro_cta: 'Open AI Studio',
      search_ph: 'Search poses, outfits, colors, hairstyles...',
      btn_clear_filter: 'Clear', btn_exp_fav: 'Export JSON', btn_imp_fav: 'Import JSON',
      btn_clr: 'Clear all', btn_clr_rec: 'Clear history', btn_filter: 'Filters', btn_batch: 'Batch',
      sort_def: 'Default', sort_rev: 'Newest / Reverse', sort_fav: 'Favorites first', sort_shuf: 'Shuffle',
      btn_rand: 'Random', btn_reset: 'Reset filters', btn_copy: 'Copy', btn_cancel: 'Cancel', btn_close: 'Close',
      btn_clear_form: 'Clear form',
      tray_cp_en: 'Copy EN Prompt', tray_cp_vi: 'Copy VI Desc', tray_stu: 'Send to Studio',
      bb_all: 'Select all', bb_fav: 'Favorite', bb_unfav: 'Unfavorite', bb_cp: 'Copy Prompts', bb_zip: 'Download ZIP', bb_stu: 'To Studio', bb_done: 'Done',
      imp_title: 'Men Library Manager (Upload Images / JSON)',
      imp_tab_img: 'Upload Local Images', imp_tab_json: 'Import / Export JSON',
      imp_target: 'Target Gallery', imp_cat: 'Category', imp_tivi: 'Vietnamese Title',
      imp_tien: 'English Title / Prompt', imp_descvi: 'Vietnamese Description (optional)',
      imp_drop_img: 'Drop or pick 1+ images (JPG/PNG/WebP/SVG)',
      imp_drop_sub: 'Saved locally in browser IndexedDB — ready for filters, Studio & prompts immediately',
      imp_save_img: 'Save Images to Library',
      imp_json_help: 'Supports PoseWear Men VI/EN JSON and original atuizz/posewear JSON files (poses.json, costumes.json, items.json). Auto-maps fields and updates existing IDs idempotently.',
      imp_dl_sample: 'Download Sample JSON', imp_exp_custom: 'Export Custom Items', imp_exp_all: 'Export Full Library', imp_clr_custom: 'Clear Custom Items',
      imp_json_type: 'Default type if omitted in JSON', imp_json_file: 'Choose .json file',
      imp_json_paste: 'Or paste raw JSON here', imp_run_json: 'Import JSON to Library',
      st_mode_tryon: 'Virtual Try-On', st_mode_gen: 'Generate Male Model',
      st_pick_por: 'From library', st_drop_p: 'Upload male photo or Ctrl+V', st_drop_p_sub: 'JPG / PNG / WebP · Up to 3 photos',
      st_s2: 'Men Outfit', st_req: 'Required', st_up_cos: 'Upload outfit', st_pick_cos: 'From library',
      st_s3: 'Male Pose (SVG / Photo)', st_opt: 'Optional', st_pick_pose: 'Pick pose',
      st_expand_ang: 'Expand all 5 angles', st_bm_each: '1 image per pose', st_bm_sheet: 'Grid sheet',
      st_onb_t: 'API Key not configured (BYOK)', st_onb_p: 'Keys stay in localStorage. Supports OpenAI, Gemini, Seedream & Custom/xAI relays. Prompt composition & copying is always free.',
      st_cfg_btn: 'API Settings', st_stage_t: 'AI Try-On Preview Stage',
      st_stage_p: 'Pick a person/model, outfit & pose then click Generate — or copy the composed Prompt on the right for Midjourney / Flux / Gemini.',
      st_before: 'Original', st_after: 'Result', st_dl: 'Download PNG', st_zip: 'Download ZIP', st_cmp: 'Toggle Compare',
      st_use_as: 'Use as Subject', st_again: 'Regenerate', st_edit: 'Config',
      st_style_lab: 'Lighting & Editorial Look', st_ar: 'Ratio', st_cnt: 'Count', st_keep_bg: 'Keep original background',
      st_prompt_title: 'Auto Prompt (EN/VI)', st_prompt_sub: '1-click copy', st_rep: 'Rebuild',
      st_neutral: 'Reduce false safety blocks', st_neutral_sub: 'Rewrites prompt into neutral lookbook phrasing before API calls.',
      st_hist: 'Local History (IndexedDB)', st_go: 'Generate AI Image',
      cfg_title: 'API Settings (BYOK · Stored Locally)', cfg_proxy: 'Forward via /api/proxy (Cloudflare Pages)',
      cfg_proxy_sub: 'Enable when hitting CORS issues (e.g. Seedream or custom relays).',
      cfg_test: 'Test Connection', cfg_clr: 'Clear Key', cfg_save: 'Save Settings',
      help_title: 'Keyboard Shortcuts & Quick Guide', hk_q: 'Focus search bar', hk_tabs: 'Switch 6 main tabs',
      hk_rand: 'Open random item', hk_theme: 'Toggle Light / Dark', hk_lang: 'Toggle VI / EN',
      hk_nav: 'Prev / Next in Lightbox', hk_ang: 'Cycle 5 3D camera angles', hk_act: 'Favorite / Add to combo / Copy Prompt',
      foot_about: 'Bilingual Vietnamese / English Men Edition inspired by atuizz/posewear (MIT). Includes 3D SVG male mannequins, menswear outfits, male portraits, local image/JSON manager and BYOK AI Try-On Studio.',
      foot_feat: 'Highlights', foot_f1: '• 24 male poses × 5 true 3D SVG angles (export crisp PNG)',
      foot_f2: '• 24 menswear outfits (Streetwear, Suit, Smart Casual, Gym...)',
      foot_f3: '• Local image upload & JSON import/export via IndexedDB',
      foot_f4: '• 1-click EN/VI Combo Prompt builder for Midjourney/Flux/Gemini',
      foot_priv: 'Privacy & Credits',
      foot_priv_p: '100% client-side static web app. Uploaded photos, generation history, and API keys never leave your browser except to the provider you choose. Built on PoseWear (MIT) architecture.',
      all: 'All', undo: 'Undo'
    }
  };

  const TABS = ['pose','costume','portrait','studio','fav','recent'];
  const PFX = { pose:'p:', costume:'c:', portrait:'r:' };
  const COL_VI = { black:'Đen', white:'Trắng', navy:'Xanh Navy', grey:'Xám', beige:'Be', olive:'Xanh rêu', brown:'Nâu', blue:'Xanh dương', cream:'Kem', green:'Xanh lá', red:'Đỏ' };
  const ITEM_VI = { hoodie:'Hoodie', 'cargo pants':'Quần Cargo', sneakers:'Sneaker', jacket:'Áo khoác', 't-shirt':'Áo thun', trousers:'Quần âu', boots:'Boots', shorts:'Quần short', blazer:'Blazer', loafers:'Loafer', shirt:'Sơ mi', sweater:'Áo len', coat:'Áo choàng', suit:'Suit / Vest', jeans:'Quần Jeans' };

  const st = {
    tab: 'pose',
    uiLang: LS('uiLang') || 'vi',
    tl: LS('tl') || 'en',
    q: '',
    f: {},
    sort: 'def',
    fav: new Set(LS('fav') || []),
    sel: LS('sel') || [],
    rec: LS('rec') || [],
    recT: LS('recT') || {},
    ang: LS('ang') || {},
    list: [],
    n: 0
  };

  const DATA = { pose: [], costume: [], portrait: [] };
  const ITEMS = {};
  let CUSTOM_ITEMS = [];
  const BATCH = new Set();

  // ---- IndexedDB for Custom User Uploaded / Imported Items ----
  let cdbp;
  function cdb(){
    return cdbp || (cdbp = new Promise((res, rej) => {
      const req = indexedDB.open('pw-men-custom-db', 1);
      req.onupgradeneeded = () => {
        if(!req.result.objectStoreNames.contains('items')){
          req.result.createObjectStore('items', { keyPath: 'k' });
        }
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
  }
  async function cdbAll(){
    try{
      const db = await cdb();
      return await new Promise((res, rej) => {
        const tx = db.transaction('items', 'readonly');
        const q = tx.objectStore('items').getAll();
        q.onsuccess = () => res(q.result || []);
        q.onerror = () => rej(q.error);
      });
    }catch(e){ return []; }
  }
  async function cdbPutMany(arr){
    const db = await cdb();
    return new Promise((res, rej) => {
      const tx = db.transaction('items', 'readwrite');
      const store = tx.objectStore('items');
      arr.forEach(item => store.put(item));
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function cdbDelete(k){
    const db = await cdb();
    return new Promise((res, rej) => {
      const tx = db.transaction('items', 'readwrite');
      tx.objectStore('items').delete(k);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function cdbClear(){
    const db = await cdb();
    return new Promise((res, rej) => {
      const tx = db.transaction('items', 'readwrite');
      tx.objectStore('items').clear();
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }

  // ---- Merge Built-in + Custom Data (Idempotent rebuild) ----
  function rebuildCatalog(){
    for(const k in ITEMS) delete ITEMS[k];
    const built = window.POSEWEAR_MEN_DATA;
    DATA.pose = built.POSES.map(x => Object.assign({}, x, { ai: st.ang[x.k] || 0 }));
    DATA.costume = built.COSTUMES.map(x => Object.assign({}, x));
    DATA.portrait = built.PORTRAITS.map(x => Object.assign({}, x));

    // Merge custom items (replace if same key exists -> idempotent!)
    CUSTOM_ITEMS.forEach(raw => {
      const it = Object.assign({}, raw, { custom: true });
      if(it.type === 'pose' && it.angles) it.ai = st.ang[it.k] || 0;
      const arr = DATA[it.type];
      if(!arr) return;
      const idx = arr.findIndex(x => x.k === it.k);
      if(idx >= 0) arr[idx] = it;
      else arr.unshift(it);
    });

    ['pose','costume','portrait'].forEach(t => {
      DATA[t].forEach((it, idx) => { it.ord = idx; ITEMS[it.k] = it; });
    });
    updateCounts();
  }

  // ---- Helpers ----
  const tStr = k => (I18N[st.uiLang] && I18N[st.uiLang][k]) || I18N.vi[k] || k;
  const isVi = () => st.uiLang === 'vi';
  const titleOf = it => it.type === 'pose' ? (isVi() ? (it.vi || it.en) : (it.en || it.vi)) : (isVi() ? (it.tiVi || it.tiEn || it.vi) : (it.tiEn || it.tiVi || it.en));
  const catOf = it => it.type === 'portrait' ? (isVi() ? (it.secVi || it.secEn) : (it.secEn || it.secVi)) : (isVi() ? (it.catVi || it.catEn) : (it.catEn || it.catVi));
  const lineOf = it => isVi() ? (it.lineVi || it.lineEn || '') : (it.lineEn || it.lineVi || '');
  const lenOf = it => isVi() ? (it.lenVi || it.lenEn || '') : (it.lenEn || it.lenVi || '');
  const thumbOf = it => it.angles ? it.angles[it.ai || 0].t : it.t;
  const bigOf = it => it.angles ? it.angles[it.ai || 0].i : (it.i || it.m || it.t);
  const typeLabel = it => ({ pose: isVi()?'Tư thế':'Pose', costume: isVi()?'Trang phục':'Outfit', portrait: isVi()?'Chân dung':'Portrait' })[it.type] || it.type;

  function promptOf(it, lang){
    if(it.angles){
      const a = it.angles[it.ai || 0] || it.angles[0];
      if(lang === 'en') return `${it.en}, ${it.lineEn || 'solo male'}, ${a.promptEn || a.en}`;
      return `${it.vi} (${it.lineVi || 'Nam'}, góc ${a.vi})`;
    }
    return lang === 'en' ? (it.en || it.tiEn || '') : (it.vi || it.tiVi || '');
  }

  function subtitleOf(it){
    if(it.type === 'pose'){
      const nAng = it.angles ? it.angles.length : 1;
      return isVi() ? `${catOf(it)} · ${nAng} góc máy` : `${catOf(it)} · ${nAng} angles`;
    }
    if(it.type === 'portrait') return `${catOf(it)} · ${lenOf(it)}`;
    return promptOf(it, isVi() ? 'vi' : 'en');
  }

  function toast(msg, undoFn){
    const el = $('#toast');
    el.innerHTML = '';
    const sp = document.createElement('span');
    sp.textContent = msg;
    el.append(sp);
    if(undoFn){
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = tStr('undo');
      b.onclick = () => { el.classList.remove('on','act'); undoFn(); };
      el.append(b);
    }
    el.classList.toggle('act', !!undoFn);
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('on','act'), undoFn ? 4500 : 2100);
  }

  async function copyText(text, label){
    try{
      await navigator.clipboard.writeText(text);
    }catch(e){
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast((isVi() ? 'Đã copy ' : 'Copied ') + (label || ''));
  }

  function dlBlob(blob, name){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  async function imgUriToPngBlob(uri, w, h){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const cw = w || img.naturalWidth || 900;
        const ch = h || Math.round(cw * ((img.naturalHeight || 1200) / (img.naturalWidth || 900)));
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        c.toBlob(b => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png');
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = uri;
    });
  }

  function updateCounts(){
    $('#nPose').textContent = DATA.pose.length;
    $('#nCos').textContent = DATA.costume.length;
    $('#nPor').textContent = DATA.portrait.length;
    const nf = [...st.fav].filter(k => ITEMS[k]).length;
    const nr = st.rec.filter(k => ITEMS[k]).length;
    $('#nFav').textContent = nf || '';
    $('#nRec').textContent = nr || '';
  }

  // ---- i18n Application ----
  function applyI18n(){
    document.documentElement.lang = st.uiLang;
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if(I18N[st.uiLang][key]) el.textContent = I18N[st.uiLang][key];
    });
    $$('[data-uilang]').forEach(b => b.classList.toggle('on', b.dataset.uilang === st.uiLang));
    $('#q').placeholder = tStr('search_ph');
    if(st.tab !== 'studio'){
      drawFilters();
      applyFilter();
    } else if(window.WB && window.WB.render){
      window.WB.render();
    }
    drawTray();
    if(!$('#lb').hidden) lbDraw();
  }

  // ---- Filtering & Search ----
  function baseList(){
    if(st.tab === 'fav') return [...st.fav].reverse().map(k => ITEMS[k]).filter(Boolean);
    if(st.tab === 'recent') return st.rec.map(k => ITEMS[k]).filter(Boolean);
    return DATA[st.tab] || [];
  }

  function getFilterDefs(){
    if(st.tab === 'pose') return [['cat', isVi()?'Tư thế':'Category'], ['line', isVi()?'Khung hình':'Framing'], ['ang', isVi()?'Góc máy':'Angle']];
    if(st.tab === 'costume') return [['cat', isVi()?'Phong cách':'Style'], ['col', isVi()?'Màu sắc':'Color'], ['item', isVi()?'Món đồ':'Garment']];
    if(st.tab === 'portrait') return [['sec', isVi()?'Bối cảnh':'Type'], ['len', isVi()?'Độ dài tóc':'Hair Length']];
    return [['type', isVi()?'Danh mục':'Gallery']];
  }

  function itemVals(it, key){
    if(key === 'cat') return [catOf(it)].filter(Boolean);
    if(key === 'line') return [lineOf(it)].filter(Boolean);
    if(key === 'ang') return (it.angles || []).map(a => isVi() ? a.vi : a.en);
    if(key === 'col') return (it.cols || []).map(c => isVi() ? (COL_VI[c] || c) : c);
    if(key === 'item') return (it.items || []).map(x => isVi() ? (ITEM_VI[x] || x) : x);
    if(key === 'sec') return [catOf(it)].filter(Boolean);
    if(key === 'len') return [lenOf(it)].filter(Boolean);
    if(key === 'type') return [typeLabel(it)];
    return [];
  }

  function drawFilters(){
    const b = baseList();
    const defs = getFilterDefs();
    const rows = defs.map(([key, lab]) => {
      const cnt = {};
      b.forEach(it => itemVals(it, key).forEach(v => { cnt[v] = (cnt[v] || 0) + 1; }));
      const entries = Object.entries(cnt).sort((a,b) => b[1] - a[1]);
      if(entries.length < 2 && !st.f[key]) return '';
      return `<div class="frow"><label>${esc(lab)}</label>
        <button type="button" class="chip ${!st.f[key]?'on':''}" data-fk="${key}" data-fv="">${esc(tStr('all'))}</button>
        ${entries.map(([v,n]) => `<button type="button" class="chip ${st.f[key]===v?'on':''}" data-fk="${key}" data-fv="${esc(v)}">${esc(v)}<i>${n}</i></button>`).join('')}
      </div>`;
    }).join('');
    $('#filters').innerHTML = rows;
    const active = Object.entries(st.f).filter(([,v]) => !!v);
    $('#active').innerHTML = active.map(([k,v]) => `<button type="button" data-rmf="${k}">${esc(v)} ✕</button>`).join('');
    $('#fN').textContent = active.length || '';
    $('#clearAll').hidden = !(active.length || st.q);
  }

  function searchHaystack(it){
    return [
      it.id, it.no, it.vi, it.en, it.tiVi, it.tiEn, it.catVi, it.catEn,
      it.lineVi, it.lineEn, it.secVi, it.secEn, it.lenVi, it.lenEn,
      ...(it.cols || []), ...(it.items || []),
      ...(it.angles || []).flatMap(a => [a.vi, a.en])
    ].join(' ').toLowerCase();
  }

  function applyFilter(){
    const qs = st.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let L = baseList().filter(it => {
      const okF = Object.entries(st.f).every(([k,v]) => !v || itemVals(it, k).includes(v));
      if(!okF) return false;
      if(!qs.length) return true;
      const hay = searchHaystack(it);
      return qs.every(w => hay.includes(w));
    });
    if(st.f.ang){
      L.forEach(it => {
        if(!it.angles) return;
        const idx = it.angles.findIndex(a => (isVi()?a.vi:a.en) === st.f.ang);
        if(idx >= 0) it.ai = idx;
      });
    }
    if(st.sort === 'rev') L = L.slice().reverse();
    else if(st.sort === 'fav') L = L.slice().sort((a,b) => (st.fav.has(b.k)?1:0) - (st.fav.has(a.k)?1:0));
    else if(st.sort === 'shuf'){
      L = L.slice();
      for(let i = L.length - 1; i > 0; i--){ const j = Math.random()*(i+1)|0; [L[i],L[j]] = [L[j],L[i]]; }
    }

    st.list = L;
    const tot = baseList().length;
    const angSum = a => a.reduce((s, it) => s + (it.angles ? it.angles.length : 1), 0);
    if(st.tab === 'pose'){
      $('#count').innerHTML = isVi()
        ? `<b>${L.length}</b> / ${tot} tư thế · ${angSum(L)} góc máy`
        : `<b>${L.length}</b> / ${tot} poses · ${angSum(L)} angles`;
    } else {
      $('#count').innerHTML = isVi()
        ? `<b>${L.length}</b> / ${tot} mục`
        : `<b>${L.length}</b> / ${tot} items`;
    }

    $('#grid').innerHTML = '';
    st.n = 0;
    const isEmpty = !L.length;
    $('#empty').hidden = !isEmpty;
    if(isEmpty){
      const none = (st.tab === 'fav' || st.tab === 'recent') && !tot;
      $('#emptyIco').innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
      $('#emptyT').textContent = none
        ? (st.tab === 'fav' ? (isVi()?'Chưa có mục yêu thích':'No favorites yet') : (isVi()?'Chưa có lịch sử xem':'No recent items yet'))
        : (isVi()?'Không tìm thấy kết quả phù hợp':'No matching items found');
      $('#emptyP').textContent = none
        ? (isVi()?'Bấm biểu tượng ♡ trên thẻ để lưu, hoặc mở xem chi tiết để ghi lại gần đây.':'Click ♡ on any card to save favorites, or open any item to log history.')
        : (isVi()?'Thử từ khóa khác hoặc chọn gợi ý bên dưới:':'Try another keyword or pick a quick suggestion:');
      const hot = HOT_SUGG[st.tab] || HOT_SUGG.pose;
      $('#sugg').innerHTML = none ? '' : hot.map(s => `<button type="button" class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('');
      $('#emptyGo').innerHTML = none ? `<button type="button" class="sm" data-go="pose">${tStr('tab_pose')}</button><button type="button" class="sm" data-go="costume">${tStr('tab_cos')}</button><button type="button" class="sm" data-go="portrait">${tStr('tab_por')}</button>` : '';
      $('#reset').hidden = none;
    }
    renderMore();
  }

  function cardHTML(it, delay){
    const isS = st.sel.includes(it.k);
    const isF = st.fav.has(it.k);
    const isB = BATCH.has(it.k);
    const P = it.type === 'pose';
    const t = titleOf(it);
    const phCls = P ? 'pose' : it.type === 'portrait' ? 'portrait' : 'cos';
    const customImgCls = it.custom && !String(thumbOf(it)).startsWith('data:image/svg') ? 'custom-img' : '';
    const angBar = P && it.angles && it.angles.length > 1
      ? `<div class="angs">${it.angles.map((a,i) => `<span data-a="ang" data-i="${i}" class="${i===(it.ai||0)?'on':''}">${esc(isVi()?a.vi:a.en)}</span>`).join('')}</div>`
      : '';
    const tryText = P ? (isVi()?'Dùng tư thế này':'Use Pose') : it.type === 'portrait' ? (isVi()?'Dùng mặt mẫu':'Use Face') : (isVi()?'Thử bộ này':'Try Outfit');

    return `<article class="card ${isS?'sel':''} ${isB?'picked':''}" data-k="${esc(it.k)}" style="animation-delay:${delay||0}ms">
      <div class="ph ${phCls} ${customImgCls}">
        <img loading="lazy" decoding="async" src="${esc(thumbOf(it))}" alt="${esc(t)}" draggable="false">
        <button type="button" class="phk" data-a="open" aria-label="${esc(t)}"></button>
        ${it.no ? `<span class="badge">${esc(it.no)}</span>` : `<span class="badge">${esc(catOf(it))}</span>`}
        ${it.custom ? `<span class="badge usr">${isVi()?'Tự thêm':'Custom'}</span>` : ''}
        ${st.tab==='recent' ? `<button type="button" data-a="unrec" class="unrec" aria-label="Remove">✕</button>` : ''}
        ${angBar}
        <div class="cbtns">
          <button type="button" data-a="fav" class="${isF?'on':''}" title="Favorite">${isF?'♥':'♡'}</button>
          <button type="button" data-a="sel" class="${isS?'on':''}" title="Combine Prompt">${isS?'✓':'＋'}</button>
        </div>
        <button type="button" class="try" data-a="try">${esc(tryText)}</button>
      </div>
      <div class="info">
        <h3 title="${esc(t)}">${esc(t)}</h3>
        <div class="sub">${esc(subtitleOf(it))}</div>
      </div>
    </article>`;
  }

  function timeGrp(k){
    const t = st.recT[k];
    if(!t) return isVi() ? 'Trước đó' : 'Earlier';
    const d = new Date(); d.setHours(0,0,0,0);
    if(t >= d) return isVi() ? 'Hôm nay' : 'Today';
    if(t >= d - 864e5) return isVi() ? 'Hôm qua' : 'Yesterday';
    if(t >= d - 6*864e5) return isVi() ? '7 ngày qua' : 'Last 7 days';
    return isVi() ? 'Trước đó' : 'Earlier';
  }

  function renderMore(){
    if(st.n >= st.list.length) return;
    const isG = st.tab === 'recent' && !st.q && !Object.values(st.f).some(Boolean);
    let prevG = isG && st.n ? timeGrp(st.list[st.n-1].k) : '';
    const slice = st.list.slice(st.n, st.n + 36);
    const html = slice.map((it, i) => {
      let pre = '';
      if(isG){
        const g = timeGrp(it.k);
        if(g !== prevG){ pre = `<h4 class="rgrp">${esc(g)}</h4>`; prevG = g; }
      }
      return pre + cardHTML(it, RM ? 0 : Math.min(i, 12) * 22);
    }).join('');
    st.n += 36;
    $('#grid').insertAdjacentHTML('beforeend', html);
  }

  new IntersectionObserver(es => { if(es[0].isIntersecting) renderMore(); }, { rootMargin: '900px' }).observe($('#sentinel'));

  function refreshCard(k){
    const el = $('#grid').querySelector(`.card[data-k="${CSS.escape(k)}"]`);
    if(!el || !ITEMS[k]) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = cardHTML(ITEMS[k], 0);
    const neo = wrap.firstElementChild;
    neo.style.animation = 'none';
    el.replaceWith(neo);
  }

  function setAngle(it, idx){
    if(!it.angles || !it.angles[idx]) return;
    it.ai = idx;
    st.ang[it.k] = idx;
    SV('ang', st.ang);
    refreshCard(it.k);
  }

  function toggleFav(k, quiet){
    const on = !st.fav.has(k);
    on ? st.fav.add(k) : st.fav.delete(k);
    SV('fav', [...st.fav]);
    updateCounts();
    if(!quiet) toast(on ? (isVi()?'Đã thêm vào Yêu thích':'Added to Favorites') : (isVi()?'Đã bỏ Yêu thích':'Removed from Favorites'), on ? null : () => { toggleFav(k, true); if(st.tab==='fav') applyFilter(); });
    if(!on && st.tab === 'fav') applyFilter();
    else refreshCard(k);
    if(!$('#lb').hidden) lbDraw();
  }

  function toggleSel(k){
    const idx = st.sel.indexOf(k);
    if(idx >= 0) st.sel.splice(idx, 1);
    else st.sel.push(k);
    SV('sel', st.sel);
    refreshCard(k);
    drawTray(idx < 0);
    toast(idx < 0 ? (isVi()?'Đã thêm vào Combo Prompt':'Added to Prompt Combo') : (isVi()?'Đã bỏ khỏi Combo':'Removed from Combo'));
    if(!$('#lb').hidden) lbDraw();
  }

  function addRecent(k){
    st.rec = [k, ...st.rec.filter(x => x !== k)].slice(0, 100);
    st.recT[k] = Date.now();
    SV('rec', st.rec);
    SV('recT', st.recT);
    updateCounts();
  }

  // ---- Prompt Combo Builder (Men-focused EN & VI) ----
  function buildCombo(lang){
    const its = st.sel.map(k => ITEMS[k]).filter(Boolean);
    const poses = its.filter(i => i.type === 'pose');
    const outfits = its.filter(i => i.type === 'costume');
    const portraits = its.filter(i => i.type === 'portrait');
    if(lang === 'en'){
      return [
        'masterpiece, photorealistic editorial menswear photo, 1man, adult male',
        ...portraits.map(i => i.en.replace(/, consistent facial features.*$/i, '')),
        ...outfits.map(i => i.en),
        ...poses.map(i => promptOf(i, 'en')),
        'natural studio lighting, sharp fabric detail, 85mm lens'
      ].filter(Boolean).join(', ');
    }
    return [
      'Ảnh thời trang nam sắc nét chân thực, một người đàn ông trưởng thành',
      ...portraits.map(i => 'Khuôn mặt/tóc: ' + (i.vi || i.tiVi)),
      ...outfits.map(i => 'Trang phục: ' + (i.vi || i.tiVi)),
      ...poses.map(i => 'Tư thế: ' + promptOf(i, 'vi')),
      'Ánh sáng chuyên nghiệp, chất liệu vải rõ nét.'
    ].filter(Boolean).join('; ');
  }

  function drawTray(justAdded){
    const n = st.sel.filter(k => ITEMS[k]).length;
    if(st.tab === 'studio' || !n){
      $('#tray').hidden = true;
      document.body.classList.remove('tray');
      return;
    }
    $('#tray').hidden = false;
    document.body.classList.add('tray');
    if(justAdded && innerWidth > 760) $('#tray').classList.remove('min');
    const np = st.sel.filter(k => k.startsWith('p:') && ITEMS[k]).length;
    const nc = st.sel.filter(k => k.startsWith('c:') && ITEMS[k]).length;
    const nr = st.sel.filter(k => k.startsWith('r:') && ITEMS[k]).length;
    $('#trayN').textContent = [
      np && (isVi()?`${np} tư thế`:`${np} pose`),
      nc && (isVi()?`${nc} trang phục`:`${nc} outfit`),
      nr && (isVi()?`${nr} mẫu mặt`:`${nr} portrait`)
    ].filter(Boolean).join(' · ');
    $$('[data-tl]').forEach(b => b.classList.toggle('on', b.dataset.tl === st.tl));
    $('#trayItems').innerHTML = st.sel.map(k => {
      const it = ITEMS[k];
      if(!it) return '';
      return `<div><img src="${esc(thumbOf(it))}" alt="${esc(titleOf(it))}"><em>${esc(typeLabel(it))}</em><b data-rmt="${esc(k)}">×</b></div>`;
    }).join('');
    $('#trayText').textContent = buildCombo(st.tl);
  }

  // ---- Lightbox ----
  let lbIndex = 0;
  function lbOpen(idx){
    if(idx < 0 || !st.list[idx]) return;
    lbIndex = idx;
    $('#lb').hidden = false;
    document.body.style.overflow = 'hidden';
    lbDraw();
  }
  function lbClose(){
    if($('#lb').hidden) return;
    $('#lb').hidden = true;
    document.body.style.overflow = '';
  }
  function lbDraw(){
    const it = st.list[lbIndex];
    if(!it) return;
    addRecent(it.k);
    $('#lbImg').src = bigOf(it);
    $('#lbImg').alt = titleOf(it);
    const P = it.type === 'pose';
    const isF = st.fav.has(it.k);
    const isS = st.sel.includes(it.k);
    const meta = P
      ? `${lineOf(it)} · ${catOf(it)} · ${it.no || it.id}`
      : it.type === 'portrait'
        ? `${catOf(it)} · ${lenOf(it)} · ${it.no || it.id}`
        : `${catOf(it)} · ${it.id}`;
    const angHtml = P && it.angles && it.angles.length > 1
      ? `<div class="angsel">${it.angles.map((a,i) => `<button type="button" class="chip ${i===(it.ai||0)?'on':''}" data-ai="${i}">${esc(isVi()?a.vi:a.en)}</button>`).join('')}</div>`
      : '';
    const sim = st.list.map((x,i) => [x,i]).filter(([x]) => x.k !== it.k && x.type === it.type && catOf(x) === catOf(it)).slice(0, 4);
    const simHtml = sim.length
      ? `<small class="simh">${isVi()?'Mẫu cùng phong cách':'Similar items'}</small><div class="sim">${sim.map(([x,i]) => `<button type="button" data-si="${i}" title="${esc(titleOf(x))}"><img src="${esc(thumbOf(x))}" alt="${esc(titleOf(x))}"></button>`).join('')}</div>`
      : '';
    const delBtn = it.custom
      ? `<button type="button" data-x="delcustom" style="color:var(--bad)">${isVi()?'Xóa mục tự thêm':'Delete Custom'}</button>`
      : '';

    $('#lbSide').innerHTML = `
      <div class="mu">${esc(typeLabel(it))} · ${lbIndex+1} / ${st.list.length}</div>
      <h2>${esc(titleOf(it))}</h2>
      <div class="mu">${esc(meta)}</div>
      ${angHtml}
      <div class="pbox en"><small>ENGLISH PROMPT (Midjourney / Flux / Gemini / SD)</small><p>${esc(promptOf(it,'en'))}</p><button type="button" class="sm pri" data-c="en">${isVi()?'Copy Prompt Anh':'Copy EN Prompt'}</button></div>
      <div class="pbox"><small>${isVi()?'MÔ TẢ TIẾNG VIỆT':'VIETNAMESE DESCRIPTION'}</small><p>${esc(promptOf(it,'vi'))}</p><button type="button" class="sm" data-c="vi">${isVi()?'Copy mô tả Việt':'Copy VI Desc'}</button></div>
      <div class="acts">
        <button type="button" data-x="try">${P ? (isVi()?'Dùng làm tư thế trong Studio AI':'Use Pose in AI Studio') : it.type==='portrait' ? (isVi()?'Dùng làm mặt mẫu trong Studio':'Use Face in Studio') : (isVi()?'Thử bộ đồ này trong Studio AI':'Try Outfit in AI Studio')}</button>
        <button type="button" data-x="fav">${isF ? (isVi()?'♥ Đã thích':'♥ Favorited') : (isVi()?'♡ Yêu thích':'♡ Favorite')}</button>
        <button type="button" data-x="sel">${isS ? (isVi()?'✓ Trong Combo':'✓ In Combo') : (isVi()?'＋ Ghép Combo':'＋ Add Combo')}</button>
        <button type="button" data-x="dlpng">${isVi()?'Tải ảnh PNG':'Download PNG'}</button>
        <button type="button" data-x="cpimg">${isVi()?'Copy ảnh':'Copy Image'}</button>
        ${delBtn}
      </div>
      ${simHtml}
    `;
  }

  // ---- Tabs & Routing ----
  function setTab(t){
    if(!TABS.includes(t)) t = 'pose';
    if(document.body.classList.contains('batch')) toggleBatch(false);
    st.tab = t;
    st.f = {};
    st.q = '';
    $('#q').value = '';
    $('#qx').hidden = true;
    $$('#mainTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    history.replaceState(null, '', '#' + t);

    const isStu = t === 'studio';
    document.body.classList.toggle('studio', isStu);
    $('#studio').hidden = !isStu;
    if(isStu){
      $('#tray').hidden = true;
      window.WB && window.WB.show && window.WB.show();
      return;
    }
    $('#favTools').hidden = t !== 'fav';
    $('#clrRec').hidden = t !== 'recent';
    $('#rand').hidden = t === 'fav' || t === 'recent';
    $('#sort').hidden = t === 'recent';
    drawFilters();
    applyFilter();
    drawTray();
    scrollTo({ top: 0 });
  }

  // ---- Batch Mode ----
  function toggleBatch(on){
    document.body.classList.toggle('batch', on);
    $('#batchBtn').classList.toggle('on', on);
    $('#bbar').hidden = !on;
    $('#bbar [data-b=fav]').hidden = st.tab === 'fav';
    $('#bbar [data-b=unfav]').hidden = st.tab !== 'fav';
    if(!on){
      BATCH.clear();
      $$('.card.picked').forEach(c => c.classList.remove('picked'));
    }
    updateBatchBar();
  }
  function updateBatchBar(){
    $('#bbN').textContent = (isVi() ? 'Đã chọn ' : 'Selected ') + BATCH.size;
    $$('#bbar [data-b]:not([data-b=x]):not([data-b=all])').forEach(b => b.disabled = !BATCH.size);
  }

  // ---- Search Suggestions ----
  const HOT_SUGG = {
    pose: ['Đứng','Ngồi','Street','Gym','Bán thân','Standing','Sitting','Action'],
    costume: ['Streetwear','Suit','Smart Casual','Minimalist','Workwear','Hoodie','Blazer','Denim'],
    portrait: ['Undercut','Side Part','Middle Part','Mullet','Buzz','Beard','Wavy']
  };
  function drawSearchSugg(){
    const qVal = $('#q').value.trim().toLowerCase();
    const hist = LS('qh') || [];
    const pool = (HOT_SUGG[st.tab] || HOT_SUGG.pose).filter(x => !qVal || x.toLowerCase().includes(qVal));
    const hHtml = hist.length && !qVal
      ? `<div class="sgh"><small>${isVi()?'Tìm gần đây':'Recent'}</small><button type="button" data-clrqh>${isVi()?'Xóa':'Clear'}</button></div>
         <div class="sgc">${hist.map(x => `<button type="button" data-sq="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
      : '';
    const pHtml = pool.length
      ? `<div class="sgh"><small>${isVi()?'Gợi ý nhanh':'Quick suggestions'}</small></div>
         <div class="sgc">${pool.map((x,i) => `<button type="button" data-sq="${esc(x)}"><em>${i+1}</em>${esc(x)}</button>`).join('')}</div>`
      : '';
    $('#qsug').innerHTML = hHtml + pHtml;
    $('#qsug').hidden = !$('#qsug').innerHTML;
  }

  // ---- Upload Images & JSON Import/Export Manager ----
  let pendingFiles = [];
  function showStatus(id, msg, type){
    const el = $(id);
    el.hidden = false;
    el.textContent = msg;
    el.className = 'status-box ' + (type || '');
  }

  function fileToDataURL(file, maxDim){
    return new Promise((resolve, reject) => {
      if(file.type === 'image/svg+xml'){
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('SVG read failed'));
        r.readAsDataURL(file);
        return;
      }
      const u = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(u);
        const s = Math.min(1, (maxDim || 1280) / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * s));
        const h = Math.max(1, Math.round(img.naturalHeight * s));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/webp', 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('Image decode failed: ' + file.name)); };
      img.src = u;
    });
  }

  function handlePendingFiles(fileList){
    const imgs = [...fileList].filter(f => /^image\//.test(f.type));
    if(!imgs.length) return showStatus('#upStatus', isVi()?'Vui lòng chọn file ảnh (JPG, PNG, WebP, SVG).':'Please choose image files.', 'err');
    pendingFiles = imgs.slice(0, 20);
    $('#upPrev').innerHTML = pendingFiles.map(f => `<img src="${URL.createObjectURL(f)}" alt="${esc(f.name)}" title="${esc(f.name)}">`).join('');
    showStatus('#upStatus', isVi()?`Đã chọn ${pendingFiles.length} ảnh sẵn sàng lưu.`:`Selected ${pendingFiles.length} image(s) ready to save.`, 'ok');
  }

  // Smart normalizer for both PoseWear Men JSON & Original atuizz/posewear JSON
  function normalizeImportedRecord(raw, defType, idx){
    if(!raw || typeof raw !== 'object') return null;
    const type = ['pose','costume','portrait'].includes(raw.type)
      ? raw.type
      : (raw.angles || raw['ポーズ名'] ? 'pose' : (raw.sec || raw.secVi || raw.len ? 'portrait' : defType));
    const id = String(raw.id || ('imp_' + Date.now() + '_' + idx)).replace(/[^A-Za-z0-9_-]/g, '_');
    const k = PFX[type] + id;

    if(type === 'pose'){
      const vi = raw.vi || raw.zh || raw['ポーズ名'] || raw.tiVi || id;
      const en = raw.en || raw.tiEn || vi;
      const catVi = raw.catVi || raw.cat || raw['分類'] || 'Đứng';
      const catEn = raw.catEn || raw.cat || 'Standing';
      const lineVi = raw.lineVi || raw.line || raw['系統'] || 'Toàn thân · Tùy chỉnh';
      const lineEn = raw.lineEn || 'full body, solo male';
      let angles = [];
      if(Array.isArray(raw.angles) && raw.angles.length){
        angles = raw.angles.map((a, i) => ({
          key: a.key || ('a' + i),
          vi: a.vi || a.zh || ('Góc ' + (i+1)),
          en: a.en || ('Angle ' + (i+1)),
          promptEn: a.promptEn || a.en || 'front view',
          t: a.t || a.i || '',
          i: a.i || a.t || ''
        })).filter(a => a.t);
      } else {
        const src = raw.t || raw.i || raw['サムネ'] || raw['原寸'] || '';
        if(src) angles = [{ key:'front', vi: raw.angleVi || raw['アングル'] || 'Chính diện', en: raw.angleEn || 'Front view', promptEn: 'front view', t: src, i: raw.i || src }];
      }
      if(!angles.length) return null;
      return { id, no: raw.no || raw['ポーズ番号'] || ('C' + String(idx+1).padStart(2,'0')), type:'pose', k, lineVi, lineEn, catVi, catEn, vi, en, ai:0, angles, custom:true };
    }

    if(type === 'portrait'){
      const src = raw.t || raw.m || raw.i || raw.thumb || raw.full || '';
      if(!src) return null;
      const tiVi = raw.tiVi || raw.ti || raw.zh || id;
      const tiEn = raw.tiEn || raw.en || tiVi;
      return {
        id, no: raw.no || ('MF' + String(idx+1).padStart(2,'0')), type:'portrait', k,
        secVi: raw.secVi || raw.sec || 'Chân dung', secEn: raw.secEn || 'Portrait',
        lenVi: raw.lenVi || raw.len || 'Tóc ngắn', lenEn: raw.lenEn || 'Short Hair',
        tiVi, tiEn, vi: raw.vi || raw.zh || tiVi, en: raw.en || tiEn,
        t: src, m: raw.m || src, i: raw.i || src, custom:true
      };
    }

    // costume
    const src = raw.t || raw.m || raw.i || raw['サムネ'] || raw['画像'] || '';
    if(!src) return null;
    const tiVi = raw.tiVi || raw.ti || raw.zh || id;
    const tiEn = raw.tiEn || raw.en || tiVi;
    return {
      id, type:'costume', k,
      catVi: raw.catVi || raw.cat || raw['カテゴリ'] || 'Streetwear',
      catEn: raw.catEn || raw.catEn || raw.cat || 'Streetwear',
      tiVi, tiEn,
      vi: raw.vi || raw.zh || tiVi,
      en: raw.en || raw.kw || tiEn,
      cols: Array.isArray(raw.cols) ? raw.cols : [],
      items: Array.isArray(raw.items) ? raw.items : [],
      t: src, m: raw.m || src, i: raw.i || src, custom:true
    };
  }

  // ---- Event Bindings ----
  $('#mainTabs').onclick = e => {
    const b = e.target.closest('button[data-tab]');
    if(b) setTab(b.dataset.tab);
  };
  $('#brandLink').onclick = e => { e.preventDefault(); setTab('pose'); };

  $$('[data-uilang]').forEach(b => b.onclick = () => {
    st.uiLang = b.dataset.uilang;
    SV('uiLang', st.uiLang);
    applyI18n();
    toast(st.uiLang === 'vi' ? 'Ngôn ngữ giao diện: Tiếng Việt' : 'UI Language: English');
  });

  $('#theme').onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try{ localStorage.setItem('pw_theme', next); }catch(e){}
    $('meta[name=theme-color]').content = next === 'dark' ? '#0f1115' : '#ffffff';
  };

  $('#introX').onclick = () => {
    try{ localStorage.setItem('pw_introX', '1'); }catch(e){}
    document.documentElement.classList.add('nointro');
  };

  $('#help').onclick = () => { $('#helpBox').hidden = false; };
  $('#helpClose').onclick = () => { $('#helpBox').hidden = true; };
  $('#helpBox').onclick = e => { if(e.target.id === 'helpBox') $('#helpBox').hidden = true; };

  $('#fBtn').onclick = () => {
    const on = $('#filters').classList.toggle('open');
    $('#fBtn').classList.toggle('on', on);
  };
  $('#filters').onclick = e => {
    const b = e.target.closest('button[data-fk]');
    if(!b) return;
    st.f[b.dataset.fk] = b.dataset.fv;
    drawFilters();
    applyFilter();
  };
  $('#active').onclick = e => {
    const b = e.target.closest('button[data-rmf]');
    if(!b) return;
    st.f[b.dataset.rmf] = '';
    drawFilters();
    applyFilter();
  };
  const resetFilters = () => { st.f = {}; st.q = ''; $('#q').value = ''; $('#qx').hidden = true; drawFilters(); applyFilter(); };
  $('#clearAll').onclick = resetFilters;
  $('#reset').onclick = resetFilters;
  $('#sugg').onclick = e => {
    const b = e.target.closest('[data-s]');
    if(!b) return;
    st.f = {}; $('#q').value = st.q = b.dataset.s; $('#qx').hidden = false;
    drawFilters(); applyFilter();
  };
  $('#sort').onchange = e => { st.sort = e.target.value; applyFilter(); };
  $('#rand').onclick = () => { if(!st.list.length) return; lbOpen(Math.random() * st.list.length | 0); };

  // Search box
  let qTimer;
  $('#q').oninput = e => {
    $('#qx').hidden = !e.target.value;
    drawSearchSugg();
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { st.q = e.target.value; applyFilter(); }, 150);
  };
  $('#q').onfocus = drawSearchSugg;
  $('#q').onblur = () => setTimeout(() => { $('#qsug').hidden = true; }, 160);
  $('#q').onkeydown = e => {
    if(e.key === 'Enter'){
      const v = $('#q').value.trim();
      if(v) SV('qh', [v, ...(LS('qh') || []).filter(x => x !== v)].slice(0, 8));
      $('#qsug').hidden = true;
    }
  };
  $('#qx').onclick = () => { $('#q').value = ''; st.q = ''; $('#qx').hidden = true; applyFilter(); $('#q').focus(); };
  $('#qsug').onmousedown = e => e.preventDefault();
  $('#qsug').onclick = e => {
    const clr = e.target.closest('[data-clrqh]');
    if(clr){ SV('qh', []); return drawSearchSugg(); }
    const b = e.target.closest('[data-sq]');
    if(!b) return;
    $('#q').value = st.q = b.dataset.sq;
    $('#qx').hidden = false;
    SV('qh', [st.q, ...(LS('qh') || []).filter(x => x !== st.q)].slice(0, 8));
    $('#qsug').hidden = true;
    applyFilter();
  };

  // Grid clicks
  $('#grid').onclick = e => {
    const card = e.target.closest('.card');
    if(!card) return;
    const k = card.dataset.k;
    const it = ITEMS[k];
    if(!it) return;
    if(document.body.classList.contains('batch')){
      e.preventDefault();
      if(BATCH.has(k)){ BATCH.delete(k); card.classList.remove('picked'); }
      else{ BATCH.add(k); card.classList.add('picked'); }
      updateBatchBar();
      return;
    }
    const a = e.target.closest('[data-a]');
    if(!a) return;
    e.stopPropagation();
    const act = a.dataset.a;
    if(act === 'open') lbOpen(st.list.indexOf(it));
    else if(act === 'fav') toggleFav(k);
    else if(act === 'sel') toggleSel(k);
    else if(act === 'ang') setAngle(it, +a.dataset.i);
    else if(act === 'try') window.WB && window.WB.pick(it);
    else if(act === 'unrec'){
      const old = st.rec.slice();
      st.rec = st.rec.filter(x => x !== k);
      SV('rec', st.rec);
      updateCounts();
      applyFilter();
      toast(isVi()?'Đã xóa khỏi lịch sử':'Removed from recent', () => { st.rec = old; SV('rec', old); updateCounts(); applyFilter(); });
    }
  };

  // Batch bar clicks
  $('#batchBtn').onclick = () => toggleBatch(!document.body.classList.contains('batch'));
  $('#bbar').onclick = async e => {
    const b = e.target.closest('[data-b]');
    if(!b) return;
    const m = b.dataset.b;
    const its = [...BATCH].map(k => ITEMS[k]).filter(Boolean);
    if(m === 'x') return toggleBatch(false);
    if(m === 'all'){
      st.list.forEach(it => BATCH.add(it.k));
      $$('#grid .card').forEach(c => c.classList.add('picked'));
      return updateBatchBar();
    }
    if(m === 'fav'){
      its.forEach(it => st.fav.add(it.k));
      SV('fav', [...st.fav]); updateCounts();
      toast(isVi()?`Đã thích ${its.length} mục`:`Favorited ${its.length} items`);
      toggleBatch(false); applyFilter();
    } else if(m === 'unfav'){
      its.forEach(it => st.fav.delete(it.k));
      SV('fav', [...st.fav]); updateCounts();
      toast(isVi()?`Đã bỏ thích ${its.length} mục`:`Unfavorited ${its.length} items`);
      toggleBatch(false); applyFilter();
    } else if(m === 'cp'){
      copyText(its.map(it => promptOf(it, 'en')).join('\n'), isVi()?`${its.length} Prompt`:`${its.length} prompts`);
    } else if(m === 'stu'){
      toggleBatch(false);
      for(const it of its.slice(0, 6)) if(window.WB) await window.WB.pick(it);
    } else if(m === 'zip'){
      if(!window.makeZip || !its.length) return;
      b.disabled = true;
      try{
        const files = [];
        for(const it of its.slice(0, 30)){
          const blob = await imgUriToPngBlob(bigOf(it), 900, 1200);
          files.push({ name: `posewear-men-${it.type}-${it.id}.png`, blob });
        }
        dlBlob(await window.makeZip(files), `posewear-men-${files.length}.zip`);
        toast(isVi()?`Đã tải ZIP ${files.length} ảnh PNG`:`Downloaded ${files.length} PNGs as ZIP`);
      }catch(err){
        toast((isVi()?'Lỗi đóng gói ZIP: ':'ZIP error: ') + err.message);
      } finally { b.disabled = false; }
    }
  };

  // Combo Tray events
  $('#trayItems').onclick = e => { const k = e.target.dataset.rmt; if(k) toggleSel(k); };
  $$('[data-tl]').forEach(b => b.onclick = () => { st.tl = b.dataset.tl; SV('tl', st.tl); drawTray(); });
  $('#trayCopyEn').onclick = () => copyText(buildCombo('en'), 'English Combo Prompt');
  $('#trayCopyVi').onclick = () => copyText(buildCombo('vi'), isVi()?'Mô tả Combo Việt':'VI Combo');
  $('#trayToStu').onclick = async () => {
    const its = st.sel.map(k => ITEMS[k]).filter(Boolean);
    for(const it of its.slice(0, 6)) if(window.WB) await window.WB.pick(it);
    setTab('studio');
  };
  $('#trayMin').onclick = () => {
    const min = $('#tray').classList.toggle('min');
    $('#trayMin').textContent = min ? (isVi()?'Mở rộng':'Expand') : (isVi()?'Thu gọn':'Hide');
  };
  $('#trayClear').onclick = () => {
    const old = st.sel.slice();
    st.sel = []; SV('sel', []);
    old.forEach(refreshCard);
    drawTray();
    toast(isVi()?'Đã xóa Combo':'Cleared combo');
  };

  // Lightbox events
  $('#lbBg').onclick = lbClose;
  $('#lbClose').onclick = lbClose;
  const lbStep = d => { lbIndex = (lbIndex + d + st.list.length) % st.list.length; lbDraw(); };
  $('#lbPrev').onclick = () => lbStep(-1);
  $('#lbNext').onclick = () => lbStep(1);
  $('#lbSide').onclick = async e => {
    const b = e.target.closest('button');
    if(!b) return;
    const it = st.list[lbIndex];
    if(!it) return;
    if(b.dataset.ai != null){ setAngle(it, +b.dataset.ai); lbDraw(); return; }
    if(b.dataset.si != null){ lbOpen(+b.dataset.si); return; }
    if(b.dataset.c){ copyText(promptOf(it, b.dataset.c), b.dataset.c === 'en' ? 'EN Prompt' : 'VI'); return; }
    const x = b.dataset.x;
    if(x === 'fav') toggleFav(it.k);
    else if(x === 'sel') toggleSel(it.k);
    else if(x === 'try'){ lbClose(); window.WB && window.WB.pick(it); }
    else if(x === 'dlpng'){
      try{
        const blob = await imgUriToPngBlob(bigOf(it), 900, 1200);
        dlBlob(blob, `posewear-men-${it.id}${it.angles?'-'+it.angles[it.ai||0].key:''}.png`);
        toast(isVi()?'Đã tải ảnh PNG độ phân giải cao':'Downloaded high-res PNG');
      }catch(err){ toast((isVi()?'Lỗi xuất PNG: ':'PNG error: ') + err.message); }
    } else if(x === 'cpimg'){
      try{
        const blob = await imgUriToPngBlob(bigOf(it), 900, 1200);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast(isVi()?'Đã copy ảnh PNG vào Clipboard':'Image copied to clipboard');
      }catch(err){ toast(isVi()?'Trình duyệt chưa hỗ trợ copy ảnh trực tiếp, hãy dùng nút Tải PNG':'Direct image copy unsupported; use Download PNG'); }
    } else if(x === 'delcustom'){
      try{
        await cdbDelete(it.k);
        CUSTOM_ITEMS = CUSTOM_ITEMS.filter(c => c.k !== it.k);
        lbClose();
        rebuildCatalog();
        drawFilters();
        applyFilter();
        toast(isVi()?'Đã xóa mục tự thêm':'Deleted custom item');
      }catch(err){ toast('Delete failed: ' + err.message); }
    }
  };

  // Favorites Export/Import & Clear Recent
  $('#expFav').onclick = () => {
    const items = [...st.fav].map(k => ITEMS[k]).filter(Boolean);
    if(!items.length) return toast(isVi()?'Chưa có mục yêu thích':'No favorites');
    dlBlob(new Blob([JSON.stringify({ app:'PoseWear Men', exportedAt:new Date().toISOString(), keys:items.map(i=>i.k), items }, null, 2)], {type:'application/json'}), 'posewear-men-favorites.json');
    toast(isVi()?`Đã xuất ${items.length} mục yêu thích`:`Exported ${items.length} favorites`);
  };
  $('#impFav').onclick = () => $('#impFavF').click();
  $('#impFavF').onchange = async e => {
    try{
      const data = JSON.parse(await e.target.files[0].text());
      const ks = data.keys || (data.items || []).map(x => x.k) || [];
      let added = 0;
      ks.forEach(k => { if(ITEMS[k] && !st.fav.has(k)){ st.fav.add(k); added++; } });
      SV('fav', [...st.fav]); updateCounts(); applyFilter();
      toast(isVi()?`Đã nhập ${added} mục yêu thích`:`Imported ${added} favorites`);
    }catch(err){ toast((isVi()?'Lỗi nhập JSON: ':'Invalid JSON: ') + err.message); }
    e.target.value = '';
  };
  $('#clrFav').onclick = () => {
    if(!st.fav.size) return;
    const old = [...st.fav];
    st.fav = new Set(); SV('fav', []); updateCounts(); applyFilter();
    toast(isVi()?'Đã xóa toàn bộ yêu thích':'Cleared favorites', () => { st.fav = new Set(old); SV('fav', old); updateCounts(); applyFilter(); });
  };
  $('#clrRec').onclick = () => {
    if(!st.rec.length) return;
    const old = st.rec.slice();
    st.rec = []; SV('rec', []); updateCounts(); applyFilter();
    toast(isVi()?'Đã xóa lịch sử xem':'Cleared recent', () => { st.rec = old; SV('rec', old); updateCounts(); applyFilter(); });
  };

  // ---- Import / Upload Modal Events ----
  const openImp = () => { $('#impModal').hidden = false; document.body.style.overflow = 'hidden'; };
  const closeImp = () => { $('#impModal').hidden = true; document.body.style.overflow = ''; };
  $('#openImport').onclick = openImp;
  $('#impClose').onclick = closeImp;
  $('#impModal').onclick = e => { if(e.target.id === 'impModal') closeImp(); };

  $$('[data-imptab]').forEach(b => b.onclick = () => {
    $$('[data-imptab]').forEach(x => x.classList.toggle('on', x === b));
    const isImg = b.dataset.imptab === 'img';
    $('#impPaneImg').hidden = !isImg;
    $('#impPaneJson').hidden = isImg;
  });

  $('#upDrop').onclick = () => $('#upFile').click();
  $('#upDrop').onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); $('#upFile').click(); } };
  ['dragenter','dragover'].forEach(ev => $('#upDrop').addEventListener(ev, e => { e.preventDefault(); $('#upDrop').classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => $('#upDrop').addEventListener(ev, e => { e.preventDefault(); $('#upDrop').classList.remove('over'); }));
  $('#upDrop').addEventListener('drop', e => handlePendingFiles(e.dataTransfer.files));
  $('#upFile').onchange = e => { handlePendingFiles(e.target.files); e.target.value = ''; };

  $('#upResetForm').onclick = () => {
    pendingFiles = [];
    $('#upPrev').innerHTML = '';
    $('#upTiVi').value = ''; $('#upEn').value = ''; $('#upVi').value = '';
    $('#upStatus').hidden = true;
  };

  $('#upSaveBtn').onclick = async () => {
    if(!pendingFiles.length) return showStatus('#upStatus', isVi()?'Chưa chọn ảnh nào để lưu.':'No images selected yet.', 'err');
    const btn = $('#upSaveBtn');
    btn.disabled = true;
    showStatus('#upStatus', isVi()?'Đang tối ưu và lưu ảnh vào IndexedDB...':'Optimizing and saving to IndexedDB...', '');
    try{
      const type = $('#upType').value;
      const catRaw = $('#upCat').value.trim() || (type==='pose'?'Đứng':type==='costume'?'Streetwear':'Chân dung');
      const [catVi, catEn] = catRaw.includes('/') ? catRaw.split('/').map(s=>s.trim()) : [catRaw, catRaw];
      const baseTiVi = $('#upTiVi').value.trim();
      const baseEn = $('#upEn').value.trim();
      const baseVi = $('#upVi').value.trim();
      const created = [];

      for(let i = 0; i < pendingFiles.length; i++){
        const f = pendingFiles[i];
        const uri = await fileToDataURL(f, 1280);
        const stem = f.name.replace(/\.[^.]+$/, '');
        const id = 'usr_' + Date.now() + '_' + i;
        const k = PFX[type] + id;
        const tiVi = baseTiVi ? (pendingFiles.length > 1 ? `${baseTiVi} #${i+1}` : baseTiVi) : stem;
        const en = baseEn || `${stem}, adult male ${type}`;
        const vi = baseVi || tiVi;

        if(type === 'pose'){
          created.push({
            id, no: 'UP' + String((CUSTOM_ITEMS.length + i + 1)).padStart(2,'0'), type:'pose', k,
            lineVi: 'Ảnh tải lên · Nam', lineEn: 'custom uploaded male pose',
            catVi, catEn, vi, en, ai:0,
            angles: [{ key:'front', vi:'Ảnh gốc', en:'Original', promptEn:'natural angle', t:uri, i:uri }],
            custom:true
          });
        } else if(type === 'portrait'){
          created.push({
            id, no: 'UR' + String((CUSTOM_ITEMS.length + i + 1)).padStart(2,'0'), type:'portrait', k,
            secVi: catVi, secEn: catEn, lenVi: 'Tùy chỉnh', lenEn: 'Custom',
            tiVi, tiEn: baseEn || stem, vi, en, t:uri, m:uri, i:uri, custom:true
          });
        } else {
          created.push({
            id, type:'costume', k, catVi, catEn,
            tiVi, tiEn: baseEn || stem, vi, en, cols:[], items:[],
            t:uri, m:uri, i:uri, custom:true
          });
        }
      }

      await cdbPutMany(created);
      CUSTOM_ITEMS = await cdbAll();
      rebuildCatalog();
      setTab(type);
      pendingFiles = [];
      $('#upPrev').innerHTML = '';
      showStatus('#upStatus', isVi()?`Đã lưu thành công ${created.length} ảnh vào mục ${typeLabel(created[0])}!`:`Saved ${created.length} image(s) successfully!`, 'ok');
      toast(isVi()?`Đã thêm ${created.length} ảnh mới`:`Added ${created.length} new items`);
    }catch(err){
      showStatus('#upStatus', (isVi()?'Lỗi lưu ảnh: ':'Save error: ') + err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  };

  $('#jsonFile').onchange = async e => {
    const f = e.target.files[0];
    if(!f) return;
    try{
      $('#jsonText').value = await f.text();
      showStatus('#jsonStatus', isVi()?`Đã nạp tệp ${f.name}. Bấm "Nhập JSON vào thư viện" để lưu.`:`Loaded ${f.name}. Click Import JSON to save.`, '');
    }catch(err){
      showStatus('#jsonStatus', 'Read error: ' + err.message, 'err');
    }
    e.target.value = '';
  };

  $('#jsonImportBtn').onclick = async () => {
    const rawStr = $('#jsonText').value.trim();
    if(!rawStr) return showStatus('#jsonStatus', isVi()?'Vui lòng chọn file .json hoặc dán nội dung JSON.':'Please load or paste JSON first.', 'err');
    const btn = $('#jsonImportBtn');
    btn.disabled = true;
    try{
      const parsed = JSON.parse(rawStr);
      const arr = Array.isArray(parsed) ? parsed : (parsed.items || parsed.D || parsed.poses || parsed.costumes || []);
      if(!Array.isArray(arr) || !arr.length) throw new Error(isVi()?'Không tìm thấy mảng dữ liệu hợp lệ trong JSON.':'No valid items array found in JSON.');
      const defType = $('#jsonDefType').value;
      const valid = arr.map((r, i) => normalizeImportedRecord(r, defType, i)).filter(Boolean);
      if(!valid.length) throw new Error(isVi()?'Các mục JSON thiếu đường dẫn ảnh (t / i / angles).':'Records missing image URLs (t / i / angles).');
      await cdbPutMany(valid);
      CUSTOM_ITEMS = await cdbAll();
      rebuildCatalog();
      setTab(valid[0].type);
      showStatus('#jsonStatus', isVi()?`Nhập thành công ${valid.length} mục (đã đồng bộ chống trùng ID)!`:`Imported ${valid.length} item(s) successfully!`, 'ok');
      toast(isVi()?`Đã nhập ${valid.length} mục từ JSON`:`Imported ${valid.length} items`);
    }catch(err){
      showStatus('#jsonStatus', (isVi()?'Lỗi phân tích JSON: ':'JSON Parse Error: ') + err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  };

  $('#dlSampleJson').onclick = () => {
    const sample = [
      {
        type: 'costume', id: 'sample_men_blazer_01',
        catVi: 'Smart Casual', catEn: 'Smart Casual',
        tiVi: 'Blazer xám nhạt + Áo thun đen', tiEn: 'Light Grey Blazer + Black Tee',
        vi: 'Blazer xám nhạt form hiện đại phối áo thun đen trơn và quần âu đen.',
        en: 'men smart casual outfit, tailored light grey blazer, fitted black crewneck t-shirt, slim black trousers, minimalist sneakers',
        cols: ['grey','black'], items: ['blazer','t-shirt','trousers'],
        t: DATA.costume[0].t, i: DATA.costume[0].i
      },
      {
        type: 'pose', id: 'sample_men_pose_01', no: 'SP01',
        lineVi: 'Toàn thân · Tự nhập', lineEn: 'full body, solo male',
        catVi: 'Đứng', catEn: 'Standing',
        vi: 'Đứng nghiêng nhẹ tay đút túi quần', en: 'male standing at slight angle, hands in pockets, confident look',
        angles: [{ key:'front', vi:'Chính diện', en:'Front view', promptEn:'front view', t: DATA.pose[0].angles[0].t, i: DATA.pose[0].angles[0].i }]
      }
    ];
    dlBlob(new Blob([JSON.stringify(sample, null, 2)], {type:'application/json'}), 'posewear-men-template.json');
    toast(isVi()?'Đã tải file JSON mẫu':'Downloaded sample JSON');
  };

  $('#expCustomJson').onclick = () => {
    if(!CUSTOM_ITEMS.length) return showStatus('#jsonStatus', isVi()?'Chưa có dữ liệu tự thêm nào để xuất.':'No custom items to export yet.', 'err');
    dlBlob(new Blob([JSON.stringify({ app:'PoseWear Men', customCount:CUSTOM_ITEMS.length, items:CUSTOM_ITEMS }, null, 2)], {type:'application/json'}), 'posewear-men-custom.json');
    showStatus('#jsonStatus', isVi()?`Đã xuất ${CUSTOM_ITEMS.length} mục tự thêm.`:`Exported ${CUSTOM_ITEMS.length} custom items.`, 'ok');
  };

  $('#expAllJson').onclick = () => {
    const all = [...DATA.pose, ...DATA.costume, ...DATA.portrait];
    dlBlob(new Blob([JSON.stringify({ app:'PoseWear Men', version:'1.0', items:all }, null, 2)], {type:'application/json'}), 'posewear-men-full-library.json');
    showStatus('#jsonStatus', isVi()?`Đã xuất toàn bộ ${all.length} mục.`:`Exported full library (${all.length} items).`, 'ok');
  };

  $('#clrCustomBtn').onclick = async () => {
    if(!CUSTOM_ITEMS.length) return showStatus('#jsonStatus', isVi()?'Không có dữ liệu tự thêm nào.':'No custom items to clear.', '');
    if(!confirm(isVi()?'Xóa toàn bộ ảnh tải lên và mục JSON tự nhập? (Dữ liệu mặc định vẫn giữ nguyên)':'Clear all uploaded images & imported JSON items? (Built-in library remains intact)')) return;
    try{
      await cdbClear();
      CUSTOM_ITEMS = [];
      rebuildCatalog();
      drawFilters();
      applyFilter();
      showStatus('#jsonStatus', isVi()?'Đã xóa sạch dữ liệu tự thêm.':'Cleared all custom items.', 'ok');
      toast(isVi()?'Đã dọn dữ liệu tự thêm':'Cleared custom data');
    }catch(err){
      showStatus('#jsonStatus', 'Error: ' + err.message, 'err');
    }
  };

  // Global delegates & keyboard shortcuts
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if(g) setTab(g.dataset.go);
  });

  addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', scrollY > 18);
    $('#toTop').classList.toggle('on', scrollY > 700);
  }, { passive: true });
  $('#toTop').onclick = () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });

  addEventListener('keydown', e => {
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    const ae = document.activeElement;
    const inField = ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName);
    if(e.key === 'Escape'){
      if(!$('#impModal').hidden) return closeImp();
      if(!$('#helpBox').hidden) return ($('#helpBox').hidden = true);
      if(!$('#lb').hidden) return lbClose();
      if(document.body.classList.contains('batch')) return toggleBatch(false);
      if(inField) ae.blur();
      return;
    }
    if(inField) return;
    const k = (e.key || '').toLowerCase();
    if($('#lb').hidden){
      if(e.key === '/'){ e.preventDefault(); $('#q').focus(); }
      else if(k === 'r' && st.tab !== 'studio') $('#rand').click();
      else if(k === 't') $('#theme').click();
      else if(k === 'l'){ st.uiLang = st.uiLang === 'vi' ? 'en' : 'vi'; SV('uiLang', st.uiLang); applyI18n(); }
      else if('123456'.includes(e.key) && TABS[+e.key - 1]) setTab(TABS[+e.key - 1]);
      return;
    }
    const it = st.list[lbIndex];
    if(!it) return;
    if(e.key === 'ArrowLeft') lbStep(-1);
    else if(e.key === 'ArrowRight') lbStep(1);
    else if((e.key === 'ArrowUp' || e.key === 'ArrowDown') && it.angles){
      e.preventDefault();
      setAngle(it, ((it.ai || 0) + (e.key === 'ArrowUp' ? -1 : 1) + it.angles.length) % it.angles.length);
      lbDraw();
    } else if(k === 'f') toggleFav(it.k);
    else if(k === 'a') toggleSel(it.k);
    else if(k === 'c') copyText(promptOf(it, 'en'), 'EN Prompt');
  });

  // Expose API for studio.js & external hooks
  window.APP = {
    DATA, ITEMS, st, esc, toast, copyText, dlBlob, imgUriToPngBlob,
    titleOf, thumbOf, bigOf, promptOf, setTab, isVi, tStr
  };

  // Boot
  (async function boot(){
    try{
      CUSTOM_ITEMS = await cdbAll();
      rebuildCatalog();
      applyI18n();
      const h = (location.hash || '').slice(1).split('/')[0];
      setTab(TABS.includes(h) ? h : 'pose');
      if('serviceWorker' in navigator && location.protocol !== 'file:'){
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    }catch(err){
      console.error(err);
      toast('Init error: ' + err.message);
    }
  })();
})();
