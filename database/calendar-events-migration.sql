-- Run this against the same database configured by DB_NAME.
-- Safe for existing installations: creates the table only if it does not exist.
CREATE TABLE IF NOT EXISTS calendar_events (
  event_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_time TIME NOT NULL,
  category ENUM('Work', 'Personal', 'Urgent') NOT NULL DEFAULT 'Work',
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
