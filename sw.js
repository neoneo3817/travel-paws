/* Travel Pass service worker
   - 앱 화면(index.html)은 항상 인터넷에서 최신본을 먼저 받고, 인터넷이 없을 때만 저장본을 보여줍니다.
   - Supabase, 환율, 글꼴 등 다른 주소로 가는 요청은 건드리지 않습니다. (데이터에 영향 없음)
   - 파일을 바꿔 올릴 때 아이콘 등을 새로 받게 하려면 아래 CACHE 이름의 숫자만 올리세요. */
const CACHE='travelpass-v1';
const INDEX=new URL('index.html',self.registration.scope).href;
const PRECACHE=['./','index.html','manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(INDEX,copy))}
        return res;
      }).catch(()=>caches.match(INDEX).then(r=>r||caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
        return res;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});
