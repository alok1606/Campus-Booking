# CampusBook — Campus Resource & Event Management System

## Project Structure

```
campus-booking/
├── backend/          # Node.js + Express + MongoDB API
└── frontend/         # React + Vite + Tailwind CSS
```

---

## Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`)
- npm

---

## Backend Setup

```bash
cd backend
npm install
```

### Environment Variables

The `.env` file is already included with defaults:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campus_booking
JWT_SECRET=campusbookingsecret2024
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Seed the Database

```bash
npm run seed
```

This creates demo users, resources, events, and bookings.

**Demo credentials:**
| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@campus.edu         | Admin@123    |
| Faculty | faculty@campus.edu       | Faculty@123  |
| Student | student@campus.edu       | Student@123  |

### Run Backend

```bash
npm run dev       # Development (nodemon)
npm start         # Production
```

Server starts on `http://localhost:5000`

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`

The Vite dev server proxies `/api` → `http://localhost:5000`

---

## Features

### All Users
- Register / Login with JWT auth
- View & search events and resources
- Create booking requests with conflict detection
- Get next-available slot suggestions on conflicts
- Notifications for booking/event status changes

### Faculty & Admin
- Approve / reject bookings with optional reasons
- Approve / reject / mark-under-review events
- View Reports (bookings & events) with CSV export
- Filter by date range

### Admin Only
- Add / edit / delete resources
- Toggle user active/inactive
- View full Audit Log with action filtering & pagination
- Dashboard with system-wide stats

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/events | List events |
| POST | /api/events | Create event |
| PUT | /api/events/:id | Update event |
| PATCH | /api/events/:id/submit | Submit for review |
| PATCH | /api/events/:id/review | Approve/Reject event |
| DELETE | /api/events/:id | Delete event |
| GET | /api/resources | List resources |
| POST | /api/resources | Create resource (admin) |
| PUT | /api/resources/:id | Update resource (admin) |
| DELETE | /api/resources/:id | Delete resource (admin) |
| GET | /api/resources/:id/availability | Get bookings for a day |
| GET | /api/bookings | List bookings |
| POST | /api/bookings | Create booking |
| PATCH | /api/bookings/:id/approve | Approve booking |
| PATCH | /api/bookings/:id/reject | Reject booking |
| PATCH | /api/bookings/:id/cancel | Cancel booking |
| GET | /api/bookings/export | Export CSV |
| GET | /api/notifications | Get notifications |
| PATCH | /api/notifications/:id/read | Mark read |
| PATCH | /api/notifications/read-all | Mark all read |
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/users | All users |
| PATCH | /api/admin/users/:id/toggle | Toggle active |
| GET | /api/admin/audit-logs | Audit logs |
| GET | /api/reports | Reports data |
| GET | /api/reports/export | Export report CSV |
