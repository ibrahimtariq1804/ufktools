"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LivePageRefresher() {
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/featured-stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "NEW_FEATURED_POST") {
            router.refresh();
          }
        } catch {
          // Ignore parse errors on heartbeat
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // Browser offline or unsupported
    }

    return () => {
      eventSource?.close();
    };
  }, [router]);

  return null;
}
