import { isEmbedUrl, toEmbedUrl, toWatchUrl, requiresTopLevel, getHostName } from "./video-url-handler.js";
export function videoPlayerHTML(src, poster) {
  if (isEmbedUrl(src)) {
    const embedded = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (requiresTopLevel(src) && embedded) {
      return `<div class="relative aspect-video w-full overflow-hidden rounded-lg bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div style="font-size:2rem">⚠️</div>
        <h3 class="text-lg font-semibold">Playback blocked in embedded preview</h3>
        <p class="text-sm" style="color:var(--muted-foreground)">${getHostName(src)} blocks playback inside embedded frames.</p>
        <a class="btn-primary" target="_blank" rel="noopener" href="${toWatchUrl(src)}">Watch in new tab</a>
      </div>`;
    }
  return `<div class="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
  <iframe
      src="${toEmbedUrl(src)}"
      class="h-full w-full"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      style="border:0">
  </iframe>
</div>`;
  }
  return `<div class="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
    <video controls controlsList="nodownload" class="h-full w-full" ${poster ? `poster="${poster}"` : ""}>
      <source src="${src}" type="video/mp4" />Your browser does not support the video tag.
    </video>
  </div>`;
}
