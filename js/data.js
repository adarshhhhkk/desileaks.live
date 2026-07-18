import { supabase, settle } from "./supabase-client.js";

let latestVideosPromise;

const VIDEO_CACHE_KEY = "latest-videos-cache";
const VIDEO_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function getLatestVideos(limit = 20) {

  if (latestVideosPromise)
    return latestVideosPromise.then(rows => rows.slice(0, limit));

  const cached = localStorage.getItem(VIDEO_CACHE_KEY);

  if (cached) {

    try {

      const parsed = JSON.parse(cached);

      if (Date.now() - parsed.time < VIDEO_CACHE_TTL) {

        latestVideosPromise = Promise.resolve(parsed.data);

        return latestVideosPromise.then(rows => rows.slice(0, limit));

      }

    } catch {}

  }

  latestVideosPromise = settle(

    supabase
      .from("videos")
      .select("id,title,description,thumbnail_url,thumbnail_34_url,duration,views,created_at,slug,category")
      .order("created_at", { ascending: false })
      .limit(150),

    []

  ).then(rows => {

    localStorage.setItem(

      VIDEO_CACHE_KEY,

      JSON.stringify({

        time: Date.now(),

        data: rows

      })

    );

    return rows;

  });

  return latestVideosPromise.then(rows => rows.slice(0, limit));

}
let categoriesPromise;

export function getLatestVideos(limit = 20) {
  if (!latestVideosPromise) {
    latestVideosPromise = settle(
      supabase
        .from("videos")
        .select("id,title,description,thumbnail_url,thumbnail_34_url,duration,views,created_at,slug,category")
        .order("created_at", { ascending: false })
        .limit(150),
      []
    );
  }
  return latestVideosPromise.then((rows) => rows.slice(0, limit));
}

export function getCategories(limit = 20) {
  if (!categoriesPromise) {
    categoriesPromise = settle(
      supabase.from("categories").select("id,name,image_url").order("display_order", { ascending: true }).limit(limit),
      []
    );
  }
  return categoriesPromise;
}
