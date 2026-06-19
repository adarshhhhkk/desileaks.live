// Simple aspect-locked image cropper using a canvas. Returns Blob.
export function openCropper(imageSrc, aspectRatio) {
  return new Promise((resolve, reject) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" style="max-width:720px">
        <h3 class="text-lg font-bold mb-3">Crop image</h3>
        <div id="crop-stage" style="position:relative; width:100%; height:60vh; max-height:480px; overflow:hidden; background:#111; border-radius:.5rem">
          <img id="crop-img" src="${imageSrc}" alt="" style="position:absolute; user-select:none; -webkit-user-drag:none; transform-origin: top left;" />
          <div id="crop-frame" style="position:absolute; border:2px solid #fff; box-shadow:0 0 0 9999px rgba(0,0,0,.55); pointer-events:none;"></div>
        </div>
        <div class="mt-2 flex items-center gap-3"><label class="text-sm">Zoom</label>
          <input id="crop-zoom" type="range" min="1" max="4" step="0.01" value="1" style="flex:1" /></div>
        <div class="mt-3 flex justify-end gap-2">
          <button class="btn-outline" id="crop-cancel">Cancel</button>
          <button class="btn-primary" id="crop-ok">Crop & save</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    const stage = backdrop.querySelector("#crop-stage");
    const img = backdrop.querySelector("#crop-img");
    const frame = backdrop.querySelector("#crop-frame");
    const zoomInput = backdrop.querySelector("#crop-zoom");
    let baseScale = 1, zoom = 1, offsetX = 0, offsetY = 0;
    let frameW = 0, frameH = 0, frameX = 0, frameY = 0;
    img.onload = () => {
      const sw = stage.clientWidth, sh = stage.clientHeight;
      if (sw / sh > aspectRatio) { frameH = sh * 0.9; frameW = frameH * aspectRatio; }
      else { frameW = sw * 0.9; frameH = frameW / aspectRatio; }
      frameX = (sw - frameW) / 2; frameY = (sh - frameH) / 2;
      Object.assign(frame.style, { left: frameX+"px", top: frameY+"px", width: frameW+"px", height: frameH+"px" });
      baseScale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
      const dispW = img.naturalWidth * baseScale, dispH = img.naturalHeight * baseScale;
      offsetX = (sw - dispW) / 2; offsetY = (sh - dispH) / 2;
      applyTransform();
    };
    function applyTransform() { img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${baseScale * zoom})`; }
    function clampOffsets() {
      const dispW = img.naturalWidth * baseScale * zoom, dispH = img.naturalHeight * baseScale * zoom;
      const minX = frameX + frameW - dispW, minY = frameY + frameH - dispH;
      offsetX = Math.min(frameX, Math.max(minX, offsetX));
      offsetY = Math.min(frameY, Math.max(minY, offsetY));
    }
    zoomInput.addEventListener("input", () => {
      const oldScale = baseScale * zoom; zoom = parseFloat(zoomInput.value);
      const newScale = baseScale * zoom;
      const cx = frameX + frameW / 2, cy = frameY + frameH / 2;
      offsetX = cx - (cx - offsetX) * (newScale / oldScale);
      offsetY = cy - (cy - offsetY) * (newScale / oldScale);
      clampOffsets(); applyTransform();
    });
    let dragging = false, sx = 0, sy = 0;
    stage.addEventListener("mousedown", (e) => { dragging = true; sx = e.clientX - offsetX; sy = e.clientY - offsetY; });
    window.addEventListener("mousemove", (e) => { if (!dragging) return; offsetX = e.clientX - sx; offsetY = e.clientY - sy; clampOffsets(); applyTransform(); });
    window.addEventListener("mouseup", () => dragging = false);
    stage.addEventListener("touchstart", (e) => { const t = e.touches[0]; dragging = true; sx = t.clientX - offsetX; sy = t.clientY - offsetY; }, { passive: true });
    stage.addEventListener("touchmove", (e) => { if (!dragging) return; const t = e.touches[0]; offsetX = t.clientX - sx; offsetY = t.clientY - sy; clampOffsets(); applyTransform(); }, { passive: true });
    stage.addEventListener("touchend", () => dragging = false);
    backdrop.querySelector("#crop-cancel").addEventListener("click", () => { backdrop.remove(); reject(new Error("cancelled")); });
    backdrop.querySelector("#crop-ok").addEventListener("click", () => {
      const scale = baseScale * zoom;
      const sxImg = (frameX - offsetX) / scale, syImg = (frameY - offsetY) / scale;
      const swImg = frameW / scale, shImg = frameH / scale;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(swImg); canvas.height = Math.round(shImg);
      canvas.getContext("2d").drawImage(img, sxImg, syImg, swImg, shImg, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { backdrop.remove(); blob ? resolve(blob) : reject(new Error("blob")); }, "image/jpeg", 0.9);
    });
  });
}
export function fileToDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
export async function extractVideoFrame(file, atTime = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true; video.playsInline = true;
    video.addEventListener("loadedmetadata", () => { video.currentTime = atTime; });
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const url = canvas.toDataURL("image/jpeg", 0.9);
      URL.revokeObjectURL(video.src); resolve(url);
    });
    video.addEventListener("error", () => reject(new Error("video load")));
    video.src = URL.createObjectURL(file);
  });
}