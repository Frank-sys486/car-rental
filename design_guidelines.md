# Car Rental Management System - Design Guidelines

## Design Approach
The user has provided detailed frontend specifications. Following those exact requirements:

---

## Layout & Navigation

### Global Role Toggle
- **Position**: Navbar (persistent across all pages)
- **Toggle Switch**: [View as Customer] ↔ [View as Admin]
- **Default State**: Admin view on initial load
- **Mobile Consideration**: Ensure toggle is easily accessible, minimum 48px touch target

---

## Page-Specific Designs

### 1. LANDING PAGE (Home) - "Split" Design

**Hero Section**:
- Clean, modern hero with high-quality car background image
- Full-width immersive hero treatment

**Dual Action Card** (Floating centered in hero):
- **Tab System**: Two tabs in a single card component
  - **Tab A "Check Availability"**: 
    - Inputs: Start Date, End Date
    - Big 'Search' button (prominent CTA)
  - **Tab B "Browse Cars"**: 
    - 'View All Vehicles' button
- **Mobile**: Stack elements vertically
- **Touch Targets**: All buttons minimum 48px height (thumb-friendly)

### 2. FLEET CATALOG (Fleet) - "Grid" View

**Layout**: CSS Grid
- **Desktop**: 3 cards per row
- **Mobile**: 1 card per row

**CarCard Component Structure**:
- **Top**: Vehicle image (16:9 aspect ratio)
- **Middle**: 
  - Model Name (bold typography)
  - Transmission Badge (Auto/Manual visual indicator)
- **Bottom**: 
  - Left: Price display (e.g., "₱1,500/day")
  - Right: "Book Now" button
- **Unavailable State**: Gray out entire card, disable button when status ≠ 'available'

### 3. ADMIN DASHBOARD (Dashboard) - "Gantt" View

**Header Stats Row**:
- Three key metrics: Total Cars | Rented Today | Revenue Today
- Prominent, scannable layout

**Gantt Chart Timeline**:
- **Y-Axis (Left)**: List of car models
- **X-Axis (Top)**: Scrollable horizontal timeline (next 30 days)
- **Booking Bars**: 
  - Colored bars spanning start-to-end dates
  - Background color: Use vehicle's `color_hex` property
  - Text overlay: Display `guest_name` when space permits
- **Interaction**: Clicking bar opens "Booking Details Modal"
  - Shows: Guest info, ID verification status
  - Actions: Approve/Complete buttons

### 4. BOOKING FORM (Simulation Flow)

**Form Fields** (triggered from "Book Now"):
- Guest Name input
- Phone number input
- Start/End date selection

**ID Verification Section**:
- File upload input
- "Skip for now" button option
- **Logic Visual Feedback**:
  - If skipped: Display "Pending - ID Missing" status indicator
  - If uploaded: Display "Pending" status indicator

---

## Typography Hierarchy
- **Bold**: Model names, primary headings
- **Clear hierarchy**: Price displays, dates, guest names

## Spacing System
Use Tailwind spacing primitives: `2, 4, 8, 12, 16` units
- Cards: Consistent padding
- Grid gaps: Adequate breathing room
- Mobile: Increased vertical spacing for readability

## Component Library

**Core Components**:
- CarCard (with image, specs, pricing, CTA)
- Dual-tab card component (tabbed interface)
- Gantt chart bars (interactive, colored)
- Stats display cards
- Booking modal (overlay)
- Form inputs (date pickers, text fields, file upload)
- Toggle switch (role context)
- Badge components (transmission type, status indicators)

**Mobile-First Principles**:
- Thumb-friendly targets (minimum 48px)
- Stackable layouts
- Horizontal scrolling for Gantt timeline
- Touch-optimized interactions

## Images

**Hero Section**: 
- High-quality car background image
- Full-width, immersive treatment
- Overlay dual-action card floats on top

**Fleet Cards**: 
- Vehicle images at 16:9 aspect ratio
- Consistent framing across all cards

## Status Indicators
- **Available**: Active, clickable state
- **Maintenance/Unavailable**: Grayed out, disabled
- **Booking Status**: Color-coded badges
  - Pending (awaiting approval)
  - Pending - ID Missing (requires verification)
  - Confirmed
  - Completed
  - Cancelled

---

This design prioritizes mobile-first usability with clear visual hierarchy, intuitive role-switching, and rich administrative visualizations through the Gantt chart system.