"use client";

import { useEffect } from "react";
import { trackToolAction } from "@/lib/analytics";

export function ToolViewTracker({ toolSlug }: { toolSlug: string }) {
  useEffect(() => {
    trackToolAction(toolSlug, "view_tool");
  }, [toolSlug]);

  return null;
}
