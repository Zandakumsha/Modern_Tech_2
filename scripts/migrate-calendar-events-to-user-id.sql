-- Modern Tech calendar ownership migration
-- Adds the users.user_id relationship required by the calendar API.
-- Run this once against the same MySQL database used by the local server.

START TRANSACTION;

-- Add user_id if the existing calendar_events table was created from the
-- older hr_username-based schema. Existing events are preserved.
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS user_id INT NULL;

-- Backfill user_id from the existing hr_username values where possible.
UPDATE calendar_events ce
JOIN users u ON LOWER(TRIM(u.username)) = LOWER(TRIM(ce.hr_username))
SET ce.user_id = u.user_id
WHERE ce.user_id IS NULL
  AND ce.hr_username IS NOT NULL
  AND TRIM(ce.hr_username) <> '';

-- Also support older installations where events may already have a user_id
-- but no hr_username value. Keep the username synchronized where possible.
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS hr_username VARCHAR(100) NULL;

UPDATE calendar_events ce
JOIN users u ON u.user_id = ce.user_id
SET ce.hr_username = u.username
WHERE (ce.hr_username IS NULL OR TRIM(ce.hr_username) = '')
  AND ce.user_id IS NOT NULL;

-- Review any events that could not be associated with an account.
-- The application requires user_id for newly-created events.
SELECT event_id, hr_username, event_date, title
FROM calendar_events
WHERE user_id IS NULL;

-- Add the foreign key only when one does not already exist.
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'calendar_events'
    AND CONSTRAINT_NAME = 'fk_calendar_events_user'
);

SET @fk_sql := IF(
  @fk_exists = 0,
  'ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

CREATE INDEX idx_calendar_events_user_date
  ON calendar_events (user_id, event_date);

COMMIT;

-- After confirming the SELECT above returns no rows, the column can be made
-- mandatory with:
-- ALTER TABLE calendar_events MODIFY COLUMN user_id INT NOT NULL;
