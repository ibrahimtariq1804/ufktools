import { sseBroadcaster } from "@/lib/sse/broadcaster";
import { FeaturedPostRecord } from "@/lib/db";


export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection greeting event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`)
      );

      // 2. Listener for featured post updates
      const onFeaturedUpdate = (post: FeaturedPostRecord) => {
        try {
          const payload = JSON.stringify({
            type: "NEW_FEATURED_POST",
            post: {
              id: post.id,
              title: post.title,
              fact: post.fact,
              imageUrl: post.imageUrl,
              thumbnailUrl: post.thumbnailUrl,
              publishedAt: post.publishedAt,
              isFeatured: post.isFeatured,
            },
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      sseBroadcaster.on("featured_update", onFeaturedUpdate);

      // 3. Heartbeat keep-alive every 20 seconds to prevent proxy timeouts
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      // 4. Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        sseBroadcaster.off("featured_update", onFeaturedUpdate);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx
    },
  });
}
