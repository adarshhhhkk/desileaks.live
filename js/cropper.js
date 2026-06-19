export function openCropper(imageSrc, aspectRatio) {
  return new Promise((resolve, reject) => {

    const backdrop = document.createElement("div");

    backdrop.className = "modal-backdrop";

    backdrop.innerHTML = `
      <div class="modal" style="max-width:900px">
        <h3 class="text-lg font-bold mb-3">Crop image</h3>

        <div style="max-height:70vh;overflow:hidden">
          <img
            id="crop-image"
            src="${imageSrc}"
            style="display:block;max-width:100%;width:100%;"
          />
        </div>

        <div class="mt-3 flex justify-end gap-2">
          <button class="btn-outline" id="crop-cancel">
            Cancel
          </button>

          <button class="btn-primary" id="crop-save">
            Crop & Save
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const image = backdrop.querySelector("#crop-image");

    const cropper = new Cropper(image, {
      aspectRatio: aspectRatio,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      responsive: true,
      zoomable: true,
      movable: true,
      scalable: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      background: false
    });

    backdrop.querySelector("#crop-cancel")
      .addEventListener("click", () => {
        cropper.destroy();
        backdrop.remove();
        reject(new Error("cancelled"));
      });

    backdrop.querySelector("#crop-save")
      .addEventListener("click", () => {

        const canvas = cropper.getCroppedCanvas({
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high"
        });

        canvas.toBlob(
          (blob) => {

            cropper.destroy();
            backdrop.remove();

            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("blob"));
            }

          },
          "image/jpeg",
          0.92
        );

      });

  });
}

export function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export async function extractVideoFrame(file, atTime = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.addEventListener("loadedmetadata", () => {
      video.currentTime = atTime;
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      canvas.getContext("2d").drawImage(video, 0, 0);

      const url = canvas.toDataURL("image/jpeg", 0.9);

      URL.revokeObjectURL(video.src);

      resolve(url);
    });

    video.addEventListener("error", () =>
      reject(new Error("video load"))
    );

    video.src = URL.createObjectURL(file);
  });
}
