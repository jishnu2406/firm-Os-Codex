-- ============================================================
-- FIRM OS COMMAND CENTER — DATABASE SCHEMA
-- Multi-tenant SaaS for Design Studios
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'DESIGNER', 'MEMBER');
CREATE TYPE subscription_type AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'HOLD');
CREATE TYPE studio_tier AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE file_type AS ENUM ('PDF', 'IMAGE', 'DOC', 'VIDEO', 'OTHER');
CREATE TYPE project_status AS ENUM ('DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED');

-- ============================================================
-- STUDIOS (Root tenant entity)
-- ============================================================

CREATE TABLE studios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_tier    studio_tier NOT NULL DEFAULT 'STARTER',
  storage_used    BIGINT NOT NULL DEFAULT 0,                    -- bytes
  storage_limit   BIGINT NOT NULL DEFAULT 3221225472,          -- 3GB default
  extra_storage   BIGINT NOT NULL DEFAULT 0,                   -- purchased add-ons in bytes
  settings        JSONB NOT NULL DEFAULT '{
    "theme": "slate-dark",
    "font": "geist",
    "layout": "normal",
    "notifications": true
  }'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_studios_slug ON studios(slug);

-- ============================================================
-- USERS (Studio members with role-based access)
-- ============================================================

CREATE TABLE firmos_users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'MEMBER',
  studio_id       UUID REFERENCES studios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ,
  onboarded       BOOLEAN NOT NULL DEFAULT FALSE,
  preferences     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_firmos_users_studio_id ON firmos_users(studio_id);
CREATE INDEX idx_firmos_users_email ON firmos_users(email);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE firmos_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  status          project_status NOT NULL DEFAULT 'DRAFT',
  studio_id       UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES firmos_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date        DATE,
  cover_url       TEXT,
  tags            TEXT[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_firmos_projects_studio_id ON firmos_projects(studio_id);
CREATE INDEX idx_firmos_projects_status ON firmos_projects(studio_id, status);

-- ============================================================
-- FILE VAULT
-- ============================================================

CREATE TABLE file_vault (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  storage_path    TEXT NOT NULL,              -- Supabase Storage path
  file_size       BIGINT NOT NULL DEFAULT 0,  -- bytes
  file_type       file_type NOT NULL DEFAULT 'OTHER',
  mime_type       TEXT,
  project_id      UUID REFERENCES firmos_projects(id) ON DELETE SET NULL,
  studio_id       UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES firmos_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_summary      TEXT,                       -- AI-generated summary
  ai_tags         TEXT[] DEFAULT '{}',        -- AI-generated tags
  ai_category     TEXT,                       -- AI-assigned category
  ai_processed    BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url   TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_file_vault_studio_id ON file_vault(studio_id);
CREATE INDEX idx_file_vault_project_id ON file_vault(project_id);
CREATE INDEX idx_file_vault_type ON file_vault(studio_id, file_type);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id       UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  license_key     TEXT UNIQUE NOT NULL,
  type            subscription_type NOT NULL DEFAULT 'MONTHLY',
  status          subscription_status NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  activated_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,           -- 7-day grace after expiry
  amount_cents    INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_subscriptions_studio_id ON subscriptions(studio_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_license_key ON subscriptions(license_key);

-- ============================================================
-- STORAGE ADD-ONS (billing for extra storage)
-- ============================================================

CREATE TABLE storage_addons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id       UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  gb_purchased    INTEGER NOT NULL,           -- 1–12 GB range
  price_cents     INTEGER NOT NULL,
  billing_cycle   subscription_type NOT NULL,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

CREATE INDEX idx_storage_addons_studio ON storage_addons(studio_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id       UUID REFERENCES studios(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES firmos_users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET
);

CREATE INDEX idx_audit_log_studio ON audit_log(studio_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================================

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmos_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmos_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's studio_id
CREATE OR REPLACE FUNCTION get_my_studio_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT studio_id FROM firmos_users WHERE id = auth.uid()
$$;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE AS $$
  SELECT role FROM firmos_users WHERE id = auth.uid()
$$;

-- Studios: members can view their studio
CREATE POLICY "studio_select" ON studios
  FOR SELECT USING (id = get_my_studio_id());

CREATE POLICY "studio_update" ON studios
  FOR UPDATE USING (
    id = get_my_studio_id() AND 
    get_my_role() IN ('OWNER', 'ADMIN')
  );

-- Users: members see only studio peers
CREATE POLICY "firmos_users_select" ON firmos_users
  FOR SELECT USING (studio_id = get_my_studio_id());

CREATE POLICY "firmos_users_update_own" ON firmos_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "firmos_users_update_admin" ON firmos_users
  FOR UPDATE USING (
    studio_id = get_my_studio_id() AND 
    get_my_role() IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "firmos_users_insert" ON firmos_users
  FOR INSERT WITH CHECK (TRUE); -- controlled by trigger

-- Projects: full isolation per studio
CREATE POLICY "firmos_projects_select" ON firmos_projects
  FOR SELECT USING (studio_id = get_my_studio_id());

CREATE POLICY "firmos_projects_insert" ON firmos_projects
  FOR INSERT WITH CHECK (studio_id = get_my_studio_id());

CREATE POLICY "firmos_projects_update" ON firmos_projects
  FOR UPDATE USING (studio_id = get_my_studio_id());

CREATE POLICY "firmos_projects_delete" ON firmos_projects
  FOR DELETE USING (
    studio_id = get_my_studio_id() AND 
    get_my_role() IN ('OWNER', 'ADMIN', 'MANAGER')
  );

-- File Vault: full isolation per studio
CREATE POLICY "vault_select" ON file_vault
  FOR SELECT USING (studio_id = get_my_studio_id());

CREATE POLICY "vault_insert" ON file_vault
  FOR INSERT WITH CHECK (studio_id = get_my_studio_id());

CREATE POLICY "vault_update" ON file_vault
  FOR UPDATE USING (studio_id = get_my_studio_id());

CREATE POLICY "vault_delete" ON file_vault
  FOR DELETE USING (
    studio_id = get_my_studio_id() AND 
    (uploaded_by = auth.uid() OR get_my_role() IN ('OWNER', 'ADMIN'))
  );

-- Subscriptions: owner/admin only
CREATE POLICY "sub_select" ON subscriptions
  FOR SELECT USING (studio_id = get_my_studio_id());

CREATE POLICY "sub_manage" ON subscriptions
  FOR ALL USING (
    studio_id = get_my_studio_id() AND 
    get_my_role() IN ('OWNER', 'ADMIN')
  );

-- Storage addons
CREATE POLICY "storage_addon_select" ON storage_addons
  FOR SELECT USING (studio_id = get_my_studio_id());

-- Audit log
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT USING (
    studio_id = get_my_studio_id() AND 
    get_my_role() IN ('OWNER', 'ADMIN')
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_studios_updated BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_firmos_users_updated BEFORE UPDATE ON firmos_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_firmos_projects_updated BEFORE UPDATE ON firmos_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-sync storage usage when files added/removed
CREATE OR REPLACE FUNCTION sync_studio_storage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE studios SET storage_used = storage_used + NEW.file_size
    WHERE id = NEW.studio_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE studios SET storage_used = GREATEST(0, storage_used - OLD.file_size)
    WHERE id = OLD.studio_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_vault_storage_sync
AFTER INSERT OR DELETE ON file_vault
FOR EACH ROW EXECUTE FUNCTION sync_studio_storage();

-- Auto-expire subscriptions
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'EXPIRED'
  WHERE status = 'ACTIVE'
    AND expires_at < NOW()
    AND (grace_period_ends_at IS NULL OR grace_period_ends_at < NOW());
END;
$$;

-- License key generation function
CREATE OR REPLACE FUNCTION generate_license_key(sub_type subscription_type)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  hash TEXT;
  prefix TEXT;
BEGIN
  hash := upper(encode(gen_random_bytes(8), 'hex'));
  IF sub_type = 'MONTHLY' THEN
    prefix := 'DNAXFOS/MBAP';
  ELSE
    prefix := 'DNAXFOS/YRLY';
  END IF;
  RETURN prefix || '-' || 
    substring(hash, 1, 4) || '-' || 
    substring(hash, 5, 4) || '-' || 
    substring(hash, 9, 4) || '-' || 
    substring(hash, 13, 4);
END;
$$;

-- New user signup handler (called from auth webhook)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO firmos_users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: Default subscription check view
-- ============================================================

CREATE OR REPLACE VIEW studio_subscription_status AS
SELECT
  s.id AS studio_id,
  s.name AS studio_name,
  sub.status AS subscription_status,
  sub.type AS subscription_type,
  sub.expires_at,
  sub.grace_period_ends_at,
  s.storage_used,
  s.storage_limit,
  ROUND((s.storage_used::numeric / NULLIF(s.storage_limit, 0)) * 100, 2) AS storage_pct
FROM studios s
LEFT JOIN subscriptions sub ON sub.studio_id = s.id
  AND sub.status IN ('ACTIVE', 'HOLD')
ORDER BY sub.expires_at DESC NULLS LAST;

COMMENT ON TABLE studios IS 'Root tenant entity — one per design studio';
COMMENT ON TABLE firmos_users IS 'Studio members with role-based access control';
COMMENT ON TABLE firmos_projects IS 'Design projects scoped per studio';
COMMENT ON TABLE file_vault IS 'Secure asset storage with AI enrichment';
COMMENT ON TABLE subscriptions IS 'Billing and license management';
