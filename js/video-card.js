export function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

/* Hover/touch prefetch: warm the next page's HTML and thumbnail so the
   next watch route renders almost instantly. */
const prefetched = new Set();
function prefetch(href, img) {
  if (!href || prefetched.has(href)) return;
  prefetched.add(href);
  try {
    const l = document.createElement("link");
    l.rel = "prefetch"; l.href = href; l.as = "document";
    document.head.appendChild(l);
  } catch {}
  if (img) {
    try {
      const p = document.createElement("link");
      p.rel = "preload"; p.as = "image"; p.href = img; p.fetchPriority = "high";
      document.head.appendChild(p);
    } catch {}
  }
}
if (typeof document !== "undefined") {
  const onHover = (e) => {
    const a = e.target.closest("a.video-card, a.hero-card");
    if (!a) return;
    const img = a.querySelector("img");
    prefetch(a.getAttribute("href"), img && img.getAttribute("src"));
  };
  document.addEventListener("pointerover", onHover, { passive: true });
  document.addEventListener("touchstart", onHover, { passive: true });
}

export function videoCardHTML(v) {
  const href = `/watch/${encodeURIComponent(v.slug || v.id)}`;
  const thumb = v.thumbnail_url
    ? `<img src="${v.thumbnail_url}" alt="${escapeHtml(v.title)}" loading="lazy" class="h-full w-full object-cover" />`
    : `<div class="flex h-full w-full items-center justify-center" style="background:var(--muted)"><span style="font-size:2.5rem">▶</span></div>`;
  const dur = v.duration ? `<div class="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold" style="background:rgba(0,0,0,.85)">${escapeHtml(v.duration)}</div>` : "";
  return `<a href="${href}" class="video-card block overflow-hidden">
    <div class="relative aspect-video overflow-hidden rounded-md">${thumb}${dur}</div>
    <div class="mt-2 px-0.5">
      <h3 class="text-xs sm:text-sm font-medium leading-tight" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(v.title)}</h3>
    </div>
  </a>`;
}
export function skeletonGridHTML(n = 8) {
  return `<div class="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">${
    Array.from({length:n}).map(()=>`<div><div class="skeleton aspect-video w-full"></div><div class="skeleton h-3 w-3/4 mt-2"></div><div class="skeleton h-3 w-1/2 mt-1"></div></div>`).join("")
  }</div>`;
}
export function gridHTML(videos) {
  return `<div class="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">${videos.map(videoCardHTML).join("")}</div>`;
}

