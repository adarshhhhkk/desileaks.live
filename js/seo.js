import { SITE_URL, SITE_TITLE, DEFAULT_DESC } from "./config.js";
const DEFAULT_IMG = "https://i.ibb.co/VWSBrzZb/Untitled-design.png";
const DEFAULT_KW = "desileaks, desi leaks, viral mms, bhabhi mms, indian mms, viral videos, desi videos";
function setMeta(attr, value, content) {
  let el = document.head.querySelector(`meta[${attr}="${value}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, value); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
export function applySEO({ title, description, image, url, type = "website", videoUrl, keywords } = {}) {
  const pageTitle = title ? `${title} | DESILEAKS` : SITE_TITLE;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMG;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const kw = keywords ? `${keywords}, ${DEFAULT_KW}` : DEFAULT_KW;
  document.title = pageTitle;
  setMeta("name", "description", desc);
  setMeta("name", "keywords", kw);
  setMeta("name", "robots", "index, follow");
  setLink("canonical", pageUrl);
  setMeta("property", "og:type", type);
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:title", pageTitle);
  setMeta("property", "og:description", desc);
  setMeta("property", "og:image", img);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", pageTitle);
  setMeta("name", "twitter:description", desc);
  setMeta("name", "twitter:image", img);
  if (type === "video.other" && videoUrl) {
    setMeta("property", "og:video", videoUrl);
    setMeta("property", "og:video:type", "video/mp4");
  }
}

export function injectVideoJsonLd(video) {
  const prev = document.getElementById("video-jsonld");
  if (prev) prev.remove();
  const data = {
  "@context": "https://schema.org",
  "@type": "VideoObject",

  name: video.title,

  description: video.description || video.title,

  thumbnailUrl: [
    video.thumbnail_url,
    video.thumbnail_34_url
  ].filter(Boolean),

  uploadDate: new Date(video.created_at).toISOString(),

    duration: (() => {
  if (!video.duration) return undefined;

  const parts = video.duration.split(":").map(Number);

  if (parts.length === 2) {
    return `PT${parts[0]}M${parts[1]}S`;
  }

  if (parts.length === 3) {
    return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  }

  return undefined;
})(),
    
  contentUrl: video.video_url,

  embedUrl: `${SITE_URL}/watch/${encodeURIComponent(video.slug || video.id)}`,

  url: `${SITE_URL}/watch/${encodeURIComponent(video.slug || video.id)}`,

  publisher: {
    "@type": "Organization",
    name: "DESILEAKS",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/assets/logo.png`
    }
  },

  isFamilyFriendly: false,

  inLanguage: "en",

  genre: video.category || "General",

  interactionStatistic: {
    "@type": "InteractionCounter",
    interactionType: {
      "@type": "WatchAction"
    },
    userInteractionCount: video.views || 0
  }
};
  const s = document.createElement("script");
  s.type = "application/ld+json"; s.id = "video-jsonld";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}
