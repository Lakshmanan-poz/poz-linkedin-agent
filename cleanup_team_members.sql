-- =====================================================
-- CLEANUP: Keep only SNO 16–21 team members
-- Set Sridhar as admin, poz123 password for all
-- Run once in Supabase SQL editor
-- =====================================================

BEGIN;

-- Step 1: Delete ALL records outside SNO 16–21
DELETE FROM team_members
WHERE id NOT BETWEEN 16 AND 21;

-- Step 2: Set Sridhar as admin
UPDATE team_members
SET auth_role = 'admin', role = 'lead'
WHERE email ILIKE 'sridhar@pointonezero.com';

-- Step 3: Ensure all 6 users have password poz123
-- bcrypt("poz123") = $2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO
UPDATE team_members
SET password_hash = '$2b$10$YeNDQv8YbNE5u2Fqa9djFuGiHWv8CRvH5SKUOAYLHC7TLMOY67UsO'
WHERE id BETWEEN 16 AND 21;

COMMIT;

-- Verify final state
SELECT id, name, email, role, auth_role FROM team_members ORDER BY id;
