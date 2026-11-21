const V='posewear-men-v1.0';
const CORE=['./','index.html','style.css?v=1.0','data-men.js?v=1.0','zip.js?v=1.0','app.js?v=1.0','studio.js?v=1.0','favicon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res&&res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(e.request,cl)).catch(()=>{})}
    return res;
  }).catch(()=>caches.match(e.request)));
});
