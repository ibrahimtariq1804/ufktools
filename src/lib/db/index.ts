import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface FeaturedPostRecord {
  id: string;
  title: string;
  fact: string;
  imageUrl: string;
  imageFilename: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  isFeatured: boolean;
  publishedAt: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: "pageview" | "tool_action";
  path: string;
  toolSlug?: string;
  action?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;
  referrer?: string;
  visitorHash: string;
  createdAt: string;
}

// PostgreSQL Pool instance if DATABASE_URL is set
let pgPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
}

let ensuredPgSchema = false;
async function ensurePgTables() {
  if (!pgPool || ensuredPgSchema) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS featured_posts (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        fact TEXT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        image_filename VARCHAR(255) NOT NULL,
        thumbnail_url VARCHAR(500),
        youtube_url VARCHAR(500),
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(32) NOT NULL DEFAULT 'pageview',
        path VARCHAR(255) NOT NULL,
        tool_slug VARCHAR(100),
        action VARCHAR(100),
        country_code VARCHAR(10) NOT NULL DEFAULT 'UNKNOWN',
        city VARCHAR(100) NOT NULL DEFAULT 'Unknown',
        region VARCHAR(100) NOT NULL DEFAULT 'Unknown',
        device_type VARCHAR(20) NOT NULL DEFAULT 'desktop',
        browser VARCHAR(50) NOT NULL DEFAULT 'Unknown',
        os VARCHAR(50) NOT NULL DEFAULT 'Unknown',
        referrer VARCHAR(255) NOT NULL DEFAULT 'direct',
        visitor_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country_code);
    `);

    // Ensure initial admin user exists
    const check = await pgPool.query("SELECT COUNT(*) FROM admins");
    if (parseInt(check.rows[0].count, 10) === 0) {
      const initialEmail = process.env.ADMIN_EMAIL || "admin@ufktools.com";
      const initialPassword = process.env.ADMIN_PASSWORD || "admin123";
      const initialName = process.env.ADMIN_NAME || "UFK Administrator";
      const hash = bcrypt.hashSync(initialPassword, 10);
      await pgPool.query(
        "INSERT INTO admins (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
        [crypto.randomUUID(), initialEmail, hash, initialName]
      );
    }

    ensuredPgSchema = true;
  } catch (err) {
    console.error("Error ensuring PostgreSQL tables:", err);
  }
}

// Local File Store for Development when DATABASE_URL is not configured
interface LocalStore {
  admins: AdminUser[];
  posts: FeaturedPostRecord[];
  analytics?: AnalyticsEvent[];
}

function getStoreFilePath(): string {
  // If running in Vercel or AWS Lambda, process.cwd() is read-only.
  // Use os.tmpdir() for writable file storage.
  const isReadOnlyEnv = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isReadOnlyEnv) {
    const tmpDir = path.join(os.tmpdir(), "ufk-db");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return path.join(tmpDir, "store.json");
  }

  const localDir = path.join(process.cwd(), ".db");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
  } catch {}
  return path.join(localDir, "store.json");
}

function ensureLocalStore(): LocalStore {
  const storeFile = getStoreFilePath();
  const bundledFile = path.join(process.cwd(), ".db", "store.json");

  if (fs.existsSync(storeFile)) {
    try {
      const raw = fs.readFileSync(storeFile, "utf-8");
      const parsed = JSON.parse(raw) as LocalStore;
      if (!parsed.admins || parsed.admins.length === 0) {
        parsed.admins = [
          {
            id: "admin-default-uuid",
            email: process.env.ADMIN_EMAIL || "admin@ufktools.com",
            passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10),
            name: process.env.ADMIN_NAME || "UFK Administrator",
            createdAt: new Date().toISOString(),
          },
        ];
      }
      if (!parsed.analytics) parsed.analytics = [];
      return parsed;
    } catch {}
  }

  if (storeFile !== bundledFile && fs.existsSync(bundledFile)) {
    try {
      const raw = fs.readFileSync(bundledFile, "utf-8");
      const parsed = JSON.parse(raw) as LocalStore;
      if (!parsed.admins || parsed.admins.length === 0) {
        parsed.admins = [
          {
            id: "admin-default-uuid",
            email: process.env.ADMIN_EMAIL || "admin@ufktools.com",
            passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10),
            name: process.env.ADMIN_NAME || "UFK Administrator",
            createdAt: new Date().toISOString(),
          },
        ];
      }
      if (!parsed.analytics) parsed.analytics = [];
      try {
        fs.writeFileSync(storeFile, JSON.stringify(parsed, null, 2), "utf-8");
      } catch {}
      return parsed;
    } catch {}
  }

  // Seed initial administrator from environment variables or default
  const initialEmail = process.env.ADMIN_EMAIL || "admin@ufktools.com";
  const initialPassword = process.env.ADMIN_PASSWORD || "admin123";
  const initialName = process.env.ADMIN_NAME || "UFK Administrator";

  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync(initialPassword, defaultSalt);

  const initialStore: LocalStore = {
    admins: [
      {
        id: "admin-default-uuid",
        email: initialEmail,
        passwordHash: defaultPasswordHash,
        name: initialName,
        createdAt: new Date().toISOString(),
      },
    ],
    posts: [
      {
        id: "post-seed-001",
        title: "The James Webb Space Telescope's Cosmic Marvel",
        fact: "Did you know? Light from galaxies captured in deep-field images by modern space observatories has traveled through space for over 13.4 billion years—originating shortly after the dawn of our universe itself.",
        imageUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
        imageFilename: "demo-space.jpg",
        isFeatured: true,
        publishedAt: "2026-10-28T00:00:00.000Z",
        createdAt: "2026-10-28T00:00:00.000Z",
        updatedAt: "2026-10-28T00:00:00.000Z",
      },
    ],
    analytics: [],
  };

  try {
    fs.writeFileSync(storeFile, JSON.stringify(initialStore, null, 2), "utf-8");
  } catch (err) {
    console.warn("Unable to write initial store to disk:", err);
  }

  return initialStore;
}

function saveLocalStore(store: LocalStore) {
  try {
    const storeFile = getStoreFilePath();
    fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("Unable to save local store to disk:", err);
  }
}

// Encrypted Cloud Synchronization for Serverless Persistence
const CLOUD_SYNC_OBJECT_ID = "ff808181a09d98f701a1895bf5bc5759";
const SYNC_SECRET = process.env.SESSION_SECRET || "ufk-tools-production-secret-encryption-key-2026-safe";

function encryptAdminPayload(admin: AdminUser) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(SYNC_SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(JSON.stringify(admin), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return {
    iv: iv.toString("hex"),
    tag: authTag,
    payload: encrypted,
  };
}

function decryptAdminPayload(encryptedObj: { iv: string; tag: string; payload: string }): AdminUser | null {
  try {
    const iv = Buffer.from(encryptedObj.iv, "hex");
    const authTag = Buffer.from(encryptedObj.tag, "hex");
    const key = crypto.createHash("sha256").update(SYNC_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedObj.payload, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted) as AdminUser;
  } catch {
    return null;
  }
}

async function syncAdminToCloud(admin: AdminUser): Promise<void> {
  try {
    const encrypted = encryptAdminPayload(admin);
    await fetch(`https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "ufk_admin_credentials_v1",
        data: encrypted,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.warn("Cloud admin sync failed:", err);
  }
}

async function fetchAdminFromCloud(): Promise<AdminUser | null> {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.payload) {
        return decryptAdminPayload(json.data);
      }
    }
  } catch (err) {
    console.warn("Cloud admin fetch failed:", err);
  }
  return null;
}

// Persistent Cloud Synchronization for Serverless Analytics
const CLOUD_ANALYTICS_OBJECT_ID = "ff808181a09d98f701a191cd4fb272f9";

async function syncAnalyticsToCloud(events: AnalyticsEvent[]): Promise<void> {
  try {
    await fetch(`https://api.restful-api.dev/objects/${CLOUD_ANALYTICS_OBJECT_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "ufk_analytics_store_v1",
        data: {
          lastUpdated: new Date().toISOString(),
          events: events.slice(-300), // retain latest 300 active events across serverless restarts
        },
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.warn("Cloud analytics sync failed:", err);
  }
}

async function fetchAnalyticsFromCloud(): Promise<AnalyticsEvent[]> {
  try {
    const res = await fetch(`https://api.restful-api.dev/objects/${CLOUD_ANALYTICS_OBJECT_ID}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.events)) {
        return json.data.events as AnalyticsEvent[];
      }
    }
  } catch (err) {
    console.warn("Cloud analytics fetch failed:", err);
  }
  return [];
}

export const db = {
  // Admin Operations
  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    if (pgPool) {
      try {
        await ensurePgTables();
        const res = await pgPool.query(
          "SELECT id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\" FROM admins WHERE LOWER(email) = LOWER($1)",
          [email]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        console.error("PostgreSQL query error in getAdminByEmail, falling back to local store:", err);
      }
    }

    // Check cloud synchronized state for latest updated credentials across serverless instances
    const cloudAdmin = await fetchAdminFromCloud();
    if (cloudAdmin) {
      const store = ensureLocalStore();
      const existingIdx = store.admins.findIndex(
        (a) => a.id === cloudAdmin.id || a.email.toLowerCase() === cloudAdmin.email.toLowerCase()
      );
      if (existingIdx >= 0) {
        store.admins[existingIdx] = cloudAdmin;
      } else {
        store.admins.unshift(cloudAdmin);
      }
      saveLocalStore(store);

      if (cloudAdmin.email.toLowerCase() === email.toLowerCase()) {
        return cloudAdmin;
      }
    }

    const store = ensureLocalStore();
    return (
      store.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null
    );
  },

  async getAdminById(id: string): Promise<AdminUser | null> {
    if (pgPool) {
      try {
        await ensurePgTables();
        const res = await pgPool.query(
          "SELECT id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\" FROM admins WHERE id = $1",
          [id]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        console.error("PostgreSQL query error in getAdminById, falling back to local store:", err);
      }
    }

    const cloudAdmin = await fetchAdminFromCloud();
    if (cloudAdmin) {
      const store = ensureLocalStore();
      const existingIdx = store.admins.findIndex((a) => a.id === cloudAdmin.id);
      if (existingIdx >= 0) {
        store.admins[existingIdx] = cloudAdmin;
      } else {
        store.admins.unshift(cloudAdmin);
      }
      saveLocalStore(store);

      if (cloudAdmin.id === id) {
        return cloudAdmin;
      }
    }

    const store = ensureLocalStore();
    return store.admins.find((a) => a.id === id) || null;
  },

  async updateAdminProfile(id: string, name: string, email: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (pgPool) {
      try {
        await ensurePgTables();
        const res = await pgPool.query(
          "UPDATE admins SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\"",
          [cleanName, cleanEmail, id]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        console.error("PostgreSQL query error in updateAdminProfile, falling back to local store:", err);
      }
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id) || store.admins[0];
    if (!admin) throw new Error("Admin user not found");

    const existingOther = store.admins.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.id !== admin.id
    );
    if (existingOther) {
      throw new Error("This email address is already in use by another administrator.");
    }

    admin.name = cleanName;
    admin.email = cleanEmail;
    saveLocalStore(store);

    // Persist to encrypted cloud store across serverless instances
    await syncAdminToCloud(admin);
    return admin;
  },

  async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
    if (pgPool) {
      try {
        await ensurePgTables();
        await pgPool.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
        return;
      } catch (err) {
        console.error("PostgreSQL query error in updateAdminPassword, falling back to local store:", err);
      }
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id) || store.admins[0];
    if (!admin) throw new Error("Admin user not found");

    admin.passwordHash = passwordHash;
    saveLocalStore(store);

    // Persist to encrypted cloud store across serverless instances
    await syncAdminToCloud(admin);
  },

  async updateAdminLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (pgPool) {
      try {
        await ensurePgTables();
        await pgPool.query("UPDATE admins SET last_login_at = $1 WHERE id = $2", [now, id]);
        return;
      } catch (err) {
        console.error("PostgreSQL query error in updateAdminLogin, falling back to local store:", err);
      }
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id);
    if (admin) {
      admin.lastLoginAt = now;
      saveLocalStore(store);
      await syncAdminToCloud(admin);
    }
  },

  // Featured Post Operations
  async getFeaturedPost(): Promise<FeaturedPostRecord | null> {
    if (pgPool) {
      const res = await pgPool.query(
        `SELECT id, title, fact, image_url as "imageUrl", image_filename as "imageFilename",
                thumbnail_url as "thumbnailUrl", youtube_url as "youtubeUrl", is_featured as "isFeatured",
                published_at as "publishedAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM featured_posts
         WHERE is_featured = TRUE
         LIMIT 1`
      );
      return res.rows[0] || null;
    }

    const store = ensureLocalStore();
    return store.posts.find((p) => p.isFeatured) || store.posts[0] || null;
  },

  async getAllPosts(): Promise<FeaturedPostRecord[]> {
    if (pgPool) {
      const res = await pgPool.query(
        `SELECT id, title, fact, image_url as "imageUrl", image_filename as "imageFilename",
                thumbnail_url as "thumbnailUrl", youtube_url as "youtubeUrl", is_featured as "isFeatured",
                published_at as "publishedAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM featured_posts
         ORDER BY published_at DESC`
      );
      return res.rows;
    }

    const store = ensureLocalStore();
    return [...store.posts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  },

  async getPostById(id: string): Promise<FeaturedPostRecord | null> {
    if (pgPool) {
      const res = await pgPool.query(
        `SELECT id, title, fact, image_url as "imageUrl", image_filename as "imageFilename",
                thumbnail_url as "thumbnailUrl", is_featured as "isFeatured",
                published_at as "publishedAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM featured_posts
         WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }

    const store = ensureLocalStore();
    return store.posts.find((p) => p.id === id) || null;
  },

  async createPost(data: {
    title: string;
    fact: string;
    imageUrl: string;
    imageFilename: string;
    thumbnailUrl?: string;
    youtubeUrl?: string;
    isFeatured: boolean;
    createdBy?: string;
  }): Promise<FeaturedPostRecord> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query("BEGIN");

        if (data.isFeatured) {
          await client.query("UPDATE featured_posts SET is_featured = FALSE WHERE is_featured = TRUE");
        }

        const res = await client.query(
          `INSERT INTO featured_posts (id, title, fact, image_url, image_filename, thumbnail_url, youtube_url, is_featured, published_at, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, title, fact, image_url as "imageUrl", image_filename as "imageFilename",
                     thumbnail_url as "thumbnailUrl", youtube_url as "youtubeUrl", is_featured as "isFeatured",
                     published_at as "publishedAt", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            id,
            data.title,
            data.fact,
            data.imageUrl,
            data.imageFilename,
            data.thumbnailUrl || null,
            data.youtubeUrl || null,
            data.isFeatured,
            now,
            data.createdBy || null,
            now,
            now,
          ]
        );
        await client.query("COMMIT");
        return res.rows[0];
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }

    const store = ensureLocalStore();
    if (data.isFeatured) {
      store.posts.forEach((p) => {
        p.isFeatured = false;
      });
    }

    const newRecord: FeaturedPostRecord = {
      id,
      title: data.title,
      fact: data.fact,
      imageUrl: data.imageUrl,
      imageFilename: data.imageFilename,
      thumbnailUrl: data.thumbnailUrl,
      youtubeUrl: data.youtubeUrl,
      isFeatured: data.isFeatured,
      publishedAt: now,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    store.posts.unshift(newRecord);
    saveLocalStore(store);
    return newRecord;
  },

  async setFeaturedPost(id: string): Promise<FeaturedPostRecord | null> {
    const now = new Date().toISOString();

    if (pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query("BEGIN");
        await client.query("UPDATE featured_posts SET is_featured = FALSE WHERE is_featured = TRUE");
        const res = await client.query(
          `UPDATE featured_posts
           SET is_featured = TRUE, published_at = $1, updated_at = $1
           WHERE id = $2
           RETURNING id, title, fact, image_url as "imageUrl", image_filename as "imageFilename",
                     thumbnail_url as "thumbnailUrl", is_featured as "isFeatured",
                     published_at as "publishedAt", created_at as "createdAt", updated_at as "updatedAt"`,
          [now, id]
        );
        await client.query("COMMIT");
        return res.rows[0] || null;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }

    const store = ensureLocalStore();
    let targetPost: FeaturedPostRecord | null = null;
    store.posts.forEach((p) => {
      if (p.id === id) {
        p.isFeatured = true;
        p.publishedAt = now;
        p.updatedAt = now;
        targetPost = p;
      } else {
        p.isFeatured = false;
      }
    });

    if (targetPost) {
      saveLocalStore(store);
    }
    return targetPost;
  },

  async deletePost(id: string): Promise<boolean> {
    if (pgPool) {
      const res = await pgPool.query("DELETE FROM featured_posts WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    }

    const store = ensureLocalStore();
    const initialLen = store.posts.length;
    store.posts = store.posts.filter((p) => p.id !== id);
    if (store.posts.length < initialLen) {
      saveLocalStore(store);
      return true;
    }
    return false;
  },

  async getStats() {
    const allPosts = await this.getAllPosts();
    const featured = allPosts.find((p) => p.isFeatured) || null;
    return {
      totalPosts: allPosts.length,
      featuredTitle: featured ? featured.title : "None",
      lastPublished: featured ? featured.publishedAt : null,
    };
  },

  // Analytics Operations
  async recordAnalyticsEvent(event: Omit<AnalyticsEvent, "id" | "createdAt">): Promise<AnalyticsEvent> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const record: AnalyticsEvent = {
      id,
      eventType: event.eventType,
      path: event.path || "/",
      toolSlug: event.toolSlug,
      action: event.action,
      countryCode: event.countryCode || "UNKNOWN",
      city: event.city || "Unknown",
      region: event.region || "Unknown",
      deviceType: event.deviceType || "desktop",
      browser: event.browser || "Unknown",
      os: event.os || "Unknown",
      referrer: event.referrer || "direct",
      visitorHash: event.visitorHash || "anon",
      createdAt,
    };

    if (pgPool) {
      try {
        await ensurePgTables();
        await pgPool.query(
          `INSERT INTO analytics_events (
            id, event_type, path, tool_slug, action, country_code, city, region,
            device_type, browser, os, referrer, visitor_hash, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            record.id,
            record.eventType,
            record.path,
            record.toolSlug || null,
            record.action || null,
            record.countryCode,
            record.city,
            record.region,
            record.deviceType,
            record.browser,
            record.os,
            record.referrer,
            record.visitorHash,
            record.createdAt,
          ]
        );
        return record;
      } catch (err) {
        console.error("Failed to insert analytics event in PostgreSQL:", err);
      }
    }

    const store = ensureLocalStore();
    if (!store.analytics || store.analytics.length === 0) {
      const cloudEvents = await fetchAnalyticsFromCloud();
      store.analytics = cloudEvents || [];
    }
    store.analytics.push(record);
    if (store.analytics.length > 5000) {
      store.analytics = store.analytics.slice(-5000);
    }
    saveLocalStore(store);

    // Synchronize recent events to persistent cloud store before serverless freeze
    await syncAnalyticsToCloud(store.analytics);
    return record;
  },

  async getAnalyticsSummary(range: "today" | "7d" | "30d" | "all" = "7d") {
    let cutoffDate: Date;
    const now = new Date();

    if (range === "today") {
      cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    } else if (range === "7d") {
      cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else {
      cutoffDate = new Date(0);
    }

    const cutoffIso = cutoffDate.toISOString();

    if (pgPool) {
      try {
        await ensurePgTables();
        const eventsRes = await pgPool.query(
          "SELECT * FROM analytics_events WHERE created_at >= $1 ORDER BY created_at DESC",
          [cutoffIso]
        );
        const events: AnalyticsEvent[] = eventsRes.rows.map((r) => ({
          id: r.id,
          eventType: r.event_type,
          path: r.path,
          toolSlug: r.tool_slug || undefined,
          action: r.action || undefined,
          countryCode: r.country_code || undefined,
          city: r.city || undefined,
          region: r.region || undefined,
          deviceType: r.device_type,
          browser: r.browser || undefined,
          os: r.os || undefined,
          referrer: r.referrer || undefined,
          visitorHash: r.visitor_hash,
          createdAt: typeof r.created_at === "string" ? r.created_at : r.created_at.toISOString(),
        }));
        return aggregateAnalyticsData(events);
      } catch (err) {
        console.error("Failed to query PostgreSQL analytics:", err);
      }
    }

    // Serverless cloud persistence sync
    const cloudEvents = await fetchAnalyticsFromCloud();
    const store = ensureLocalStore();
    if (!store.analytics) store.analytics = [];

    if (cloudEvents.length > 0) {
      const existingIds = new Set(store.analytics.map((e) => e.id));
      let added = false;
      for (const ce of cloudEvents) {
        if (!existingIds.has(ce.id)) {
          store.analytics.push(ce);
          existingIds.add(ce.id);
          added = true;
        }
      }
      if (added) {
        store.analytics.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        if (store.analytics.length > 5000) {
          store.analytics = store.analytics.slice(-5000);
        }
        saveLocalStore(store);
      }
    }

    const all = store.analytics || [];
    const filtered = all.filter((e) => new Date(e.createdAt) >= cutoffDate);
    return aggregateAnalyticsData(filtered);
  },
};

function aggregateAnalyticsData(events: AnalyticsEvent[]) {
  const totalEvents = events.length;
  const pageviews = events.filter((e) => e.eventType === "pageview");
  const toolActions = events.filter((e) => e.eventType === "tool_action");

  const uniqueVisitors = new Set(events.map((e) => e.visitorHash)).size;

  // Country counts
  const countryMap: Record<string, number> = {};
  events.forEach((e) => {
    const c = (e.countryCode || "UNKNOWN").toUpperCase();
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([countryCode, count]) => ({
      countryCode,
      count,
      percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
    }));

  // Tool counts
  const toolMap: Record<string, number> = {};
  toolActions.forEach((e) => {
    if (e.toolSlug) {
      toolMap[e.toolSlug] = (toolMap[e.toolSlug] || 0) + 1;
    }
  });
  const topTools = Object.entries(toolMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([toolSlug, count]) => ({
      toolSlug,
      count,
      percentage: toolActions.length > 0 ? Math.round((count / toolActions.length) * 100) : 0,
    }));

  // Device breakdown
  const deviceBreakdown = {
    desktop: 0,
    mobile: 0,
    tablet: 0,
  };
  events.forEach((e) => {
    const dev = e.deviceType || "desktop";
    if (dev === "mobile") deviceBreakdown.mobile++;
    else if (dev === "tablet") deviceBreakdown.tablet++;
    else deviceBreakdown.desktop++;
  });

  // Top referrers
  const refMap: Record<string, number> = {};
  events.forEach((e) => {
    const r = (e.referrer || "direct").toLowerCase();
    refMap[r] = (refMap[r] || 0) + 1;
  });
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));

  // Recent events (latest 25)
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 25);

  return {
    totalEvents,
    totalPageviews: pageviews.length,
    totalToolActions: toolActions.length,
    uniqueVisitors,
    topCountry: topCountries[0]?.countryCode || "None",
    topCountryCount: topCountries[0]?.count || 0,
    topCountries,
    topTools,
    deviceBreakdown,
    topReferrers,
    recentEvents,
  };
}
