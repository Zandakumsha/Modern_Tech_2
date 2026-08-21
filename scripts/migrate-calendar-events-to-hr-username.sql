-- Modern Tech calendar migration
-- Branch: integration/feature/autha-to-develop
--
-- Purpose:
--   1. Add hr_username without deleting existing calendar_events.user_id.
--   2. Backfill hr_username from users.username where possible.
--   3. Keep user_id during the transition so existing data remains recoverable.
--   4. Verify unmapped rows before the application starts relying exclusively on hr_username.
--
-- Run this script against the same database configured by DB_HOST/DB_PORT/DB_NAME.
-- IMPORTANT: review the SELECT result marked STEP 4 before running STEP 5.

START TRANSACTION;

-- STEP 1: Add the new ownership column if it does not already exist.
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS hr_username VARCHAR(100) NULL;

-- STEP 2: Backfill existing events from the current users table.
-- Existing user_id values are preserved.
UPDATE calendar_events ce
LEFT JOIN users u ON u.user_id = ce.user_id
SET ce.hr_username = u.username
WHERE ce.hr_username IS NULL
  AND u.username IS NOT NULL
  AND TRIM(u.username) <> '';

-- STEP 3: If your HR environment account uses a configured username but has
-- no users row, map events owned by the Manager/Admin fallback account to the
-- configured HR username. Only run this if that fallback was used by the old
-- calendar implementation.
UPDATE calendar_events ce
JOIN users u ON u.user_id = ce.user_id
SET ce.hr_username = COALESCE(NULLIF(TRIM(@HR_USERNAME), ''), 'hrmanager')
WHERE ce.hr_username IS NULL
  AND u.role IN ('Manager', 'Admin')
  AND NOT EXISTS (
    SELECT 1
    FROM users hr
    WHERE hr.username = COALESCE(NULLIF(TRIM(@HR_USERNAME), ''), 'hrmanager')
  );

-- STEP 4: Inspect any rows that could not be mapped automatically.
-- These rows must be assigned the correct HR username before STEP 5.
SELECT event_id, user_id, event_date, title
FROM calendar_events
WHERE hr_username IS NULL;

-- STEP 5: Only make hr_username required after STEP 4 returns zero rows.
-- If STEP 4 returned rows, ROLLBACK, assign the correct usernames, and rerun.
SET @unmapped_count = (
  SELECT COUNT(*)
  FROM calendar_events
  WHERE hr_username IS NULL
);

-- MySQL does not allow conditional DDL directly in this transaction.
-- The application remains compatible while hr_username is nullable, so commit
-- the additive migration here. Once the SELECT above returns zero rows, the
-- following optional hardening statement can be run separately:
--
-- ALTER TABLE calendar_events MODIFY COLUMN hr_username VARCHAR(100) NOT NULL;
-- CREATE INDEX idx_calendar_events_hr_username_date
--   ON calendar_events (hr_username, event_date, event_time);

COMMIT;

-- Recommended verification:
-- SELECT event_id, user_id, hr_username, event_date, title
-- FROM calendar_events
-- ORDER BY event_id;
