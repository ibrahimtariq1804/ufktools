"use client";

import { useAnalyticsTracker } from "@/lib/analytics";

export function AnalyticsProvider() {
  useAnalyticsTracker();
  return null;
}
