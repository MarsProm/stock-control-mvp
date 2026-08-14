import type { AuthChangeEvent } from "@supabase/supabase-js";

export function authFlowTypeFromUrl() {
  const hashType = new URLSearchParams(window.location.hash.slice(1)).get(
    "type",
  );
  return hashType ?? new URLSearchParams(window.location.search).get("type");
}

export function requiresPasswordSetup(
  event: AuthChangeEvent,
  flowType: string | null,
) {
  return (
    event === "PASSWORD_RECOVERY" ||
    flowType === "invite" ||
    flowType === "recovery"
  );
}

export function openPasswordSetup() {
  if (window.location.pathname === "/accept-invitation") return;
  window.history.replaceState(
    window.history.state,
    "",
    "/accept-invitation",
  );
  window.dispatchEvent(new PopStateEvent("popstate"));
}
