import fs from "fs";
import path from "path";
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

// PostgreSQL Pool instance if DATABASE_URL is set
let pgPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

// Local File Store for Development when DATABASE_URL is not configured
interface LocalStore {
  admins: AdminUser[];
  posts: FeaturedPostRecord[];
}

const DB_DIR = path.join(process.cwd(), ".db");
const STORE_FILE = path.join(DB_DIR, "store.json");

function ensureLocalStore(): LocalStore {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
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
        {
          id: "post-seed-002",
          title: "Deep Sea Bioluminescence in the Mariana Trench",
          fact: "More than 75% of deep-sea marine organisms produce their own light through bioluminescent chemical reactions involving luciferin, allowing them to communicate and hunt in complete ocean darkness.",
          imageUrl:
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
          imageFilename: "demo-ocean.jpg",
          isFeatured: false,
          publishedAt: "2026-10-27T00:00:00.000Z",
          createdAt: "2026-10-27T00:00:00.000Z",
          updatedAt: "2026-10-27T00:00:00.000Z",
        },
      ],
    };

    fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), "utf-8");
    return initialStore;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { admins: [], posts: [] };
  }
}

function saveLocalStore(store: LocalStore) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export const db = {
  // Admin Operations
  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    if (pgPool) {
      const res = await pgPool.query(
        "SELECT id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\" FROM admins WHERE LOWER(email) = LOWER($1)",
        [email]
      );
      return res.rows[0] || null;
    }

    const store = ensureLocalStore();
    return (
      store.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null
    );
  },

  async getAdminById(id: string): Promise<AdminUser | null> {
    if (pgPool) {
      const res = await pgPool.query(
        "SELECT id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\" FROM admins WHERE id = $1",
        [id]
      );
      return res.rows[0] || null;
    }

    const store = ensureLocalStore();
    return store.admins.find((a) => a.id === id) || null;
  },

  async updateAdminProfile(id: string, name: string, email: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (pgPool) {
      const res = await pgPool.query(
        "UPDATE admins SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, password_hash as \"passwordHash\", name, created_at as \"createdAt\", last_login_at as \"lastLoginAt\"",
        [cleanName, cleanEmail, id]
      );
      if (!res.rows[0]) throw new Error("Admin user not found");
      return res.rows[0];
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id);
    if (!admin) throw new Error("Admin user not found");

    const existingOther = store.admins.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.id !== id
    );
    if (existingOther) {
      throw new Error("This email address is already in use by another administrator.");
    }

    admin.name = cleanName;
    admin.email = cleanEmail;
    saveLocalStore(store);
    return admin;
  },

  async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
    if (pgPool) {
      await pgPool.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
      return;
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id);
    if (!admin) throw new Error("Admin user not found");

    admin.passwordHash = passwordHash;
    saveLocalStore(store);
  },

  async updateAdminLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (pgPool) {
      await pgPool.query("UPDATE admins SET last_login_at = $1 WHERE id = $2", [now, id]);
      return;
    }

    const store = ensureLocalStore();
    const admin = store.admins.find((a) => a.id === id);
    if (admin) {
      admin.lastLoginAt = now;
      saveLocalStore(store);
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
};
