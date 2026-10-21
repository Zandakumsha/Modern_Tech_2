-- Modern Tech HR calendar ownership migration
-- Run once against the database configured by DB_NAME.
-- Replace 'hrmanager' with the exact HR username used to sign in, if different.
SET @HR_USERNAME = COALESCE(NULLIF(TRIM(@HR_USERNAME), ''), 'hrmanager');

ALTER TABLE calendar_events
  ADD COLUMN hr_username VARCHAR(100) NULL;

-- Preserve existing events and make them visible to the HR calendar owner.
UPDATE calendar_events
SET hr_username = @HR_USERNAME
WHERE hr_username IS NULL OR TRIM(hr_username) = '';

CREATE INDEX idx_calendar_hr_date
  ON calendar_events (hr_username, event_date, event_time);

SELECT event_id, hr_username, event_date, title
FROM calendar_events
ORDER BY event_date, event_time, event_id;
