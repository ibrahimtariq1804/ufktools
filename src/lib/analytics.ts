"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Safe Beacon or Fetch transmitter
export function sendAnalyticsEvent(data: {
  eventType: "pageview" | "tool_action";
  path?: string;
  toolSlug?: string;
  action?: string;
}) {
  if (typeof window === "undefined") return;

  // Don't track administrative visits
  const currentPath = data.path || window.location.pathname;
  if (currentPath.startsWith("/admin")) return;

  const payload = JSON.stringify({
    ...data,
    path: currentPath,
    referrer: document.referrer || undefined,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking fail-safe
  }
}

// Track a specific tool interaction (e.g. merge completed, pdf converted, resume downloaded)
export function trackToolAction(toolSlug: string, action: string) {
  sendAnalyticsEvent({
    eventType: "tool_action",
    toolSlug,
    action,
  });
}

// Global hook to track page views across route changes
export function useAnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    // Avoid double firing on identical route re-renders
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    sendAnalyticsEvent({
      eventType: "pageview",
      path: pathname,
    });
  }, [pathname]);
}
