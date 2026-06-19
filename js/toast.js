function ensureRoot() {
  let r = document.getElementById("toast-root");
  if (!r) { r = document.createElement("div"); r.id = "toast-root"; document.body.appendChild(r); }
  return r;
}
export function toast({ title, description = "", variant = "default", duration = 3500 } = {}) {
  const root = ensureRoot();
  const el = document.createElement("div");
  el.className = "toast" + (variant === "destructive" ? " error" : "");
  el.innerHTML = `<div class="t-title"></div><div class="t-desc"></div>`;
  el.querySelector(".t-title").textContent = title || "";
  el.querySelector(".t-desc").textContent = description || "";
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, duration);
}