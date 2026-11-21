// PoseWear Men API Proxy (Cloudflare Pages Function)
// Forward-only proxy; never logs or stores keys, prompts, or images.
const API_PATH=/^\/(api\/v3|v\d+(beta|alpha)?)\/(images\/(edits|generations)|models(\/[^/]+(:generateContent)?)?)$/;
const OFFICIAL=[/^api\.openai\.com$/,/^generativelanguage\.googleapis\.com$/,/^ark\.[a-z0-9-]+\.volces\.com$/,/^ark\.[a-z0-9-]+\.bytepluses\.com$/];
const IMG_HOSTS=[/^oaidalleapiprodscus\.blob\.core\.windows\.net$/,/(^|\.)volces\.com$/,/(^|\.)bytepluses\.com$/,/(^|\.)googleusercontent\.com$/];
const DROP=['host','x-target-url','x-proxy-kind','x-proxy-custom','cookie','origin','referer','x-forwarded-for','x-forwarded-proto','x-real-ip','content-length','sec-fetch-site','sec-fetch-mode','sec-fetch-dest'];
const RL=new Map(),WIN=60e3,MAX_API=20,MAX_IMG=40;
function limited(ip,kind){
  const now=Date.now(),k=kind+'|'+ip;
  let e=RL.get(k);
  if(!e||now-e.t>WIN){e={t:now,n:0};RL.set(k,e);}
  e.n++;
  if(RL.size>5000)for(const[x,v]of RL)if(now-v.t>WIN)RL.delete(x);
  return e.n>(kind==='img'?MAX_IMG:MAX_API);
}
async function cacheCount(ip,kind){
  try{
    const c=caches.default,m=Math.floor(Date.now()/WIN),key=new Request(`https://rl.invalid/${kind}/${encodeURIComponent(ip)}/${m}`);
    const r=await c.match(key),n=(r?+(await r.text())||0:0)+1;
    await c.put(key,new Response(String(n),{headers:{'cache-control':'max-age=120'}}));
    return n;
  }catch(e){return 0;}
}
async function over(ip,kind){return limited(ip,kind)||(await cacheCount(ip,kind))>(kind==='img'?MAX_IMG:MAX_API);}
function sameSite(req){
  const self=new URL(req.url).host;
  for(const h of['origin','referer']){const v=req.headers.get(h);if(v){try{return new URL(v).host===self;}catch(e){return false;}}}
  return false;
}
export async function onRequest(ctx){
  const {request}=ctx;
  if(request.method==='OPTIONS')return new Response(null,{status:204});
  if(!['GET','POST'].includes(request.method))return j(405,'Only GET / POST supported');
  if(!sameSite(request))return j(403,'Same-origin requests only');
  let t;try{t=new URL(request.headers.get('x-target-url')||'');}catch(e){return j(400,'Missing or invalid x-target-url');}
  if(t.protocol!=='https:'||t.username||t.password||(t.port&&t.port!=='443'))return j(400,'Target must be standard https');
  const ip=request.headers.get('cf-connecting-ip')||'0';
  const img=request.headers.get('x-proxy-kind')==='image';
  if(img){
    if(request.method!=='GET')return j(405,'Image proxy supports GET only');
    if(!IMG_HOSTS.some(r=>r.test(t.hostname)))return j(403,'Image host not allowed');
    if(await over(ip,'img'))return j(429,'Rate limit exceeded / Vượt giới hạn tần suất');
    const r=await fetch(t.toString(),{redirect:'manual'}).catch(()=>null);
    const ct=r&&r.headers.get('content-type')||'';
    if(!r||!r.ok||!/^image\//.test(ct))return j(502,'Failed to download result image');
    return new Response(r.body,{headers:{'content-type':ct,'cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
  const official=OFFICIAL.some(r=>r.test(t.hostname)),custom=request.headers.get('x-proxy-custom')==='1';
  if(!official&&!custom)return j(403,'Non-official endpoint requires Custom provider mode');
  const path=t.pathname.replace(/\/+$/,'');
  if(official?!API_PATH.test(path):!/\/(images\/(edits|generations)|models(\/[^/]+(:generateContent)?)?)$/.test(path))return j(403,'Endpoint path not allowed');
  if(custom&&/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/.test(t.hostname))return j(403,'Private network targets blocked');
  if(await over(ip,'api'))return j(429,'Rate limit exceeded / Vượt giới hạn tần suất');
  const h=new Headers();
  for(const[k,v]of request.headers){const l=k.toLowerCase();if(!DROP.includes(l)&&!l.startsWith('cf-'))h.set(k,v);}
  try{
    const r=await fetch(t.toString(),{method:request.method,headers:h,body:request.method==='POST'?request.body:undefined,redirect:'manual'});
    const oh=new Headers();
    ['content-type'].forEach(k=>r.headers.get(k)&&oh.set(k,r.headers.get(k)));
    oh.set('cache-control','no-store');
    return new Response(r.body,{status:r.status,headers:oh});
  }catch(e){return j(502,'Proxy failed to reach upstream provider');}
}
const j=(s,m)=>new Response(JSON.stringify({error:{message:m}}),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
