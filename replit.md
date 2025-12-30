# Sistema Gestione Corsi - Course Management System

## Overview
This project is a comprehensive web-based course management system designed to replace manual processes, specifically migrating from Google Sheets. It aims to streamline operations for student enrollment, course scheduling, instructor management, payment processing, and access control. The system provides robust categorization for clients and courses, detailed studio management, and extensive reporting capabilities. The business vision is to offer a complete solution for educational or fitness institutions to efficiently manage their daily operations, enhancing user experience and data integrity.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask before making any major architectural changes or introducing new dependencies. I appreciate detailed explanations of complex solutions, but keep the language straightforward. Ensure all new features are accompanied by relevant tests. Do not make changes to the `design_guidelines.md` file.

## System Architecture
The system employs a client-server architecture. The frontend is built with **React 18**, utilizing **Wouter** for routing, **TanStack Query** for data fetching and caching, and **shadcn/ui** with **Tailwind CSS** for a modern, responsive UI/UX inspired by platforms like Linear and Notion. The design system features the Inter font, neutral gray color schemes with subtle accents, and full dark mode support.

The backend is developed with **Express.js** and **TypeScript**, providing a robust API layer. **PostgreSQL** (hosted on Neon) serves as the primary database, managed by **Drizzle ORM** for type-safe schema definition and query building. Authentication is handled via **Replit Auth** (OpenID Connect).

Key features and architectural decisions include:
- **Client Categorization**: Hierarchical parent/child categories for members.
- **Course Management**: Courses include unique SKUs, scheduling details (day, time, recurrence), studio assignment, and support for three instructors (primary, two secondary).
- **Studio Management**: Dedicated module for managing studios/rooms with capacity, equipment, operating days, and hours.
- **Enrollment & Payments**: Comprehensive workflow supporting manual payment processing, automatic generation of payment records upon enrollment, and linking payments to specific enrollments.
- **Membership & Access Control**: Membership cards with barcode support for attendance logging and access validation.
- **Data Import**: Functionality to import data from CSV/Excel for members, courses, and instructors to facilitate migration.
- **Structured Scheduling**: Structured dropdown selectors for defining studio operating hours and course schedules (day of week, start/end times, recurrence type).
- **Location Autocomplete**: City search with auto-fill for province and postal code. Database includes all 7904 Italian municipalities (comuni) with all 107 provinces. Minimum 3 characters required for search.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Frontend UI Library**: shadcn/ui (built on Radix UI)
- **Styling Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Data Fetching/Caching**: TanStack Query
- **Routing**: Wouter
- **CSV/Excel Parsing**: papaparse
- **File Uploads**: multer