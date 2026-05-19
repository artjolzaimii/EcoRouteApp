# EcoRoute Admin Panel Guide

## Accessing the Admin Panel

Navigate to `/admin` in your browser to access the complete admin dashboard.

## Pages Overview

The admin panel includes 9 comprehensive pages:

1. **Dashboard** (`/admin`) - Overview with metrics, charts, and activity feed
2. **Users** (`/admin/users`) - Complete user management with detailed drawers
3. **Partners** (`/admin/partners`) - Eco-partner management with approval workflow
4. **Coupons & Offers** (`/admin/coupons`) - Coupon creation and management
5. **Map View** (`/admin/map`) - Interactive map with partner locations
6. **Badges** (`/admin/badges`) - Badge system configuration
7. **Analytics** (`/admin/analytics`) - Charts and performance metrics
8. **Reports** (`/admin/reports`) - Data export and report generation
9. **Settings** (`/admin/settings`) - System configuration and admin accounts

## Responsive Design

### Desktop (1280px+)
- Fixed left sidebar (240px width)
- Full table views
- Multi-column layouts
- Sidebar always visible

### Tablet (768px-1279px)
- Collapsed icon-only sidebar (64px width)
- Hover tooltips on sidebar icons
- Responsive grids
- Table layouts maintained

### Mobile (Below 768px)
- Sidebar hidden by default
- Bottom navigation bar with 5 main sections
- Hamburger menu for full sidebar overlay
- Tables convert to card stacks
- Touch-optimized inputs (44px minimum height)

## Design System

The admin panel uses the exact EcoRoute color palette:

- Primary Green: #2D8653
- Dark Green: #1A5C38
- Light Green: #EAF4EE
- Pale Green: #D0EBD9
- Charcoal: #1A1A1A
- Muted Gray: #666666
- Border: #B8D8C4
- Warning Amber: #854F0B
- Danger Red: #A32D2D

Border radius: 6px (inputs), 10px (cards), 14px (large panels)

## Features

### Dashboard
- Real-time metrics cards
- Dual-axis line charts for trends
- Live activity feed
- Top users leaderboard
- Pending partner applications

### Users
- Advanced filtering (role, status)
- Bulk operations
- Detailed user drawer with tabs:
  - Overview with stats
  - Trip history
  - Points ledger with transactions
  - Badge collection
- Admin point adjustment with audit trail

### Partners
- Status-based tabs (All, Active, Pending, Suspended, Rejected)
- Partner card grid with performance metrics
- Add/edit partner modal with:
  - Business information
  - Location picker (lat/lng)
  - Trigger radius slider
  - Monthly fee configuration

### Coupons
- Partner filter sidebar
- Coupon cards with redemption progress
- Create coupon modal with:
  - Discount type selection (%, fixed, free item)
  - Earn type (free, points, trips)
  - Date range picker
  - Usage limits

### Map View
- Full-screen interactive map
- Partner location pins with status colors
- Filterable left panel
- Edit mode for draggable pins and radius adjustment
- Partner detail popup on pin click

### Badges
- Badge card grid
- Icon picker
- Condition configuration
- Points reward input
- Live preview panel

### Analytics
- Date range selector (7D, 30D, 90D, custom)
- Multiple chart types (line, bar, pie, horizontal bar)
- Points economy overview
- Partner performance table
- Top badges earned

### Reports
- Three report types (User, Partner, Impact)
- Date range selection
- Include options (checkboxes)
- Format toggle (CSV/PDF)
- Recent exports table with download

### Settings
- 6 organized sections
- General app configuration
- Points system multipliers
- Streak milestone bonuses
- Notification toggles
- Partner defaults
- Admin account management
- Danger zone with confirmation
- Unsaved changes warning bar

## Mock Data

All pages use realistic mock data from `/src/app/data/adminMockData.ts` including:
- 5 mock users (mix of User, Partner, Admin roles)
- 5 mock partners (Active and Pending)
- 3 mock coupons with various configurations
- 6 mock badges
- 10 activity events
- Chart data for 30 days
- Trip mode distribution
- Top 10 cities by trips

## Navigation

### Desktop/Tablet Sidebar
- Organized by sections: Overview, Users & Community, Partner Network, Data, System
- Active page highlighting
- Admin user info in footer

### Mobile Bottom Nav
- 5 quick access icons: Dashboard, Users, Partners, Analytics, Settings
- Active indicator
- Space-efficient layout

## Technical Notes

- Built with React and React Router
- Uses Recharts for data visualization
- Responsive with Tailwind CSS
- Custom admin design system
- All components fully functional (mock actions)
- Professional SaaS quality UI

## Getting Started

1. Navigate to `/admin` in your browser
2. Explore the dashboard overview
3. Click through the navigation to see all pages
4. Try different screen sizes to see responsive behavior
5. Interact with modals, drawers, and forms

Enjoy managing the EcoRoute platform! 🌱
