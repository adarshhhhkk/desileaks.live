import { supabase, settle } from "./supabase-client.js";

let latestVideosPromise;
let categoriesPromise;

export function getLatestVideos(limit = 20) {
  if (!latestVideosPromise) {
    latestVideosPromise = settle(
      supabase
        .from("videos")
        .select("id,title,description,thumbnail_url,thumbnail_34_url,duration,views,created_at,slug,category")
        .order("created_at", { ascending: false })
        .limit(20),
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