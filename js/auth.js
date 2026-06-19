import { supabase } from "./supabase-client.js";

const listeners = new Set();
let state = { user: null, session: null, isAdmin: false, loading: true };
function emit() { listeners.forEach((l) => l(state)); }
let bootstrapped = false;
let pendingSession = null;

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ data: null, error: new Error("Auth timed out") }), ms)),
  ]);
}

async function refreshAdmin(userId) {
  if (!userId) { state.isAdmin = false; return false; }
  try {
    const { data, error } = await withTimeout(
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
    );
    if (error) throw error;
    state.isAdmin = !!data;
    return state.isAdmin;
  } catch (error) {
    console.warn("Admin role check failed", error?.message || error);
    state.isAdmin = false;
    return false;
  }
}

async function applySession(session) {
  state.session = session;
  state.user = session?.user ?? null;
  state.isAdmin = false;
  await refreshAdmin(state.user?.id);
  state.loading = false;
  emit();
}

supabase.auth.onAuthStateChange(async (_e, session) => {
  pendingSession = session;
  if (!bootstrapped) return;
  setTimeout(() => applySession(session), 0);
});

const ready = (async () => {
  try {
    const { data } = await withTimeout(supabase.auth.getSession(), 3500);
    await applySession(data?.session ?? pendingSession ?? null);
  } catch (error) {
    console.warn("Auth bootstrap failed", error?.message || error);
    await applySession(pendingSession ?? null);
  } finally {
    bootstrapped = true;
  }
})();

export function getAuth() { return state; }
export function onAuth(cb) { listeners.add(cb); cb(state); return () => listeners.delete(cb); }
export async function signOut() { await supabase.auth.signOut(); }
export function waitForAuth() {
  return new Promise((resolve) => {
    if (!state.loading) return resolve(state);
    const off = onAuth((s) => { if (!s.loading) { off(); resolve(s); } });
  });
}