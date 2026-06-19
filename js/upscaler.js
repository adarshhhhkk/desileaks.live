// Free client-side image upscaler using pica (Lanczos resampling).
// Runs entirely in the browser - no API keys, no servers, no cost.
// Upscales thumbnails 2x with high-quality Lanczos3 filter + light sharpening
// so they look crisp on Retina/4K screens and on large hero banners.

import pica from "https://esm.sh/pica@9";

const picaInstance = pica({ features: ["js", "wasm", "ww"] });

/**
 * Upscale an image Blob by `scale` (default 2x) using Lanczos resampling.
 * Falls back to the original blob if anything fails.
 * @param {Blob} blob - source image blob (jpeg/png/webp)
 * @param {number} scale - upscale factor (2 recommended; 3-4 for tiny inputs)
 * @returns {Promise<Blob>} upscaled JPEG blob (quality 0.92)
 */
export async function upscaleBlob(blob, scale = 2) {
  try {
    if (!blob || !(blob instanceof Blob)) return blob;
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);

    // Don't upscale already-huge images (over 2000px) - waste of bytes.
    const maxSide = Math.max(img.width, img.height);
    const effectiveScale = maxSide >= 2000 ? 1 : scale;
    if (effectiveScale === 1) return blob;

    const src = document.createElement("canvas");
    src.width = img.width; src.height = img.height;
    src.getContext("2d").drawImage(img, 0, 0);

    const dst = document.createElement("canvas");
    dst.width = Math.round(img.width * effectiveScale);
    dst.height = Math.round(img.height * effectiveScale);

    await picaInstance.resize(src, dst, {
      filter: "lanczos3",
      unsharpAmount: 80,    // light sharpening pass
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    });

    const out = await picaInstance.toBlob(dst, "image/jpeg", 0.92);
    return out || blob;
  } catch (e) {
    console.warn("[upscaler] falling back to original:", e);
    return blob;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
