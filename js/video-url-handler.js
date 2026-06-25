const HOSTS = [
  {
    name: "KrakenFiles",
    domains: ["krakenfiles.com"],
    requiresTopLevel: false,
    toEmbedUrl: (u) => u,
    toWatchUrl: (u) => u
  },
  { name: "Google Drive", domains: ["drive.google.com"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/preview` : u; },
    toWatchUrl: (u) => { const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/view` : u.replace("/preview", "/view"); } },
  { name: "Luluvid", domains: ["luluvid.com"], requiresTopLevel: true,
    toEmbedUrl: (u) => u.includes("/v/") ? u.replace("/v/", "/e/") : u,
    toWatchUrl: (u) => u.includes("/e/") ? u.replace("/e/", "/v/") : u },
  { name: "Streamtape", domains: ["streamtape.com", "streamtape.to"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/streamtape\.(com|to)\/v\/([^/]+)/); return m ? `https://streamtape.com/e/${m[2]}` : u; },
    toWatchUrl: (u) => { const m = u.match(/streamtape\.(com|to)\/e\/([^/]+)/); return m ? `https://streamtape.com/v/${m[2]}` : u; } },
  { name: "Doodstream", domains: ["doodstream.com","dood.to","dood.watch","dood.so","dood.pm","dood.ws","dood.sh","dood.cx"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/dood[^/]+\/[de]\/([^/?]+)/); if (!m) return u; const d = u.match(/(dood[^/]+)/)?.[1] || "doodstream.com"; return `https://${d}/e/${m[1]}`; },
    toWatchUrl: (u) => { const m = u.match(/dood[^/]+\/[de]\/([^/?]+)/); if (!m) return u; const d = u.match(/(dood[^/]+)/)?.[1] || "doodstream.com"; return `https://${d}/d/${m[1]}`; } },
  { name: "Mixdrop", domains: ["mixdrop.co","mixdrop.to","mixdrop.sx","mixdrop.bz","mixdrop.ch"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/mixdrop\.[^/]+\/[fe]\/([^/?]+)/); if (!m) return u; const d = u.match(/(mixdrop\.[^/]+)/)?.[1] || "mixdrop.co"; return `https://${d}/e/${m[1]}`; },
    toWatchUrl: (u) => { const m = u.match(/mixdrop\.[^/]+\/[fe]\/([^/?]+)/); if (!m) return u; const d = u.match(/(mixdrop\.[^/]+)/)?.[1] || "mixdrop.co"; return `https://${d}/f/${m[1]}`; } },
  { name: "Upstream", domains: ["upstream.to"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/upstream\.to\/([^/]+)/); return m && !u.includes("/embed-") ? `https://upstream.to/embed-${m[1]}.html` : u; },
    toWatchUrl: (u) => { const m = u.match(/upstream\.to\/embed-([^.]+)\.html/); return m ? `https://upstream.to/${m[1]}` : u; } },
  { name: "Vidoza", domains: ["vidoza.net"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/vidoza\.net\/([^/]+)\.html/); return m ? `https://vidoza.net/embed-${m[1]}.html` : u; },
    toWatchUrl: (u) => { const m = u.match(/vidoza\.net\/embed-([^.]+)\.html/); return m ? `https://vidoza.net/${m[1]}.html` : u; } },
  { name: "Voe", domains: ["voe.sx","voe.world"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/voe\.[^/]+\/([^/]+)/); return m && !u.includes("/e/") ? `https://voe.sx/e/${m[1]}` : u; },
    toWatchUrl: (u) => { const m = u.match(/voe\.[^/]+\/e\/([^/?]+)/); return m ? `https://voe.sx/${m[1]}` : u; } },
  { name: "Filemoon", domains: ["filemoon.sx","filemoon.to","filemoon.in"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/filemoon\.[^/]+\/[de]\/([^/?]+)/); if (!m) return u; const d = u.match(/(filemoon\.[^/]+)/)?.[1] || "filemoon.sx"; return `https://${d}/e/${m[1]}`; },
    toWatchUrl: (u) => { const m = u.match(/filemoon\.[^/]+\/[de]\/([^/?]+)/); if (!m) return u; const d = u.match(/(filemoon\.[^/]+)/)?.[1] || "filemoon.sx"; return `https://${d}/d/${m[1]}`; } },
  { name: "YouTube", domains: ["youtube.com","youtu.be","www.youtube.com"], requiresTopLevel: false,
    toEmbedUrl: (u) => { let m = u.match(/youtu\.be\/([^/?]+)/); if (m) return `https://www.youtube.com/embed/${m[1]}`; m = u.match(/youtube\.com\/watch\?v=([^&]+)/); if (m) return `https://www.youtube.com/embed/${m[1]}`; return u; },
    toWatchUrl: (u) => { const m = u.match(/youtube\.com\/embed\/([^/?]+)/); return m ? `https://www.youtube.com/watch?v=${m[1]}` : u; } },
  { name: "Vimeo", domains: ["vimeo.com","player.vimeo.com"], requiresTopLevel: false,
    toEmbedUrl: (u) => { const m = u.match(/vimeo\.com\/(\d+)/); return m ? `https://player.vimeo.com/video/${m[1]}` : u; },
    toWatchUrl: (u) => { const m = u.match(/player\.vimeo\.com\/video\/(\d+)/); return m ? `https://vimeo.com/${m[1]}` : u; } },
];
export function extractUrlFromInput(input) {
  const t = (input || "").trim();
  if (t.startsWith("<") || /<(iframe|embed|object|video|source)\s/i.test(t)) {
    for (const re of [
      /<iframe[^>]*\ssrc=["']([^"']+)["']/i,
      /<embed[^>]*\ssrc=["']([^"']+)["']/i,
      /<object[^>]*\sdata=["']([^"']+)["']/i,
      /<video[^>]*\ssrc=["']([^"']+)["']/i,
      /<source[^>]*\ssrc=["']([^"']+)["']/i,
    ]) { const m = t.match(re); if (m) return { url: m[1], isEmbedCode: true }; }
  }
  return { url: t, isEmbedCode: false };
}
function getHost(url) { return HOSTS.find((h) => h.domains.some((d) => url.includes(d))) || null; }
export function isEmbedUrl(url) { if (getHost(url)) return true; return ["/preview","/embed","/e/","/player","/watch"].some((p) => url.includes(p)); }
export function toEmbedUrl(url) { const h = getHost(url); return h ? h.toEmbedUrl(url) : url; }
export function toWatchUrl(url) { const h = getHost(url); return h ? h.toWatchUrl(url) : url; }
export function requiresTopLevel(url) { const h = getHost(url); return !!h?.requiresTopLevel; }
export function getHostName(url) { const h = getHost(url); return h?.name ?? "External site"; }
