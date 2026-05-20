-- POZ Social Media Agent - Complete Database Schema
-- This file contains the complete schema and migration for auth columns

-- Agent Documents table (RAG file uploads)
CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_id TEXT,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'text/plain',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FULL SCHEMA (for fresh databases)
-- =====================================================

-- Team Members table with auth columns
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  auth_role TEXT NOT NULL DEFAULT 'employee',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  platform TEXT NOT NULL DEFAULT 'linkedin',
  author_id INTEGER NOT NULL REFERENCES team_members(id),
  assigned_designer_id INTEGER REFERENCES team_members(id),
  scheduled_date DATE,
  published_url TEXT,
  ai_prompt TEXT,
  ai_model TEXT,
  carousel_slides TEXT,
  hashtags TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Revisions table
CREATE TABLE IF NOT EXISTS post_revisions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  revised_by INTEGER NOT NULL REFERENCES team_members(id),
  revision_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Status History table
CREATE TABLE IF NOT EXISTS post_status_history (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES team_members(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt Templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  post_type TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  example_output TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Outputs table
CREATE TABLE IF NOT EXISTS agent_outputs (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  title TEXT NOT NULL,
  input_params TEXT NOT NULL,
  output_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MIGRATION for existing databases (idempotent)
-- =====================================================

-- Add auth columns to existing team_members table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS auth_role TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Post Comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES team_members(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES team_members(id),
  type TEXT NOT NULL DEFAULT 'comment',
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_revisions_post ON post_revisions(post_id);
CREATE INDEX IF NOT EXISTS idx_status_history_post ON post_status_history(post_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent ON agent_outputs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_skill ON agent_outputs(skill_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created ON agent_outputs(created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- =====================================================
-- AUTH SEED DATA
-- =====================================================

-- Default password for all users: poz123
-- $2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO = bcrypt("poz123")
UPDATE team_members
SET password_hash = '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'
WHERE password_hash IS NULL;

-- Set auth_role for existing users if not set
UPDATE team_members
SET auth_role = CASE
  WHEN email ILIKE 'sridhar@pointonezero.com' THEN 'admin'
  ELSE 'employee'
END
WHERE auth_role IS NULL OR auth_role = '';

-- =====================================================
-- DEFAULT SEED DATA (if tables are empty)
-- =====================================================

-- Seed team members (if none exist except admin)
INSERT INTO team_members (name, email, role, auth_role, password_hash) VALUES
  ('Lakshmanan',  'lakshmanan@pointonezero.com',  'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Migavel',     'migavel@pointonezero.com',     'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Sridhar',     'sridhar@pointonezero.com',     'lead',   'admin',    '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Mageshwaran', 'mageshwaran@pointonezero.com', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('GobiKrishna', 'gobikrishna@pointonezero.com', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Mowlish',     'mowlish@pointonezero.com',     'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO')
ON CONFLICT (email) DO NOTHING;

-- Seed prompt templates (if none exist)
INSERT INTO prompt_templates (name, post_type, system_prompt, user_prompt_template, is_default)
SELECT * FROM (VALUES
  ('Default Problem-Solution', 'problem_solution',
   'You are a LinkedIn content strategist. Write engaging, professional posts with a strong hook, short readable paragraphs, and a clear CTA.',
   'Write a problem-solution LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Educational', 'educational',
   'You are a LinkedIn content strategist. Write educational posts with a surprising opening, clear structure, and actionable takeaways.',
   'Write an educational LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Execution/Build', 'execution',
   'You are a LinkedIn content strategist. Write build-in-public posts that include concrete decisions, progress updates, and lessons learned.',
   'Write a build-in-public LinkedIn post about: {{topic}}\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1),
  ('Default Carousel', 'carousel',
   'You are a LinkedIn content strategist. Create concise carousel copy with one key point per slide and a strong CTA slide.',
   'Create a LinkedIn carousel about: {{topic}}\nNumber of slides: 6-8\n{{#if additional_context}}Additional context: {{additional_context}}{{/if}}', 1)
) AS v(name, post_type, system_prompt, user_prompt_template, is_default)
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates);

-- Seed app settings (if none exist)
INSERT INTO app_settings (key, value)
SELECT * FROM (VALUES
  ('brand_name', 'POZ'),
  ('brand_voice', 'Professional yet approachable. We build AI-powered solutions and share our journey transparently.'),
  ('default_model', 'gpt-4o'),
  ('posts_per_week_target', '5')
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- =====================================================
-- RBAC WORKFLOW MIGRATION
-- Rename old status values to new role-based workflow statuses
-- =====================================================

-- Rename old statuses to new workflow statuses
UPDATE posts SET status = 'submitted'          WHERE status = 'in_review';
UPDATE posts SET status = 'approved_for_design' WHERE status = 'ready_for_design';
UPDATE posts SET status = 'design_in_progress'  WHERE status = 'with_designer';

-- Update status history audit trail to match new names
UPDATE post_status_history SET from_status = 'submitted'           WHERE from_status = 'in_review';
UPDATE post_status_history SET from_status = 'approved_for_design'  WHERE from_status = 'ready_for_design';
UPDATE post_status_history SET from_status = 'design_in_progress'   WHERE from_status = 'with_designer';
UPDATE post_status_history SET to_status   = 'submitted'           WHERE to_status   = 'in_review';
UPDATE post_status_history SET to_status   = 'approved_for_design'  WHERE to_status   = 'ready_for_design';
UPDATE post_status_history SET to_status   = 'design_in_progress'   WHERE to_status   = 'with_designer';

-- Update designer seed users to have auth_role = 'designer'
UPDATE team_members
SET auth_role = 'designer'
WHERE email IN ('rucha@poz.ai', 'karishma@poz.ai');

-- =====================================================
-- AGENT CATALOG CHAT HISTORY
-- =====================================================
-- Stores full chat sessions (messages as JSONB) for the Agent Catalog chat.
-- One row per session, keyed by session_id. Upsert on session_id.

CREATE TABLE IF NOT EXISTS agent_catalog_chat_history (
  id               BIGSERIAL    PRIMARY KEY,
  session_id       TEXT         NOT NULL UNIQUE,
  user_id          BIGINT       NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  title            TEXT         NOT NULL DEFAULT 'Chat',
  messages         JSONB        NOT NULL DEFAULT '[]'::jsonb,
  share_token      TEXT         UNIQUE,
  is_shared        BOOLEAN      NOT NULL DEFAULT FALSE,
  last_message_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- For existing databases: add share columns if they don't exist
ALTER TABLE agent_catalog_chat_history ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE agent_catalog_chat_history ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_agent_catalog_chat_history_user
  ON agent_catalog_chat_history (user_id, last_message_at DESC);

-- =====================================================
-- AGENT CATALOG CHAT MESSAGES (granular — one row per message)
-- =====================================================
-- Every individual chat message (user + agent) is stored here. A session's
-- full conversation can be reconstructed by selecting WHERE session_id = ?
-- ORDER BY created_at ASC. Complements the session-level JSONB table above
-- so we have both a fast session view and an append-only message log.
--
-- The user_id column is denormalised (copied from the session) so every
-- query can scope to the current user without joining.

CREATE TABLE IF NOT EXISTS agent_catalog_chat_messages (
  id            BIGSERIAL    PRIMARY KEY,
  message_id    TEXT         NOT NULL UNIQUE,       -- client-generated UUID
  session_id    TEXT         NOT NULL,              -- groups messages into a chat
  user_id       BIGINT       NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role          TEXT         NOT NULL CHECK (role IN ('user', 'agent')),
  text          TEXT         NOT NULL DEFAULT '',
  result_type   TEXT,                                -- 'daily-content'|'weekly-calendar'|'content-refiner'|null
  result_data   JSONB,                               -- structured output payload, null for plain text
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_catalog_chat_messages_session
  ON agent_catalog_chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_agent_catalog_chat_messages_user
  ON agent_catalog_chat_messages (user_id, created_at DESC);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Show current team members with their roles
-- SELECT name, email, role, auth_role, (password_hash IS NOT NULL) as has_password FROM team_members ORDER BY name;

-- Show posts with new statuses
-- SELECT id, title, status FROM posts ORDER BY created_at DESC LIMIT 20;