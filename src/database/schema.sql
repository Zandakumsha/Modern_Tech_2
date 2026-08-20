USE defaultdb;

-- ModernTech HR Management System — full schema (Module 2 + additions)
-- MySQL schema (deploy on Aiven MySQL service)
-- Run this against your Aiven database (default db name is usually `defaultdb`)

-- ============================================
-- 1. employees — the hub table everything else FKs into
-- ============================================
CREATE TABLE employees (
  employee_id        INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  `position`          VARCHAR(100),
  department          VARCHAR(100),
  salary              DECIMAL(10,2) NOT NULL DEFAULT 0,
  employment_history  TEXT,
  contact             VARCHAR(150)  NOT NULL UNIQUE,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. users — login credentials, separate from employee profile data
--    (nullable employee_id: lets you have an Admin user with no employee row)
-- ============================================
CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNIQUE,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('Admin','Manager','Staff') NOT NULL DEFAULT 'Staff',
  avatar_url     VARCHAR(500),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- 3. payroll — one row per pay period per employee
-- ============================================
CREATE TABLE payroll (
  payroll_id        INT AUTO_INCREMENT PRIMARY KEY,
  employee_id       INT NOT NULL,
  pay_period_start  DATE,
  pay_period_end    DATE,
  hours_worked      INT NOT NULL DEFAULT 0,
  leave_deductions  INT NOT NULL DEFAULT 0,
  final_salary      DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_payroll_employee (employee_id)
) ENGINE=InnoDB;

-- ============================================
-- 4. attendance — daily present/absent log
-- ============================================
CREATE TABLE attendance (
  attendance_id  INT AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT NOT NULL,
  `date`         DATE NOT NULL,
  status         ENUM('Present','Absent') NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_employee_date (employee_id, `date`),
  INDEX idx_attendance_date (`date`)
) ENGINE=InnoDB;

-- ============================================
-- 5. leave_requests — separate from attendance: has its own approval workflow
-- ============================================
CREATE TABLE leave_requests (
  request_id     INT AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT NOT NULL,
  `date`         DATE NOT NULL,
  reason         VARCHAR(255) NOT NULL,
  status         ENUM('Pending','Approved','Denied') NOT NULL DEFAULT 'Pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at     TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_leave_status (status)
) ENGINE=InnoDB;

-- ============================================
-- 6. reviews — performance reviews
-- ============================================
CREATE TABLE reviews (
  review_id      INT AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT NOT NULL,
  cycle          VARCHAR(50) NOT NULL,
  status         ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  score          DECIMAL(2,1),
  manager        VARCHAR(100),
  comments       TEXT,
  strengths      JSON,
  growth_areas   JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_reviews_cycle (cycle)
) ENGINE=InnoDB;

-- ============================================
-- 7. departments — normalized lookup for the fixed department list
--    used in data.html's dropdown (Development, HR, QA, Sales, etc.)
-- ============================================
CREATE TABLE departments (
  department_id  INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Note: employees.department stays as a free-text VARCHAR for now so this
-- doesn't require touching the employees table. To fully normalize later:
--   ALTER TABLE employees ADD COLUMN department_id INT,
--     ADD FOREIGN KEY (department_id) REFERENCES departments(department_id);
--   -- then backfill department_id from the department name, and drop the
--   -- old VARCHAR column once the app is updated to use the FK.

-- ============================================
-- 8. tasks — dashboard "to-do" items (index.html Add Task modal)
--    currently stored in localStorage's `tasks` array
-- ============================================
CREATE TABLE tasks (
  task_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  status       ENUM('pending','progress','completed') NOT NULL DEFAULT 'pending',
  priority     ENUM('minor','normal','critical') NOT NULL DEFAULT 'normal',
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_tasks_user (user_id),
  INDEX idx_tasks_status (status)
) ENGINE=InnoDB;

-- ============================================
-- 9. calendar_events — company calendar (calendar.html)
--    currently stored in localStorage's `calendarEvents` object
-- ============================================

CREATE TABLE calendar_events (
  event_id     INT AUTO_INCREMENT PRIMARY KEY,
  hr_username  VARCHAR(50) NOT NULL,
  event_date   DATE NOT NULL,
  title        VARCHAR(200) NOT NULL,
  event_time   TIME,
  category     ENUM('Work','Personal','Urgent') NOT NULL DEFAULT 'Work',
  description  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date),
  INDEX idx_events_hr_username (hr_username)
) ENGINE=InnoDB;

-- ============================================
-- 10. company_settings — company profile (settings.html "Company Details")
--     single-row-per-company table; app can just always read/write id = 1
-- ============================================
CREATE TABLE company_settings (
  company_id     INT AUTO_INCREMENT PRIMARY KEY,
  company_name   VARCHAR(150),
  industry       VARCHAR(100),
  email          VARCHAR(150),
  phone          VARCHAR(50),
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 11. user_preferences — per-user toggles (settings.html "Preferences")
--     dark mode, theme color, notification toggles
-- ============================================
CREATE TABLE user_preferences (
  user_id               INT PRIMARY KEY,
  dark_mode             BOOLEAN NOT NULL DEFAULT FALSE,
  color_theme           ENUM('default','blue','green','purple','red','orange') NOT NULL DEFAULT 'default',
  email_notifications   BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications    BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_alerts     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================
-- DATA — employees (from employee_info.json)
-- ============================================
INSERT INTO employees (employee_id, name, position, department, salary, employment_history, contact) VALUES
(1,  'Sibongile Nkosi',  'Software Engineer',      'Development', 70000, 'Joined in 2015, promoted to Senior in 2018', 'sibongile.nkosi@moderntech.com'),
(2,  'Lungile Moyo',     'HR Manager',             'HR',           80000, 'Joined in 2013, promoted to Manager in 2017', 'lungile.moyo@moderntech.com'),
(3,  'Thabo Molefe',     'Quality Analyst',        'QA',           55000, 'Joined in 2018', 'thabo.molefe@moderntech.com'),
(4,  'Keshav Naidoo',    'Sales Representative',   'Sales',        60000, 'Joined in 2020', 'keshav.naidoo@moderntech.com'),
(5,  'Zanele Khumalo',   'Marketing Specialist',   'Marketing',    58000, 'Joined in 2019', 'zanele.khumalo@moderntech.com'),
(6,  'Sipho Zulu',       'UI/UX Designer',         'Design',       65000, 'Joined in 2016', 'sipho.zulu@moderntech.com'),
(7,  'Naledi Moeketsi',  'DevOps Engineer',        'IT',           72000, 'Joined in 2017', 'naledi.moeketsi@moderntech.com'),
(8,  'Farai Gumbo',      'Content Strategist',     'Marketing',    56000, 'Joined in 2021', 'farai.gumbo@moderntech.com'),
(9,  'Karabo Dlamini',   'Accountant',             'Finance',      62000, 'Joined in 2018', 'karabo.dlamini@moderntech.com'),
(10, 'Fatima Patel',     'Customer Support Lead',  'Support',      58000, 'Joined in 2016', 'fatima.patel@moderntech.com');

-- ============================================
-- DATA — users (default admin account — CHANGE THIS PASSWORD before deploying)
-- password_hash below is a placeholder; generate a real bcrypt hash server-side, e.g.:
--   node -e "console.log(require('bcryptjs').hashSync('changeme123', 10))"
-- ============================================
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@moderntech.com', '$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH', 'Admin');

-- ============================================
-- DATA — payroll (from payroll_data.json)
-- ============================================
INSERT INTO payroll (employee_id, hours_worked, leave_deductions, final_salary) VALUES
(1,  160, 8,  69500),
(2,  150, 10, 79000),
(3,  170, 4,  54800),
(4,  165, 6,  59700),
(5,  158, 5,  57850),
(6,  168, 2,  64800),
(7,  175, 3,  71800),
(8,  160, 0,  56000),
(9,  155, 5,  61500),
(10, 162, 4,  57750);

-- ============================================
-- DATA — attendance (from attendance.json)
-- ============================================
INSERT INTO attendance (employee_id, `date`, status) VALUES
(1,'2026-07-27','Present'),(1,'2026-07-28','Absent'), (1,'2026-07-29','Present'),(1,'2026-07-30','Present'),(1,'2026-07-31','Present'),
(2,'2026-07-27','Present'),(2,'2026-07-28','Present'),(2,'2026-07-29','Absent'), (2,'2026-07-30','Present'),(2,'2026-07-31','Present'),
(3,'2026-07-27','Present'),(3,'2026-07-28','Present'),(3,'2026-07-29','Present'),(3,'2026-07-30','Absent'), (3,'2026-07-31','Present'),
(4,'2026-07-27','Absent'), (4,'2026-07-28','Present'),(4,'2026-07-29','Present'),(4,'2026-07-30','Present'),(4,'2026-07-31','Present'),
(5,'2026-07-27','Present'),(5,'2026-07-28','Present'),(5,'2026-07-29','Absent'), (5,'2026-07-30','Present'),(5,'2026-07-31','Present'),
(6,'2026-07-27','Present'),(6,'2026-07-28','Present'),(6,'2026-07-29','Absent'), (6,'2026-07-30','Present'),(6,'2026-07-31','Present'),
(7,'2026-07-27','Present'),(7,'2026-07-28','Present'),(7,'2026-07-29','Present'),(7,'2026-07-30','Absent'), (7,'2026-07-31','Present'),
(8,'2026-07-27','Present'),(8,'2026-07-28','Absent'), (8,'2026-07-29','Present'),(8,'2026-07-30','Present'),(8,'2026-07-31','Present'),
(9,'2026-07-27','Present'),(9,'2026-07-28','Present'),(9,'2026-07-29','Present'),(9,'2026-07-30','Absent'), (9,'2026-07-31','Present'),
(10,'2026-07-27','Present'),(10,'2026-07-28','Present'),(10,'2026-07-29','Absent'),(10,'2026-07-30','Present'),(10,'2026-07-31','Present');

-- ============================================
-- DATA — leave_requests (from attendance.json leaveRequests)
-- ============================================
INSERT INTO leave_requests (employee_id, `date`, reason, status) VALUES
(1,  '2026-08-22', 'Sick Leave',             'Approved'),
(1,  '2026-12-01', 'Personal',               'Pending'),
(2,  '2026-08-15', 'Family Responsibility',  'Denied'),
(2,  '2026-12-02', 'Vacation',               'Approved'),
(3,  '2026-08-10', 'Medical Appointment',    'Approved'),
(3,  '2026-12-05', 'Personal',               'Pending'),
(4,  '2026-08-20', 'Bereavement',            'Approved'),
(5,  '2026-12-01', 'Childcare',              'Pending'),
(6,  '2026-08-18', 'Sick Leave',             'Approved'),
(7,  '2026-08-22', 'Vacation',               'Pending'),
(8,  '2026-12-02', 'Medical Appointment',    'Approved'),
(9,  '2026-08-19', 'Childcare',              'Denied'),
(10, '2026-12-03', 'Vacation',               'Pending');

-- ============================================
-- DATA — reviews (from SEED_REVIEWS in main.js)
-- ============================================
INSERT INTO reviews (employee_id, cycle, status, score, manager, comments, strengths, growth_areas) VALUES
(1, 'Q2 2026', 'Completed',   4.2, 'D. Williams', 'Excellent analytical thinking. Consistently delivers high-quality reports ahead of deadlines.',
   JSON_ARRAY('Data Analysis','Communication'), JSON_ARRAY('Leadership','Stakeholder Management')),
(2, 'Q2 2026', 'Completed',   3.8, 'D. Williams', 'Good team player, needs to improve on time management and proactive communication.',
   JSON_ARRAY('Teamwork','Adaptability'), JSON_ARRAY('Time Management','Initiative')),
(3, 'Q2 2026', 'Completed',   4.5, 'T. Khumalo', 'Outstanding performance this quarter. Shows great initiative and technical depth.',
   JSON_ARRAY('Technical Skills','Problem Solving','Initiative'), JSON_ARRAY('Presentation Skills')),
(4, 'Q2 2026', 'In Progress', 3.5, 'T. Khumalo', 'Review in progress — awaiting final scoring.',
   JSON_ARRAY('Reliability'), JSON_ARRAY('Communication','Leadership')),
(5, 'Q2 2026', 'Completed',   4.7, 'A. Botha', 'Exceptional quarter. Zanele exceeded every target and mentored two junior staff members.',
   JSON_ARRAY('Leadership','Mentoring','Results-driven'), JSON_ARRAY('Delegation')),
(6, 'Q2 2026', 'Pending',     NULL, 'A. Botha', '', JSON_ARRAY(), JSON_ARRAY()),
(7, 'Q2 2026', 'Completed',   4.0, 'D. Williams', 'Solid contributor. Reliable and consistent across all tasks assigned this quarter.',
   JSON_ARRAY('Consistency','Attention to Detail'), JSON_ARRAY('Strategic Thinking','Networking')),
(8, 'Q2 2026', 'In Progress', 3.9, 'A. Botha', 'Good progress but review still being finalised with department head.',
   JSON_ARRAY('Communication','Creativity'), JSON_ARRAY('Deadlines','Prioritisation')),
(9, 'Q2 2026', 'Pending',     NULL, 'T. Khumalo', '', JSON_ARRAY(), JSON_ARRAY()),
(10,'Q2 2026', 'Completed',   4.1, 'D. Williams', 'Very good quarter. Fatima handled a difficult project exceptionally well under pressure.',
   JSON_ARRAY('Resilience','Project Management'), JSON_ARRAY('Public Speaking','Conflict Resolution'));

-- ============================================
-- DATA — departments (fixed lookup list used across the app's dropdowns)
-- ============================================
INSERT INTO departments (name) VALUES
('Development'), ('HR'), ('QA'), ('Sales'), ('Marketing'),
('Design'), ('IT'), ('Finance'), ('Support');

-- ============================================
-- DATA — company_settings (default row so the app always has one to read/update)
-- ============================================
INSERT INTO company_settings (company_name, industry, email, phone) VALUES
('ModernTech Solutions', 'Human Resources Technology', 'info@modern-tech.com', '+1 234 567 890');
