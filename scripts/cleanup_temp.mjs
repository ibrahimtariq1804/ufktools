/**
 * Automated Temporary File Sweeper for UFK Tools
 * Cleans temporary upload files and old caches older than MAX_AGE_HOURS.
 * Run via cron or systemd timer every 6–12 hours on production VPS.
 */

import fs from "node:fs";
import path from "node:path";

const MAX_AGE_HOURS = 24;
const MAX_AGE_MS = MAX_AGE_HOURS * 60 * 60 * 1000;

async function cleanupDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`[CLEANUP] Directory does not exist, skipping: ${dirPath}`);
    return 0;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const now = Date.now();
  let deletedCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isFile()) {
      try {
        const stats = fs.statSync(fullPath);
        const ageMs = now - stats.mtimeMs;
        if (ageMs > MAX_AGE_MS) {
          fs.unlinkSync(fullPath);
          console.log(`[CLEANUP] Deleted aged file (${Math.round(ageMs / 3600000)}h old): ${entry.name}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`[CLEANUP ERROR] Failed to inspect ${entry.name}:`, err.message);
      }
    } else if (entry.isDirectory()) {
      deletedCount += await cleanupDirectory(fullPath);
    }
  }

  return deletedCount;
}

async function run() {
  console.log("=== UFK Tools Temporary File Sweeper ===");
  console.log(`Threshold: > ${MAX_AGE_HOURS} hours old\n`);

  const tempDirs = [
    path.join(process.cwd(), "public", "uploads", "temp"),
    path.join(process.cwd(), ".next", "cache"),
  ];

  let totalDeleted = 0;
  for (const dir of tempDirs) {
    console.log(`Checking: ${dir}`);
    totalDeleted += await cleanupDirectory(dir);
  }

  console.log(`\n[COMPLETE] Cleaned up ${totalDeleted} expired temporary files.`);
}

run().catch(console.error);
