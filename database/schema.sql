USE defaultdb;

-- ModernTech HR Management System — schema
-- Tasks and calendar events are standalone records.

CREATE TABLE employees (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  `position` VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  employment_history TEXT,
  contact VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Manager','Staff') NOT NULL DEFAULT 'Staff',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE payroll (
  payroll_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  pay_period_start DATE,
  pay_period_end DATE,
  hours_worked INT NOT NULL DEFAULT 0,
  leave_deductions INT NOT NULL DEFAULT 0,
  final_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_payroll_employee (employee_id)
) ENGINE=InnoDB;

CREATE TABLE attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  `date` DATE NOT NULL,
  status ENUM('Present','Absent') NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_employee_date (employee_id, `date`),
  INDEX idx_attendance_date (`date`)
) ENGINE=InnoDB;

CREATE TABLE leave_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  `date` DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Pending','Approved','Denied') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP NULL,
  decided_by_name VARCHAR(100) NULL,
  decided_by_email VARCHAR(150) NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_leave_status (status)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  cycle VARCHAR(50) NOT NULL,
  status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  score DECIMAL(2,1),
  manager VARCHAR(100),
  comments TEXT,
  strengths JSON,
  growth_areas JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  INDEX idx_reviews_cycle (cycle)
) ENGINE=InnoDB;

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE tasks (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  status ENUM('pending','progress','completed') NOT NULL DEFAULT 'pending',
  priority ENUM('minor','normal','critical') NOT NULL DEFAULT 'normal',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority)
) ENGINE=InnoDB;

CREATE TABLE calendar_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_time TIME NOT NULL,
  category ENUM('Work','Personal','Urgent') NOT NULL DEFAULT 'Work',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB;

CREATE TABLE company_settings (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(150),
  industry VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_preferences (
  user_id INT PRIMARY KEY,
  dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
  color_theme ENUM('default','blue','green','purple','red','orange') NOT NULL DEFAULT 'default',
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
