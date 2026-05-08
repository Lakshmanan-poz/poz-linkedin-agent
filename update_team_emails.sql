-- =====================================================
-- UPDATE TEAM MEMBER EMAILS TO @PointOneZero.com
-- Run this against the Supabase database once.
-- Skips members already on @pointonezero.com.
-- Removes members not in the active team list.
-- =====================================================

BEGIN;

-- Step 1: Update existing members (name + email) — skipped if already @pointonezero.com
UPDATE team_members
SET name = 'Lakshmanan', email = 'lakshmanan@pointonezero.com'
WHERE email = 'lakshman@poz.ai'
  AND email NOT ILIKE '%pointonezero.com';

UPDATE team_members
SET name = 'Migavel', email = 'migavel@pointonezero.com'
WHERE email = 'miguel@poz.ai'
  AND email NOT ILIKE '%pointonezero.com';

UPDATE team_members
SET email = 'sridhar@pointonezero.com'
WHERE email = 'sridhar@poz.ai'
  AND email NOT ILIKE '%pointonezero.com';

-- Step 2: Insert new members if not already present
INSERT INTO team_members (name, email, role, auth_role, password_hash)
VALUES
  ('Mageshwaran', 'mageshwaran@pointonezero.com', 'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('GobiKrishna',  'gobikrishna@pointonezero.com',  'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'),
  ('Mowlish',      'mowlish@pointonezero.com',      'member', 'employee', '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Remove old / unnecessary team members
DELETE FROM team_members
WHERE email IN (
  'shweta@poz.ai',
  'tejas@poz.ai',
  'boobesh@poz.ai',
  'rucha@poz.ai',
  'karishma@poz.ai',
  'rajarajan@poz.ai',
  'shagita@poz.ai'
);

COMMIT;

-- Verify result
SELECT id, name, email, role, auth_role FROM team_members ORDER BY name;
