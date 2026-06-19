import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const REQUEST_TIMEOUT_MS = 6500;

function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
  global: { fetch: fetchWithTimeout },
});

export async function settle(promise, fallback = null) {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return data ?? fallback;
  } catch (error) {
    console.warn("Backend request failed", error?.message || error);
    return fallback;
  }
}