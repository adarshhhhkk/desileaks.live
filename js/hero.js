import { escapeHtml } from "./video-card.js";
import { getLatestVideos } from "./data.js";

export async function mountHero(el, videosPromise = getLatestVideos(10)) {
  // Immediate skeleton so users see something within the first paint.
  el.innerHTML = `
    <div class="md:hidden w-full mt-6 px-3"><div class="skeleton aspect-34 w-full rounded-2xl"></div></div>
    <div class="hidden md:block w-full px-4 mt-8"><div class="skeleton aspect-cinema w-full rounded-2xl"></div></div>`;
  const data = (await videosPromise).slice(0, 10);
  if (!data.length) { el.innerHTML = ""; return; }
  const slides = [...data.slice(-1), ...data, data[0]];
  const card = (v, i) => `
    <a href="/watch/${encodeURIComponent(v.slug || v.id)}" class="hero-card" data-real-index="${i}">
      <picture>
  <source media="(min-width: 640px)" srcset="${v.thumbnail_url || v.thumbnail_34_url || '/assets/placeholder.svg'}">
  <img
    src="${v.thumbnail_34_url || v.thumbnail_url || '/assets/placeholder.svg'}"
    alt="${escapeHtml(v.title)}"
    class="w-full h-full object-cover"
    ${i > 1 ? 'loading="lazy"' : 'fetchpriority="high"'}
  />
</picture>
      <div class="hero-card-shade">
        <span>${i === 1 ? "Latest Upload" : "Latest"}</span>
        <h2>${escapeHtml(v.title)}</h2>
      </div>
    </a>`;
  el.innerHTML = `
    <section class="hero-loop" aria-label="Latest uploads">
      <div class="hero-window" data-hero-loop>
        <div class="hero-track">${slides.map(card).join("")}</div>
      </div>
    </section>`;
  initHeroLoop(el.querySelector("[data-hero-loop]"), data.length);
}
function initHeroLoop(root, total) {
  const track = root.querySelector(".hero-track");
  if (!track) return;
  let idx = 1;
  const update = (animate = true) => {
    track.style.transition = animate ? "transform .42s ease" : "none";
    const card = track.children[idx];
    if (!card) return;
    const rootCenter = root.clientWidth / 2;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    track.style.transform = `translateX(${rootCenter - cardCenter}px)`;
  };
  update(false);
  if (total <= 1) return;
  window.addEventListener("resize", () => update(false));
  setInterval(() => {
    idx += 1;
    update(true);
    if (idx === total + 1) setTimeout(() => { idx = 1; update(false); }, 430);
  }, 2000);
}
