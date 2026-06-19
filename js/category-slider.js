import { escapeHtml } from "./video-card.js";
import { getCategories } from "./data.js";

export async function mountCategorySlider(el) {
  const data = await getCategories(20);
  if (!data.length) { el.innerHTML = ""; return; }
  const palette = ["#ec4899","#a855f7","#3b82f6","#22c55e","#f59e0b","#ef4444","#6366f1","#14b8a6"];
  el.innerHTML = `
    <div class="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:container lg:mx-auto">
      <h2 class="mb-3 text-lg font-bold sm:text-xl">Categories</h2>
      <div class="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        ${data.map(c => {
          const color = palette[c.name.split("").reduce((a,ch)=>a+ch.charCodeAt(0),0) % palette.length];
          return `<a href="/category?name=${encodeURIComponent(c.name)}" class="flex flex-col items-center gap-2 flex-shrink-0">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center" style="${c.image_url ? '' : `background:${color}`}">
              ${c.image_url ? `<img src="${c.image_url}" alt="${escapeHtml(c.name)}" class="w-full h-full object-cover" />` : `<span class="text-xl sm:text-2xl font-bold text-white">${escapeHtml(c.name.charAt(0).toUpperCase())}</span>`}
            </div>
            <span class="text-xs sm:text-sm font-medium" style="color:var(--muted-foreground);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.name.trim())}</span>
          </a>`;
        }).join("")}
      </div>
    </div>`;
}