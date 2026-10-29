import { EventEmitter } from "events";
import { FeaturedPostRecord } from "@/lib/db";

// Persist the EventEmitter instance on globalThis across Next.js module reloads
const globalForSSE = globalThis as unknown as {
  sseBroadcaster?: EventEmitter;
};

export const sseBroadcaster = globalForSSE.sseBroadcaster ?? new EventEmitter();
sseBroadcaster.setMaxListeners(500);

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseBroadcaster = sseBroadcaster;
}

export function broadcastFeaturedUpdate(post: FeaturedPostRecord) {
  sseBroadcaster.emit("featured_update", post);
}
