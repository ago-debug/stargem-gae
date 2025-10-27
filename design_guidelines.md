# Design Guidelines: Course Management System

## Design Approach

**Selected Approach**: Design System + Modern SaaS Admin
- Primary inspiration: Linear, Notion
- Focus on information density with breathing room
- Clean, professional aesthetic prioritizing functionality
- Emphasis on data clarity and workflow efficiency

**Core Principles**:
1. Information hierarchy through typography and spacing
2. Consistent, predictable patterns across all modules
3. Dense data presentation without visual clutter
4. Quick access to critical actions and alerts

---

## Typography System

**Font Stack**: Inter via Google Fonts CDN (primary), system font fallback

**Hierarchy**:
- Page Headers: text-3xl, font-semibold (Dashboard, Gestione Corsi, etc.)
- Section Headers: text-xl, font-semibold
- Card/Module Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Labels/Metadata: text-sm, font-medium
- Helper Text/Captions: text-xs, font-normal
- Table Headers: text-xs, font-semibold, uppercase, tracking-wide

**Special Cases**:
- Statistics/Numbers: text-2xl to text-4xl, font-bold
- Badges (Scaduto, Attivo): text-xs, font-semibold, uppercase

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing (cards, badges): p-2, gap-2
- Standard spacing (forms, sections): p-4, p-6, gap-4
- Generous spacing (page sections): p-8, py-12, gap-8
- Large spacing (page margins): p-16

**Grid System**:
- Sidebar Navigation: w-64 (256px) fixed on desktop
- Main Content Area: flex-1 with max-w-7xl container
- Dashboard Stats Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Course/Student Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Two-column forms: grid-cols-1 md:grid-cols-2

**Container Strategy**:
- Page wrapper: p-6 to p-8
- Card containers: p-4 to p-6
- Form sections: space-y-6
- Table rows: py-3 to py-4

---

## Component Library

### Navigation Structure

**Sidebar Navigation** (Primary):
- Fixed left sidebar, full height
- Logo/Brand at top (h-16)
- Navigation sections grouped by function:
  - Dashboard (home icon)
  - Gestione Iscritti (users icon)
  - Gestione Corsi (calendar icon)
  - Categorie Corsi (folder icon)
  - Insegnanti (briefcase icon)
  - Tessere & Certificati (card icon)
  - Pagamenti (credit card icon)
  - Accessi/Presenze (check icon)
  - Report & Statistiche (chart icon)
- Active state: distinct visual treatment
- User profile section at bottom

**Top Bar**:
- Search functionality (expandable)
- Notification bell with count badge
- Alert indicators for scadenze imminenti
- User dropdown menu

### Dashboard Components

**Statistics Cards**:
- 4-column grid on desktop
- Each card: metric value (large), label, trend indicator
- Icons from Heroicons
- Metrics: Totale Iscritti, Corsi Attivi, Scadenze Questa Settimana, Entrate Mese

**Alert/Warning Section**:
- Prominent placement below stats
- Cards for: Tessere in scadenza (7 giorni), Certificati medici scaduti, Pagamenti in sospeso
- Each with count badge and "Vedi tutti" link

**Recent Activity Table**:
- Latest 10 iscrizioni/pagamenti
- Columns: Data, Nome, Corso, Azione, Stato
- Compact row height

### Data Tables

**Standard Table Pattern**:
- Sticky header row
- Alternating row treatment for readability
- Actions column (right-aligned): Edit, Delete icons
- Sortable columns (arrow indicators)
- Checkbox column for bulk actions (left-most)
- Pagination controls: Previous/Next + page numbers

**Filtri e Ricerca**:
- Search input: w-full md:w-96, left-aligned
- Filter chips: inline, dismissible
- Advanced filters: dropdown panel

**Status Badges** (for tessere, certificati, pagamenti):
- Small, rounded badges
- Clear visual distinction between states
- Text: Attivo, Scaduto, In Scadenza, Pagato, In Attesa

### Forms

**Form Layout**:
- Two-column grid for related fields (desktop)
- Single column for complex fields or mobile
- Field groups with subtle dividers
- Section headers within forms

**Input Fields**:
- Label above input (text-sm, font-medium)
- Input height: h-10 to h-12
- Border treatment: rounded-md
- Focus states clearly visible
- Error messages: text-sm below input
- Helper text: text-xs below input

**Form Actions**:
- Right-aligned button group
- Primary action (Salva): prominent
- Secondary action (Annulla): subdued
- Spacing: gap-3

**Special Inputs**:
- Date pickers for scadenze
- Dropdown selects for corsi, categorie, insegnanti
- Number inputs for prezzi, capienza
- File upload for certificati medici

### Course Management

**Course Cards**:
- Image placeholder (aspect-ratio-16/9)
- Title, category badge, instructor name
- Key info: Prezzo, Posti disponibili, Orario
- Quick action buttons

**Category/Subcategory Tree**:
- Expandable/collapsible structure
- Indentation for subcategories
- Add/Edit/Delete actions per level
- Drag-to-reorder capability indicator

### Barcode Attendance System

**Scanning Interface**:
- Large scan area (square, centered)
- Camera feed preview
- Manual ID input fallback
- Recent scans list below
- Success/error feedback prominent

**Attendance Log**:
- Real-time update table
- Columns: Orario, Nome, Corso, Stato Tessera
- Visual alert for expired memberships

### Instructor Management

**Instructor Cards/List**:
- Profile image placeholder
- Name, specialization
- Courses assigned (count)
- Tariff structure display
- Contact info

**Tariff Configuration**:
- Table: Tipo Corso / Tariffa Oraria
- Add/edit inline or modal

### Payment Management

**Payment Dashboard**:
- Summary cards: Totale Incassato, In Attesa, Scaduti
- Filterable payment table
- Manual payment processing and tracking
- Generate invoice/receipt actions

**Payment Form**:
- Student selection dropdown
- Course/Membership selection
- Amount (auto-calculated or manual)
- Payment method selection
- Due date picker
- Notes field

### Modals & Overlays

**Modal Pattern**:
- Centered, max-w-2xl for forms
- max-w-md for confirmations
- Close button (top-right)
- Actions in footer

**Toast Notifications**:
- Top-right corner
- Success, error, info, warning variants
- Auto-dismiss or manual close

---

## Responsive Behavior

**Breakpoint Strategy**:
- Mobile (< 768px): Sidebar collapses to hamburger, single-column layouts, stacked stats
- Tablet (768px - 1024px): Sidebar visible, 2-column grids
- Desktop (> 1024px): Full layout with 3-4 column grids

**Mobile Optimizations**:
- Bottom navigation bar alternative
- Swipeable card interfaces
- Collapsible filter panels
- Touch-friendly tap targets (min h-11)

---

## Images

**Profile/Instructor Images**:
- Placeholder avatar circles: w-10 h-10 (small), w-16 h-16 (medium), w-24 h-24 (large)
- Course images: aspect-ratio-16/9, rounded-lg

**Dashboard**: No hero image required - focus on data and functionality

**Empty States**:
- Centered illustrations (simple icons or vectors)
- Helpful text explaining how to add first item
- Primary action button

---

## Key UX Patterns

**Bulk Actions**: Checkbox selection + action bar appears at top
**Quick Edit**: Inline editing for simple fields (click to edit)
**Confirmation Dialogs**: For destructive actions (delete, archive)
**Loading States**: Skeleton screens for tables, spinner for buttons
**Progressive Disclosure**: Advanced options hidden until needed
**Smart Defaults**: Pre-fill forms based on context