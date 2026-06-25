export function loadJuicy(callback) {

    if (window.__juicyLoaded) {
        if (callback) callback();
        return;
    }

    const s = document.createElement("script");

    s.src = "https://poweredby.jads.co/js/jads.js";
    s.async = true;
    s.setAttribute("data-cfasync", "false");

    s.onload = () => {
        window.__juicyLoaded = true;

        if (callback) callback();
    };

    document.head.appendChild(s);
}

export function juicyBanner(containerId, zone, width, height) {

    const box = document.getElementById(containerId);

    if (!box) return;

    box.innerHTML = "";

    const ins = document.createElement("ins");

    ins.id = "juicy_" + zone + "_" + Date.now();

    ins.setAttribute("data-width", width);
    ins.setAttribute("data-height", height);

    box.appendChild(ins);

    window.adsbyjuicy = window.adsbyjuicy || [];

    window.adsbyjuicy.push({
        adzone: zone
    });

}
