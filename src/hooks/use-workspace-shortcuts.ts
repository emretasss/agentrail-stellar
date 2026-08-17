import { useEffect, useRef } from "react";
import type { AppView } from "@/config/workspace-navigation";

const routes: Record<string, AppView> = {
  h: "overview",
  a: "discover",
  j: "jobs",
  c: "copilot",
  n: "network",
  r: "reputation",
  t: "treasury",
  p: "playbooks",
};

export function useWorkspaceShortcuts(onNavigate: (view: AppView) => void) {
  const awaitingRoute = useRef(false);
  useEffect(() => {
    let resetTimer: number | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (awaitingRoute.current && routes[key]) {
        event.preventDefault();
        onNavigate(routes[key]);
        awaitingRoute.current = false;
        window.clearTimeout(resetTimer);
        return;
      }
      if (key === "g" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        awaitingRoute.current = true;
        resetTimer = window.setTimeout(() => { awaitingRoute.current = false; }, 900);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); window.clearTimeout(resetTimer); };
  }, [onNavigate]);
}
