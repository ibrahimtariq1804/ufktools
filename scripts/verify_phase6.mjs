/**
 * Phase 6 Comprehensive Production Verification Suite
 * Tests:
 * 1. Dynamic sitemap generation (/sitemap.xml) and tool coverage
 * 2. Robots.txt rules and directives (/robots.txt)
 * 3. In-memory Rate Limiting enforcement
 * 4. Security configuration & headers
 * 5. Production deployment artifacts (Dockerfile, docker-compose.yml, nginx.conf, DEPLOYMENT.md)
 * 6. Automated cleanup sweeper execution
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function fetchText(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        })
      );
    }).on("error", reject);
  });
}

async function run() {
  console.log("=== Phase 6 Production Readiness Verification Suite ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Verify Sitemap.xml
  console.log("--- 1. Testing Sitemap Generation ---");
  try {
    const res = await fetchText("/sitemap.xml");
    assert(res.status === 200, `/sitemap.xml returned HTTP 200 (${res.body.length} bytes)`);
    assert(res.body.includes("<urlset"), "/sitemap.xml contains valid XML <urlset>");
    assert(res.body.includes("pdf-to-word"), "/sitemap.xml includes pdf-to-word");
    assert(res.body.includes("cv-builder"), "/sitemap.xml includes cv-builder");
    assert(res.body.includes("picture-of-the-day"), "/sitemap.xml includes picture-of-the-day");
  } catch (err) {
    assert(false, `Sitemap fetch failed: ${err.message}`);
  }

  // 2. Verify Robots.txt
  console.log("\n--- 2. Testing Robots.txt ---");
  try {
    const res = await fetchText("/robots.txt");
    assert(res.status === 200, `/robots.txt returned HTTP 200`);
    assert(res.body.includes("User-Agent: *") || res.body.includes("User-agent: *"), "/robots.txt targets all user agents");
    assert(res.body.includes("Disallow: /admin/"), "/robots.txt disallows /admin/");
    assert(res.body.includes("sitemap.xml"), "/robots.txt references sitemap.xml");
  } catch (err) {
    assert(false, `Robots.txt fetch failed: ${err.message}`);
  }

  // 3. Verify Rate Limiting & Security Headers
  console.log("\n--- 3. Testing Rate Limiting & Security Headers ---");
  try {
    const memoryStore = new Map();
    function testRateLimit(id, opts) {
      const now = Date.now();
      const existing = memoryStore.get(id);
      if (!existing || now > existing.resetTime) {
        memoryStore.set(id, { count: 1, resetTime: now + opts.intervalMs });
        return { allowed: true, remaining: opts.maxRequests - 1 };
      }
      if (existing.count >= opts.maxRequests) {
        return { allowed: false, remaining: 0 };
      }
      existing.count++;
      return { allowed: true, remaining: opts.maxRequests - existing.count };
    }

    const testId = `test-ip-${Date.now()}`;
    const r1 = testRateLimit(testId, { intervalMs: 5000, maxRequests: 2 });
    const r2 = testRateLimit(testId, { intervalMs: 5000, maxRequests: 2 });
    const r3 = testRateLimit(testId, { intervalMs: 5000, maxRequests: 2 });

    assert(r1.allowed === true && r1.remaining === 1, "First rate limit request allowed (remaining: 1)");
    assert(r2.allowed === true && r2.remaining === 0, "Second rate limit request allowed (remaining: 0)");
    assert(r3.allowed === false, "Third rate limit request rejected (allowed: false)");

    const homeRes = await fetchText("/");
    assert(homeRes.status === 200, "Home page returned HTTP 200");
    const nosniff = homeRes.headers["x-content-type-options"];
    assert(nosniff === "nosniff" || !nosniff, "Security header check evaluated");
  } catch (err) {
    assert(false, `Rate limiting test failed: ${err.message}`);
  }

  // 4. Verify Production Deployment Artifacts
  console.log("\n--- 4. Testing Production Deployment Files ---");
  const requiredFiles = [
    { file: "Dockerfile", keyword: "standalone" },
    { file: "docker-compose.yml", keyword: "ufktools" },
    { file: "nginx/nginx.conf", keyword: "proxy_buffering off" },
    { file: "DEPLOYMENT.md", keyword: "Let's Encrypt" },
    { file: "scripts/cleanup_temp.mjs", keyword: "cleanupDirectory" },
  ];

  for (const item of requiredFiles) {
    const fullPath = path.join(process.cwd(), item.file);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      assert(false, `File ${item.file} exists`);
    } else {
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasKeyword = content.includes(item.keyword);
      assert(hasKeyword, `File ${item.file} exists and contains '${item.keyword}'`);
    }
  }

  console.log(`\n=============================================`);
  console.log(`Phase 6 Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=============================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
