// Runtime safety patch for Japan Salary Tracker
// Keeps user data untouched: only patches the served HTML before React/Babel sees it.
const CACHE_BUST = 'jst-runtime-patch-2026-06-17';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function patchHtml(html) {
  const oldBlock = `<div className={\`fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t \${theme === "light" ? "bg-white/95 border-neutral-200" : "bg-zinc-950/95 border-zinc-800/50"}\`} style={theme === "gray" ? {background:"rgba(28,28,28,0.97)", borderColor:"#333333"} : {}}
        style={{paddingBottom: "env(safe-area-inset-bottom, 0px)"}}>`;

  const newBlock = `<div className={\`fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t \${theme === "light" ? "bg-white/95 border-neutral-200" : "bg-zinc-950/95 border-zinc-800/50"}\`}
        style={{
          ...(theme === "gray" ? {background:"rgba(28,28,28,0.97)", borderColor:"#333333"} : {}),
          paddingBottom: "env(safe-area-inset-bottom, 0px)"
        }}>`;

  return html.includes(oldBlock) ? html.replace(oldBlock, newBlock) : html;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith((async () => {
      const res = await fetch(req, { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) return res;
      const html = await res.text();
      return new Response(patchHtml(html), {
        status: res.status,
        statusText: res.statusText,
        headers: { 'content-type': 'text/html; charset=utf-8', 'x-jst-patch': CACHE_BUST }
      });
    })());
  }
});
