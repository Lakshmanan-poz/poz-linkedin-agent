-- POZ Agent — Test Data Cleanup
-- Removes all posts, chat history, and agent outputs.
-- Preserves: team_members, app_settings, prompt_templates.
-- Run: npm run db:clean

BEGIN;

-- Chat history (messages first — FK to sessions)
TRUNCATE TABLE agent_catalog_chat_messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE agent_catalog_chat_history  RESTART IDENTITY CASCADE;

-- Agent outputs
TRUNCATE TABLE agent_outputs RESTART IDENTITY CASCADE;

-- Notifications (FK to posts — must clear before posts)
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- Posts and all dependent tables (cascades to revisions, status_history, comments)
TRUNCATE TABLE posts RESTART IDENTITY CASCADE;

COMMIT;

-- Verify
SELECT 'posts'                        AS "table", COUNT(*) AS remaining FROM posts
UNION ALL
SELECT 'agent_outputs',                            COUNT(*) FROM agent_outputs
UNION ALL
SELECT 'agent_catalog_chat_history',               COUNT(*) FROM agent_catalog_chat_history
UNION ALL
SELECT 'agent_catalog_chat_messages',              COUNT(*) FROM agent_catalog_chat_messages
UNION ALL
SELECT 'notifications',                            COUNT(*) FROM notifications;
