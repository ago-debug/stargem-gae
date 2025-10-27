# Sistema Gestione Corsi - Course Management System

## Overview
Comprehensive web-based course management system to replace Google Sheets setup. Built with React, Express, PostgreSQL, and Drizzle ORM.

## Features
- ✅ Student enrollment and member management
- ✅ Course management with categories/subcategories
- ✅ Instructor management with hourly rates
- ✅ Membership cards with barcode access control
- ✅ Medical certificate tracking
- ✅ Payment processing (Stripe integration ready)
- ✅ Attendance logging via barcode scanning
- ✅ Reporting and statistics dashboard
- ✅ Data import from CSV/Excel (Google Sheets migration)

## Tech Stack
- **Frontend**: React 18, Wouter (routing), TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   └── app-sidebar.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   └── authUtils.ts
│   │   ├── pages/
│   │   │   ├── landing.tsx      # Public landing page
│   │   │   ├── dashboard.tsx    # Main dashboard
│   │   │   ├── members.tsx      # Member management
│   │   │   ├── courses.tsx      # Course management
│   │   │   ├── categories.tsx   # Category hierarchy
│   │   │   ├── instructors.tsx  # Instructor management
│   │   │   ├── memberships.tsx  # Membership cards & certificates
│   │   │   ├── payments.tsx     # Payment tracking
│   │   │   ├── access-control.tsx # Barcode scanner
│   │   │   ├── reports.tsx      # Statistics & reports
│   │   │   └── import-data.tsx  # CSV/Excel import
│   │   ├── App.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Data access layer (CRUD operations)
│   ├── routes.ts          # API endpoints
│   ├── replitAuth.ts      # Authentication setup
│   ├── index.ts           # Server entry point
│   └── vite.ts            # Vite dev server integration
├── shared/
│   └── schema.ts          # Drizzle schema & types
└── design_guidelines.md   # UI/UX design system

```

## Database Schema
Complete PostgreSQL schema with the following tables:
- `users` - Authenticated users (Replit Auth)
- `sessions` - User sessions (Replit Auth)
- `members` - Student/member records
- `categories` - Hierarchical course categories
- `instructors` - Instructor profiles and specializations
- `instructor_rates` - Hourly rates per course type
- `courses` - Course catalog with scheduling
- `enrollments` - Student enrollments in courses
- `memberships` - Membership cards with barcodes
- `medical_certificates` - Medical certificate tracking
- `payments` - Payment records and transactions
- `access_logs` - Barcode access control logs

## API Endpoints
All endpoints require authentication (`/api/login` to authenticate):

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create new member
- `PATCH /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Instructors
- `GET /api/instructors` - List all instructors
- `POST /api/instructors` - Create instructor
- `PATCH /api/instructors/:id` - Update instructor
- `DELETE /api/instructors/:id` - Delete instructor

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course
- `PATCH /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Memberships
- `GET /api/memberships` - List all memberships
- `POST /api/memberships` - Create membership

### Medical Certificates
- `GET /api/medical-certificates` - List all certificates
- `POST /api/medical-certificates` - Create certificate

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Create payment
- `PATCH /api/payments/:id` - Update payment status

### Access Control
- `GET /api/access-logs` - List access logs
- `POST /api/access-logs` - Log barcode scan (validates membership)

### Statistics
- `GET /api/stats/dashboard` - Dashboard overview stats
- `GET /api/stats/alerts` - Expiry alerts
- `GET /api/stats/recent-activity` - Recent enrollments/payments
- `GET /api/stats/reports` - Detailed reports

### Import
- `POST /api/import` - Import data from CSV/Excel (members, courses, instructors)

## Running the Project
```bash
npm run dev
```
Server runs on port 5000 (both backend and frontend).

## Database Management
```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# Open Drizzle Studio to view/edit data
npm run db:studio
```

## Environment Variables
Required secrets (managed by Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit app identifier
- `REPLIT_DOMAINS` - Comma-separated domains

Optional (for Stripe integration):
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (frontend)

## Design System
The application follows a modern SaaS aesthetic inspired by Linear, Notion, and Stripe Dashboard:
- **Font**: Inter (Google Fonts)
- **Color Scheme**: Neutral grays with subtle primary accent
- **Components**: shadcn/ui library with Radix UI primitives
- **Dark Mode**: Full dark mode support via Tailwind CSS
- **Spacing**: Consistent 4px/8px grid system

## Authentication Flow
1. User navigates to app (shows landing page if not authenticated)
2. Click "Accedi alla Piattaforma" → redirects to `/api/login`
3. Replit Auth handles OAuth flow (Google, GitHub, Email)
4. On success, redirects to dashboard at `/`
5. `useAuth()` hook provides authentication state throughout app

## Next Steps / TODO
- [x] Implement CSV/Excel import functionality with multer and papaparse
- [ ] Add Stripe payment integration for online payments (ready - needs API keys)
- [ ] Implement email notifications for expiring memberships
- [ ] Add bulk operations for member management
- [ ] Create printable membership cards with QR codes
- [ ] Add calendar view for course schedules
- [ ] Implement advanced reporting with charts
- [ ] Add role-based access control (admin/staff/instructor)

## Recent Changes
- **2024-10-27**: Enhanced Member Management & CSV Import
  - **Expanded member fields**: Added fiscal code, mobile, card data (number, issue/expiry dates), medical certificate tracking, parent information for minors
  - **CSV/Excel import**: Full implementation with multer and papaparse for members, courses, and instructors
  - **Smart forms**: Auto-show parent fields for minors based on date of birth
  - **Enhanced table view**: Display card numbers, expiry dates, medical certificate status, enrolled courses per member

- **2024-10-25**: Initial implementation
  - Complete database schema with Drizzle ORM
  - Full CRUD API for all resources
  - React frontend with 10 pages (landing, dashboard, members, courses, categories, instructors, memberships, payments, access control, reports, import)
  - Replit Auth integration
  - Sidebar navigation with wouter routing
  - shadcn/ui component library
  - Responsive design with Tailwind CSS

## Notes
- The system uses PostgreSQL with automatic barcode validation for access control
- All dates are stored in the database, with expiry tracking for memberships and medical certificates
- The dashboard shows real-time alerts for expiring items
- Import functionality placeholder is ready for CSV parsing implementation
