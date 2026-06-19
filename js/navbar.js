import { onAuth, signOut } from "./auth.js";
import { toast } from "./toast.js";

const ICON = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  grid: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
};

export function mountNavbar() {
  const nav = document.createElement("nav");
  nav.className = "site-nav fixed top-0 left-0 right-0 z-40 backdrop-blur-sm";
  nav.style.background = "linear-gradient(to bottom, rgba(0,0,0,.95), rgba(0,0,0,.6), transparent)";
  nav.innerHTML = `
    <div class="nav-inner flex items-center justify-between">
      <a href="/" class="flex items-center nav-brand-gap">
        <img src="/assets/logo-small.webp" alt="Desileaks" class="nav-logo object-contain" />
        <h1 class="nav-title font-bold" style="color:var(--primary)">DESILEAKS</h1>
      </a>
      <div class="nav-actions flex items-center">
        <form id="nav-search" class="relative hidden md:block">
          <input name="q" type="search" placeholder="Search videos..." class="input" style="width:16rem" />
        </form>
        <button id="nav-search-toggle" class="btn-ghost md:hidden" title="Search" aria-label="Search">${ICON.search}</button>
        <a href="/category.html?name=All" class="btn-ghost" title="Categories" aria-label="Categories">${ICON.grid}</a>
        <span id="nav-admin"></span>
        <span id="nav-user"></span>
      </div>
    </div>
    <form id="nav-search-mobile" class="hidden px-3 pb-3 md:hidden">
      <input name="q" type="search" placeholder="Search videos..." class="input" />
    </form>`;
  document.body.prepend(nav);
  const submit = (e) => { e.preventDefault(); const q = new FormData(e.target).get("q")?.toString().trim(); if (q) location.href = `/search.html?q=${encodeURIComponent(q)}`; };
  nav.querySelector("#nav-search").addEventListener("submit", submit);
  const mob = nav.querySelector("#nav-search-mobile");
  mob.addEventListener("submit", submit);
  nav.querySelector("#nav-search-toggle").addEventListener("click", () => mob.classList.toggle("hidden"));
  onAuth((s) => {
    const adminEl = nav.querySelector("#nav-admin");
    const userEl = nav.querySelector("#nav-user");
    if (s.isAdmin) {
      adminEl.innerHTML = `<a href="/admin" class="btn-ghost" title="Admin" aria-label="Admin">${ICON.shield}</a>`;
    } else {
      adminEl.innerHTML = "";
    }
    if (s.user) {
      userEl.innerHTML = `<button id="nav-signout" class="btn-ghost" title="Sign out" aria-label="Sign out">${ICON.user}</button>`;
      userEl.querySelector("#nav-signout").addEventListener("click", async () => {
        await signOut(); toast("Signed out");
      });
    } else {
      userEl.innerHTML = "";
    }
  });
}