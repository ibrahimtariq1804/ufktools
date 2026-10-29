-- UFK Tools: PostgreSQL Database Schema
-- Run this migration against your PostgreSQL database

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Picture / Fact of the Day Table
CREATE TABLE IF NOT EXISTS featured_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    fact TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partial unique index ensuring only ONE post is marked is_featured = TRUE at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_featured_post 
ON featured_posts (is_featured) 
WHERE is_featured = TRUE;

-- 3. Currency Rates Cache Table
CREATE TABLE IF NOT EXISTS currency_rates_cache (
    id VARCHAR(50) PRIMARY KEY,
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    rates_json JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Analytics Events Table (Pageviews & Tool Actions)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- 'pageview' or 'tool_action'
    path VARCHAR(255) NOT NULL,      -- e.g. '/', '/tools/merge-pdf'
    tool_slug VARCHAR(100),          -- e.g. 'merge-pdf', 'cv-builder'
    action VARCHAR(100),             -- e.g. 'process_file', 'download_pdf'
    country_code VARCHAR(10),        -- 'US', 'GB', 'PK'
    city VARCHAR(100),               -- 'London'
    region VARCHAR(100),             -- 'England'
    device_type VARCHAR(20),         -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),             -- 'Chrome', 'Safari', 'Firefox'
    os VARCHAR(50),                  -- 'Windows', 'iOS', 'Android', 'macOS'
    referrer VARCHAR(255),           -- 'google.com', 'direct'
    visitor_hash VARCHAR(64) NOT NULL, -- Salted anonymous visitor identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_tool_slug ON analytics_events(tool_slug) WHERE tool_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country_code);

