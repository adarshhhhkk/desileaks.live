export function openCropper(imageSrc, aspect = 16 / 9) {
  return new Promise((resolve, reject) => {

    const img = new Image();

    img.onload = () => openCropModal(img, aspect, resolve, reject);

    img.onerror = () =>
      reject(new Error("Failed to load image"));

    img.src = imageSrc;

  });
}

function openCropModal(img, aspect, resolve, reject) {

  const outW = aspect < 1 ? 900 : 1280;
  const outH = Math.round(outW / aspect);

  const wrap = document.createElement("div");

  wrap.className = "modal-backdrop";

  wrap.innerHTML = `
    <div class="modal" style="max-width:600px">

      <h3 class="text-lg font-bold mb-3">
        Crop Thumbnail
      </h3>

      <div
        id="cropBox"
        style="
          width:100%;
          aspect-ratio:${aspect};
          overflow:hidden;
          background:#000;
          border-radius:12px;
          touch-action:none;
        "
      >
        <canvas style="width:100%;height:100%"></canvas>
      </div>

      <div class="mt-3">
        <label>Zoom</label>

        <input
          type="range"
          id="zoom"
          min="1"
          max="4"
          step="0.01"
          value="1"
          style="width:100%"
        />
      </div>

      <div class="mt-3 flex justify-end gap-2">

        <button
          class="btn-outline"
          id="cancelCrop"
        >
          Cancel
        </button>

        <button
          class="btn-primary"
          id="applyCrop"
        >
          Crop & Save
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(wrap);

  const box = wrap.querySelector("#cropBox");

  const canvas = wrap.querySelector("canvas");

  const ctx = canvas.getContext("2d");

  canvas.width = outW;
  canvas.height = outH;

  const baseScale = Math.max(
    outW / img.width,
    outH / img.height
  );

  let zoom = 1;

  let tx =
    (outW - img.width * baseScale) / 2;

  let ty =
    (outH - img.height * baseScale) / 2;

  function clampPan() {

    const s = baseScale * zoom;

    const iw = img.width * s;
    const ih = img.height * s;

    const minX = outW - iw;
    const minY = outH - ih;

    if (tx > 0) tx = 0;
    if (ty > 0) ty = 0;

    if (tx < minX) tx = minX;
    if (ty < minY) ty = minY;
  }

  function draw() {

    const s = baseScale * zoom;

    ctx.clearRect(
      0,
      0,
      outW,
      outH
    );

    ctx.drawImage(
      img,
      tx,
      ty,
      img.width * s,
      img.height * s
    );
  }

  clampPan();
  draw();

  const zoomInput =
    wrap.querySelector("#zoom");

  zoomInput.addEventListener("input", () => {

    const newZoom =
      parseFloat(zoomInput.value);

    const cx = outW / 2;
    const cy = outH / 2;

    const oldScale =
      baseScale * zoom;

    const newScale =
      baseScale * newZoom;

    tx =
      cx -
      ((cx - tx) / oldScale) *
        newScale;

    ty =
      cy -
      ((cy - ty) / oldScale) *
        newScale;

    zoom = newZoom;

    clampPan();
    draw();

  });

  let dragging = false;

  let lastX = 0;
  let lastY = 0;

  const rectScale = () =>
    outW /
    box.getBoundingClientRect().width;

  function start(e) {

    dragging = true;

    const p =
      e.touches?.[0] || e;

    lastX = p.clientX;
    lastY = p.clientY;
  }

  function move(e) {

    if (!dragging) return;

    e.preventDefault();

    const p =
      e.touches?.[0] || e;

    tx +=
      (p.clientX - lastX) *
      rectScale();

    ty +=
      (p.clientY - lastY) *
      rectScale();

    lastX = p.clientX;
    lastY = p.clientY;

    clampPan();
    draw();
  }

  function end() {
    dragging = false;
  }

  box.addEventListener(
    "mousedown",
    start
  );

  window.addEventListener(
    "mousemove",
    move
  );

  window.addEventListener(
    "mouseup",
    end
  );

  box.addEventListener(
    "touchstart",
    start,
    { passive: true }
  );

  box.addEventListener(
    "touchmove",
    move,
    { passive: false }
  );

  box.addEventListener(
    "touchend",
    end
  );

  function cleanup() {

    window.removeEventListener(
      "mousemove",
      move
    );

    window.removeEventListener(
      "mouseup",
      end
    );

    wrap.remove();
  }

  wrap.querySelector("#cancelCrop")
    .onclick = () => {

      cleanup();

      reject(
        new Error("cancelled")
      );
    };

  wrap.querySelector("#applyCrop")
    .onclick = () => {

      canvas.toBlob(
        (blob) => {

          cleanup();

          blob
            ? resolve(blob)
            : reject(
                new Error(
                  "Crop failed"
                )
              );
        },
        "image/jpeg",
        0.92
      );
    };
}

export function fileToDataURL(file) {

  return new Promise(
    (res, rej) => {

      const r =
        new FileReader();

      r.onloadend = () =>
        res(r.result);

      r.onerror = rej;

      r.readAsDataURL(file);
    }
  );
}

export async function extractVideoFrame(
  file,
  atTime = 1
) {

  return new Promise(
    (resolve, reject) => {

      const video =
        document.createElement(
          "video"
        );

      video.preload =
        "metadata";

      video.muted = true;

      video.playsInline = true;

      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime =
            atTime;
        }
      );

      video.addEventListener(
        "seeked",
        () => {

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            video.videoWidth;

          canvas.height =
            video.videoHeight;

          canvas
            .getContext("2d")
            .drawImage(
              video,
              0,
              0
            );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.9
            )
          );

          URL.revokeObjectURL(
            video.src
          );
        }
      );

      video.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "video load"
            )
          )
      );

      video.src =
        URL.createObjectURL(
          file
        );
    }
  );
}
