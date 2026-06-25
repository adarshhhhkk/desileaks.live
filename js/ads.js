export function loadJuicy() {
    if (window.__juicyLoaded) return;

    window.__juicyLoaded = true;

    const s = document.createElement("script");
    s.src = "https://poweredby.jads.co/js/jads.js";
    s.async = true;
    s.setAttribute("data-cfasync", "false");

    document.head.appendChild(s);
}

export function juicyBanner(containerId, zone, width, height) {

    const box = document.getElementById(containerId);

    if (!box) return;

    box.innerHTML = "";

    const ins = document.createElement("ins");

    ins.id = "juicy_" + zone + "_" + Math.random().toString(36).slice(2);

    ins.dataset.width = width;
    ins.dataset.height = height;

    box.appendChild(ins);

    const script = document.createElement("script");

    script.type = "text/javascript";

    script.text =
        `(adsbyjuicy = window.adsbyjuicy || []).push({adzone:${zone}});`;

    box.appendChild(script);
}
