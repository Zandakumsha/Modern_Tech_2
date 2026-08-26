# 🏢 Modern Tech Solutions — Module 2

> **Modern Tech Solutions HR Management System**
> A full-stack HR management application created for **Module 2: Back-End Development and Databases** by extending and connecting the existing **Module 1 frontend** to a functional Node.js, Express and MySQL backend.

[![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-API-black?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-purple?logo=jsonwebtokens)](https://jwt.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 📌 Project Overview

The **Modern Tech Solutions HR Management System** was originally designed as a frontend project during **Module 1**. The frontend established the user interface, navigation, HR dashboards and employee-facing pages.

For **Module 2**, the main objective was to take that existing frontend and turn it into a working full-stack application by building a backend and database layer around it.

Instead of rebuilding the user interface from scratch, this project focuses on:

* 🔌 Connecting the existing Module 1 frontend to a real backend API
* 🗄️ Replacing static/mock data with persistent MySQL data
* 🔐 Implementing authentication and authorization
* 👥 Managing HR and employee records
* 💰 Connecting payroll functionality to employee data
* 🕐 Managing attendance and leave requests
* 📅 Managing calendar events
* ⭐ Managing employee performance reviews
* 📊 Providing dashboard analytics
* 🔔 Supporting notifications
* ⚙️ Persisting company and user preferences
* ✅ Managing tasks and completion status
* 🛡️ Protecting backend endpoints with server-side role checks

The result is a more complete HR management platform where the frontend, backend and database work together as one system.

---

# 🎯 Module 2 Objective

The purpose of this project was to demonstrate how a frontend application can be extended into a full-stack system using back-end development and database technologies.

### Module 1

**Frontend foundation**

* HTML pages
* CSS styling
* JavaScript interactions
* Navigation
* Dashboard layouts
* Employee portal
* HR portal
* Client-side interface and user experience

### Module 2

**Backend + database integration**

* Node.js server
* Express.js REST API
* MySQL database
* SQL database schema
* Authentication
* JWT tokens
* Role-based authorization
* CRUD operations
* API-to-frontend integration
* Persistent application data
* Server-side validation and error handling

### 🔄 Overall progression

```text
MODULE 1
Frontend UI
   ↓
HTML + CSS + JavaScript
   ↓
User Interface / User Experience
   ↓
MODULE 2
Node.js + Express API
   ↓
MySQL Database
   ↓
Authentication + Authorization
   ↓
Connected Full-Stack HR System
```

---

# ✨ Main Features

## 🔐 Authentication & Authorization

The application supports two main portal types:

### 👔 HR Manager

HR users can access administrative HR functionality and manage company information.

The HR account is configured through environment variables rather than public registration.

### 👨‍💼 Employee

Employees use an account connected to an existing employee record.

Employees do not publicly self-register. Their access is provisioned by HR.

### Security model

The project uses:

* 🔑 JWT-based authentication
* 🛡️ Express authentication middleware
* 👮 Role-based authorization middleware
* 🔒 Protected API routes
* 🧑‍💼 HR/Manager access controls
* 👨‍💼 Employee/Staff access controls
* 🔗 Employee accounts linked to employee records
* 🚫 No public employee signup

The backend is treated as the true security boundary; frontend page guards improve the user experience but are not relied on as the only security mechanism.

---

# 👥 Employee Management

The employee management module provides CRUD functionality for employee records.

### Supported operations

* 📋 View employees
* ➕ Create employee
* ✏️ Update employee
* 🗑️ Delete employee
* 👤 Load the authenticated employee's own profile

### API

```text
GET    /api/employees
GET    /api/employees/me
POST   /api/employees
PUT    /api/employees/:employeeId
DELETE /api/employees/:employeeId
```

Employee information is stored persistently in MySQL.

---

# 💰 Payroll Management

The payroll system connects payroll records to employees through the database.

The Module 2 implementation allows the frontend payroll functionality to obtain payroll information from the backend rather than depending on static data.

### Supported operations

* 📊 View payroll records
* 👤 Retrieve payroll by employee
* 🧾 Create custom payslips
* 🧩 Retrieve position and department options

### API

```text
GET  /api/payroll
GET  /api/payroll/:employeeId
POST /api/payroll
GET  /api/payroll/options/positions-departments
```

Payroll records are linked to employees using a foreign key.

---

# 🕐 Attendance & Leave Management

The attendance module allows attendance records and employee leave requests to be stored and managed through the backend.

### Attendance features

* ✅ Record attendance
* 📋 Retrieve attendance
* 👤 View attendance for a specific employee
* ✏️ Update attendance
* 🗑️ Delete attendance

### Leave features

* 📝 Create leave requests
* 📋 View leave requests
* ✅ Approve requests
* ❌ Deny requests
* 🗑️ Delete requests

### API

```text
GET    /api/attendance
GET    /api/attendance/employee/:employeeId
POST   /api/attendance
PUT    /api/attendance/:attendanceId
DELETE /api/attendance/:attendanceId

GET    /api/attendance/leave
POST   /api/attendance/leave
PATCH  /api/attendance/leave/:requestId
DELETE /api/attendance/leave/:requestId
```

The database prevents duplicate attendance records for the same employee and date.

---

# ⭐ Employee Performance Reviews

The reviews module supports employee performance management.

### Supported functionality

* 📋 Retrieve reviews
* ➕ Add performance reviews
* 📈 Store performance scores
* 📝 Store manager comments
* 💪 Record employee strengths
* 🌱 Record growth areas
* 🔄 Track review status

Review status values include:

```text
Pending
In Progress
Completed
```

---

# 📅 Calendar Management

The calendar module provides API functionality for creating and viewing events.

### Supported operations

* 📋 List events
* ➕ Create events
* 🗑️ Delete events

### API

```text
GET    /api/calendar
POST   /api/calendar
DELETE /api/calendar/:id
```

Calendar events can contain:

* Event date
* Event title
* Event time
* Category
* Description

Categories include:

```text
Work
Personal
Urgent
```

---

# 📊 Dashboard Analytics

The dashboard backend provides analytics for the HR dashboard.

### API

```text
GET /api/dashboard/analytics
```

The route is responsible for providing the dashboard with backend-generated data rather than relying entirely on frontend/static values.

This allows dashboard information to reflect database records and gives the frontend a dedicated analytics API.

---

# 🔔 Notifications

The application contains notification functionality for HR and employees.

### Supported operations

```text
GET    /api/notifications
GET    /api/notifications/mine
POST   /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

Access is role-aware so that HR and employees do not automatically receive the same notification permissions.

---

# ⚙️ Settings & Preferences

The settings module stores company configuration and user preferences.

### Company settings

* 🏢 Company name
* 🏭 Industry
* 📧 Company email
* ☎️ Company phone

### User preferences

* 🌙 Dark mode
* 🎨 Colour theme
* 📩 Email notifications
* 📲 Push notifications
* 🕐 Attendance alerts

### API

```text
GET /api/settings
PUT /api/settings/company
PUT /api/settings/preferences
```

---

# ✅ Task Management

The task module provides CRUD functionality for administrative tasks.

### Supported operations

* 📋 List tasks
* ➕ Create tasks
* ✏️ Update tasks
* ✅ Toggle task completion
* 🗑️ Delete tasks

### API

```text
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/completion
DELETE /api/tasks/:id
```

Task statuses include:

```text
pending
progress
completed
```

Task priorities include:

```text
minor
normal
critical
```

---

# 🗄️ Database Design

The project uses a relational MySQL database defined in:

```text
database/schema.sql
```

The schema contains the following primary tables:

| Table              | Purpose                                 |
| ------------------ | --------------------------------------- |
| `employees`        | Stores employee information             |
| `users`            | Stores login/account information        |
| `payroll`          | Stores employee payroll records         |
| `attendance`       | Stores daily attendance                 |
| `leave_requests`   | Stores leave applications and decisions |
| `reviews`          | Stores performance reviews              |
| `departments`      | Stores departments                      |
| `tasks`            | Stores administrative tasks             |
| `calendar_events`  | Stores calendar events                  |
| `company_settings` | Stores company configuration            |
| `user_preferences` | Stores user-specific preferences        |

### 🔗 Relationships

The database uses foreign keys to connect related data.

Examples:

```text
employees
   │
   ├── users
   ├── payroll
   ├── attendance
   ├── leave_requests
   └── reviews
```

The `users.employee_id` column links an account to an employee record.

Payroll, attendance, leave requests and reviews also reference employees using foreign keys.

This relational structure helps keep the system consistent and prevents application data from becoming disconnected.

---

# 🏗️ Project Architecture

The project follows a layered Express architecture.

```text
Modern_Tech_2/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── attendanceController.js
│   ├── calendarController.js
│   └── ...
│
├── database/
│   └── schema.sql
│
├── models/
│   ├── employee models
│   ├── payroll models
│   ├── review models
│   ├── task models
│   └── ...
│
├── middleware/
│   ├── auth.js
│   └── roles.js
│
├── src/
│   ├── server.js
│   └── routes/
│       ├── auth.routes.js
│       ├── employees.routes.js
│       ├── payroll.routes.js
│       ├── reviews.routes.js
│       ├── attendance.route.js
│       ├── calendar.routes.js
│       ├── dashboard.routes.js
│       ├── notifications.routes.js
│       ├── settings.routes.js
│       └── tasks.routes.js
│
├── public/
│   ├── index.html
│   ├── employee.html
│   ├── attendance.html
│   ├── calendar.html
│   ├── data.html
│   ├── ...
│   ├── css/
│   └── js/
│
├── scripts/
│   └── provisioning / utility scripts
│
├── .env.example
├── AUTH_SETUP.md
├── package.json
└── README.md
```

---

# 🔌 Backend Architecture

The server is started from:

```text
src/server.js
```

The server:

1. Loads environment variables with `dotenv`
2. Creates the Express application
3. Enables JSON and URL-encoded request parsing
4. Registers API route groups
5. Exposes a health-check endpoint
6. Serves the Module 1 frontend from `public/`
7. Returns a JSON 404 response for unknown API endpoints
8. Provides centralized error handling
9. Starts the HTTP server

### Base API structure

```text
/api
├── auth
├── employees
├── payroll
├── reviews
├── attendance
├── calendar
├── dashboard
├── notifications
├── settings
└── tasks
```

---

# 🖥️ Frontend Integration

A major goal of Module 2 was **not to replace the Module 1 frontend**, but to connect the existing frontend to the newly developed backend.

The `public/` folder contains the frontend pages and supporting JavaScript/CSS used by the application.

The backend serves this existing frontend directly:

```text
Express Server
      │
      ├── /api/... → Backend API
      │
      └── /        → public/index.html
                         │
                         ├── HTML
                         ├── CSS
                         └── JavaScript
```

This means the project operates as a single application rather than having a completely separate frontend and backend deployment architecture.

### Frontend areas represented in the repository

* 🏠 Main dashboard
* 👤 Employee portal
* 🕐 Attendance
* 📝 Leave management
* 💰 Payroll
* 📅 Calendar
* 📊 Data/dashboard views
* 🔔 Notifications
* ⚙️ Settings
* 📋 Tasks
* ⭐ Reviews

The JavaScript in `public/js/` provides the client-side logic required to communicate with the backend endpoints and update the interface.

---

# 📁 Important Repository Areas

| Directory / File      | Responsibility                             |
| --------------------- | ------------------------------------------ |
| `src/server.js`       | Starts Express and registers routes        |
| `src/routes/`         | Defines API endpoints                      |
| `controllers/`        | Handles request/response logic             |
| `models/`             | Handles database-related operations        |
| `middleware/`         | Authentication and role authorization      |
| `config/db.js`        | Database connection configuration          |
| `database/schema.sql` | Database structure                         |
| `public/`             | Module 1 frontend integrated into Module 2 |
| `public/css/`         | Frontend styling                           |
| `public/js/`          | Frontend/client-side functionality         |
| `scripts/`            | Development/administrative helper scripts  |
| `.env.example`        | Environment variable template              |
| `AUTH_SETUP.md`       | Authentication setup instructions          |
| `package.json`        | Project configuration and dependencies     |

---

# 🛠️ Technologies Used

## Backend

* **Node.js** — JavaScript runtime
* **Express.js 5** — HTTP server and REST API framework
* **mysql2** — MySQL database connectivity
* **dotenv** — Environment configuration
* **jsonwebtoken** — JWT authentication

## Database

* **MySQL**
* Relational tables
* Primary keys
* Foreign keys
* Unique constraints
* Indexes
* ENUM fields
* JSON fields
* Timestamps

## Frontend

The frontend originates from the **Module 1 project** and is contained within the `public/` directory.

It uses:

* HTML5
* CSS3
* JavaScript
* Browser-based API communication

---

# 📦 Installation

## 1. Clone the repository

```bash
git clone https://github.com/Zandakumsha/Modern_Tech_2.git
cd Modern_Tech_2
```

## 2. Install dependencies

```bash
npm install
```

The project dependencies are defined in `package.json`.

---

# 🔐 Environment Configuration

Create a `.env` file in the root directory.

Use `.env.example` as the starting point:

```bash
cp .env.example .env
```

On Windows, manually create `.env` if the copy command is unavailable.

### Example configuration

```env
PORT=3000
NODE_ENV=development

AUTH_PASSWORDLESS=true

DB_HOST=your-database-host
DB_PORT=your-database-port
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=defaultdb

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=2h

HR_USERNAME=hrmanager
HR_EMAIL=hr@moderntech.com
HR_PASSWORD=replace-with-a-strong-hr-password
```

### ⚠️ Important

Never commit your real `.env` file or production credentials.

The repository includes `.env.example` specifically so that sensitive configuration can remain outside source control.

---

# 🗃️ Database Setup

Create the database and tables using:

```text
database/schema.sql
```

The schema creates the core HR tables and relationships required by the application.

The database configuration is loaded through environment variables:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

---

# ▶️ Running the Application

## Development

Run:

```bash
npm run dev
```

This uses Node.js watch mode so the server can automatically restart when backend source files change.

## Production-style start

Run:

```bash
npm start
```

The project starts:

```text
src/server.js
```

By default, the server falls back to port `5000` when `PORT` is not supplied through the environment.

If `PORT=3000` is configured in `.env`, the application will use port `3000`.

---

# 🩺 API Health Check

Once the server is running, the backend provides:

```text
GET /api/health
```

A successful response is similar to:

```json
{
  "status": "ok",
  "message": "Modern Tech API is running"
}
```

This is useful for quickly confirming that the Express backend is running.

---

# 🔑 Authentication Setup

Authentication is documented in:

```text
AUTH_SETUP.md
```

## HR login

The HR Manager account is configured through environment variables:

```env
HR_USERNAME=hrmanager
HR_EMAIL=hr@moderntech.com
HR_PASSWORD=your-secure-password
```

The HR account is environment-backed rather than created through public signup.

## Employee login

Employees are provisioned against existing employee records.

Example:

```bash
node scripts/provision-employee.js 1 StrongEmployeePassword123!
```

The employee then logs in using:

* Employee ID
* Provisioned password

### Roles

```text
Manager → HR Manager
Staff   → Employee
```

Server-side middleware is used to enforce access to protected resources.

---

# 🔄 How the Application Connects

The most important Module 2 concept is the flow of information between the three layers:

```text
┌─────────────────────────────┐
│      Module 1 Frontend      │
│ HTML + CSS + JavaScript     │
└──────────────┬──────────────┘
               │
               │ HTTP requests
               ▼
┌─────────────────────────────┐
│       Express Backend       │
│ REST API + Controllers      │
│ Auth + Role Middleware      │
└──────────────┬──────────────┘
               │
               │ SQL queries
               ▼
┌─────────────────────────────┐
│         MySQL DB            │
│ Employees / Payroll / etc.  │
└─────────────────────────────┘
```

### Example: Employee Profile

```text
Employee opens "My Profile"
          ↓
Frontend sends authenticated API request
          ↓
Express route receives request
          ↓
Authentication middleware verifies JWT
          ↓
Controller processes the request
          ↓
Model/database layer queries MySQL
          ↓
Employee data is returned as JSON
          ↓
Frontend displays the employee information
```

This same architecture is reused throughout the application for payroll, attendance, leave, reviews, notifications, settings, tasks and other features.

---

# 🧪 Testing & Verification

Before considering the system complete, the following areas should be tested:

### Authentication

* [ ] HR Manager can log in
* [ ] Employee can log in
* [ ] Invalid credentials are rejected
* [ ] Protected endpoints reject unauthenticated requests
* [ ] Role restrictions are enforced

### Employees

* [ ] Employees load from the database
* [ ] Employee creation works
* [ ] Employee updates work
* [ ] Employee deletion works
* [ ] Employee profile loads correctly

### Payroll

* [ ] Payroll data loads from MySQL
* [ ] Employee payroll can be retrieved
* [ ] Payslip creation works
* [ ] Payroll values match employee records

### Attendance & Leave

* [ ] Attendance can be recorded
* [ ] Attendance can be edited/deleted
* [ ] Leave requests can be created
* [ ] Leave requests can be approved/denied
* [ ] Employee leave history is displayed correctly

### Other modules

* [ ] Dashboard analytics load
* [ ] Calendar events load/create/delete
* [ ] Reviews load/create
* [ ] Notifications load/update
* [ ] Settings save correctly
* [ ] Tasks create/update/complete/delete correctly

---

# 🛡️ Security Considerations

The application includes several security-focused design decisions:

* 🔐 Passwords are not intended to be stored directly in source code
* 🔑 JWTs are used for authenticated sessions
* 🧑‍⚖️ Role middleware is applied to protected HR/employee operations
* 🚫 Public employee signup is disabled
* 🔗 Employee accounts are linked to employee records
* 🌐 Database credentials are stored in environment variables
* 🔒 `.env` should never be committed
* 🛑 Server-side authorization is treated as the actual security boundary

For a production deployment, additional hardening such as HTTPS, stronger secret management, rate limiting, validation libraries, security headers and production database policies should also be considered.

---

# 🌳 Git & Team Development

The project was developed as a continuation of the Module 1 codebase.

A feature-based Git workflow was used during development, with work separated into branches before being integrated into the main project.

Typical workflow:

```text
main
 │
 ├── develop
 │    │
 │    ├── feature/payroll
 │    ├── feature/...
 │    └── bugfix/...
 │
 └── merged/stabilised work
```

This approach makes it easier to:

* 👥 Work on different modules independently
* 🔍 Review changes before merging
* 🧩 Integrate backend features into the existing frontend
* 🛡️ Reduce the risk of breaking stable functionality
* 📚 Keep the development process organised

---

# 🚀 Future Improvements

The current project provides a strong Module 2 full-stack foundation, but several improvements could be added in future iterations:

* 📱 Improve mobile/responsive behaviour across all pages
* ✅ Add automated backend tests
* 🧪 Add integration/API testing
* 🧱 Add request validation and stricter error schemas
* 🛡️ Add security headers and rate limiting
* 🔄 Introduce database migrations
* 📈 Expand dashboard analytics
* 📊 Add richer reporting and export tools
* ☁️ Deploy frontend, backend and database to production infrastructure
* 🔁 Add CI/CD with automated testing
* 🔐 Add stronger production secret management

---

# 🧑‍💻 Project Structure Summary

```text
Modern_Tech_2
│
├── backend
│   ├── Node.js
│   ├── Express
│   ├── REST API
│   ├── JWT authentication
│   ├── Role-based authorization
│   ├── Controllers
│   ├── Models
│   ├── Middleware
│   └── MySQL integration
│
├── database
│   └── schema.sql
│
├── frontend
│   └── Module 1 frontend integrated into public/
│
└── project configuration
    ├── package.json
    ├── .env.example
    └── AUTH_SETUP.md
```

---

# 🏁 Final Project Outcome

This Module 2 project represents the transition from a **frontend-only HR management interface** into a **database-backed full-stack HR management system**.

The key achievement is the integration of the existing Module 1 frontend with:

> **Node.js + Express + MySQL + JWT authentication + role-based authorization + REST APIs**

The result is an application where HR and employees can interact with persistent data through a structured backend rather than relying only on static frontend information.

---

## 👨‍💻 Project Repository

**GitHub:**
https://github.com/Zandakumsha/Modern_Tech_2

---

## 📚 Related Documentation

* [`AUTH_SETUP.md`](./AUTH_SETUP.md) — Authentication and employee account provisioning
* [`database/schema.sql`](./database/schema.sql) — Database schema
* [`package.json`](./package.json) — Project configuration and dependencies
* [`src/server.js`](./src/server.js) — Main Express server
  ::: 
