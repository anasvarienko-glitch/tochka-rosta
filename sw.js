/* Увеличивайте VERSION при обновлении файлов. */
const VERSION='v1';
const PREFIX='tochka-rosta-'+self.registration.scope;
const CACHE=PREFIX+VERSION;
const FILES=['./','./index.html','./app.css','./app.js','./data.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(event.request);
  if(cached)return cached;
  if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();
  return Response.error();
 }));
});