# Authentication setup

## HR Manager

Set these variables in your local `.env` file. Do not commit `.env`.

```env
HR_USERNAME=hrmanager
HR_EMAIL=hr@moderntech.com
HR_PASSWORD=replace-with-a-long-random-password
```

The login screen has an **HR Manager** option. The HR account is environment-backed rather than a public signup account.

## Employees

Employees do not self-register. HR provisions a password for an existing employee record:

```bash
node scripts/provision-employee.js <employee-id> <password>
```

Example:

```bash
node scripts/provision-employee.js 1 StrongEmployeePassword123!
```

The employee then selects **Employee** on the login screen and signs in with:

- Employee ID
- Their provisioned password

## Security model

- HR Manager credentials are kept in environment variables, not source code.
- Employee accounts are linked to `employees.employee_id`.
- Public signup has been removed.
- HR Manager JWTs have `Manager` role.
- Employee JWTs have `Staff` role.
- HR APIs are protected server-side with role middleware.
- Employees can only access their own employee profile, payroll, attendance and leave records.
- Frontend page guards redirect users to the correct portal, but server-side authorization is the actual security boundary.
